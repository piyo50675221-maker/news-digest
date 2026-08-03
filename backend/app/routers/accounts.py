from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import csv_import
from ..auth import assert_can_access, get_current_user
from ..database import get_db
from ..models import Account, BalanceSnapshot, User
from ..schemas import (
    AccountCreate,
    AccountOut,
    AccountUpdate,
    BalanceSnapshotCreate,
    BalanceSnapshotOut,
    CsvImportConfirm,
    CsvImportPreview,
    CsvImportResult,
    Scope,
)

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


def _visible_accounts_query(user: User, scope: Scope | None):
    stmt = select(Account)
    if scope == "household":
        stmt = stmt.where(Account.scope == "household")
    elif scope == "personal":
        stmt = stmt.where(Account.scope == "personal", Account.owner_user_id == user.id)
    else:
        stmt = stmt.where(
            (Account.scope == "household")
            | ((Account.scope == "personal") & (Account.owner_user_id == user.id))
        )
    return stmt


def _to_account_out(account: Account) -> AccountOut:
    latest = account.balances[-1] if account.balances else None
    return AccountOut(
        id=account.id,
        scope=account.scope,
        owner_user_id=account.owner_user_id,
        account_type=account.account_type,
        asset_class=account.asset_class,
        institution_name=account.institution_name,
        account_name=account.account_name,
        currency=account.currency,
        notes=account.notes,
        latest_balance=float(latest.balance) if latest else None,
        latest_balance_date=latest.snapshot_date if latest else None,
    )


def _get_account_or_404(db: Session, account_id: int, user: User) -> Account:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="account not found")
    assert_can_access(account, user)
    return account


@router.get("", response_model=list[AccountOut])
def list_accounts(
    scope: Scope | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = db.scalars(_visible_accounts_query(user, scope)).all()
    return [_to_account_out(a) for a in accounts]


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = Account(
        scope=payload.scope,
        owner_user_id=user.id if payload.scope == "personal" else None,
        account_type=payload.account_type,
        asset_class=payload.asset_class,
        institution_name=payload.institution_name,
        account_name=payload.account_name,
        currency=payload.currency,
        notes=payload.notes,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _to_account_out(account)


@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    payload: AccountUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _get_account_or_404(db, account_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return _to_account_out(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _get_account_or_404(db, account_id, user)
    db.delete(account)
    db.commit()


@router.get("/{account_id}/balances", response_model=list[BalanceSnapshotOut])
def list_balances(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _get_account_or_404(db, account_id, user)
    return account.balances


@router.post("/{account_id}/balances", response_model=BalanceSnapshotOut, status_code=status.HTTP_201_CREATED)
def add_balance(
    account_id: int,
    payload: BalanceSnapshotCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _get_account_or_404(db, account_id, user)
    existing = db.scalar(
        select(BalanceSnapshot).where(
            BalanceSnapshot.account_id == account.id,
            BalanceSnapshot.snapshot_date == payload.snapshot_date,
        )
    )
    if existing:
        existing.balance = payload.balance
        snapshot = existing
    else:
        snapshot = BalanceSnapshot(
            account_id=account.id,
            snapshot_date=payload.snapshot_date,
            balance=payload.balance,
        )
        db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


@router.post("/{account_id}/balances/import/preview", response_model=CsvImportPreview)
async def import_preview(
    account_id: int,
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_account_or_404(db, account_id, user)
    raw = await file.read()
    try:
        text, encoding = csv_import.decode_csv_bytes(raw)
        headers, sample_rows = csv_import.parse_preview(text)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    token = csv_import.save_import_token(text)
    return CsvImportPreview(
        headers=headers,
        sample_rows=sample_rows,
        detected_encoding=encoding,
        token=token,
    )


@router.post("/{account_id}/balances/import/confirm", response_model=CsvImportResult)
def import_confirm(
    account_id: int,
    payload: CsvImportConfirm,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _get_account_or_404(db, account_id, user)
    try:
        text = csv_import.load_import_token(payload.token)
        rows = csv_import.parse_rows(text, payload.date_column, payload.balance_column)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    existing_by_date = {b.snapshot_date: b for b in account.balances}
    imported = updated = skipped = 0
    for snapshot_date, balance in rows:
        existing = existing_by_date.get(snapshot_date)
        if existing:
            if float(existing.balance) == balance:
                skipped += 1
                continue
            existing.balance = balance
            updated += 1
        else:
            db.add(BalanceSnapshot(account_id=account.id, snapshot_date=snapshot_date, balance=balance))
            imported += 1
    db.commit()
    csv_import.discard_import_token(payload.token)
    return CsvImportResult(imported=imported, updated=updated, skipped=skipped)

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Account, InheritanceItem, User
from ..schemas import InheritanceItemCreate, InheritanceItemOut, InheritanceItemUpdate

router = APIRouter(prefix="/api/inheritance-items", tags=["inheritance"])


def _to_out(item: InheritanceItem, db: Session) -> InheritanceItemOut:
    subject = db.get(User, item.subject_user_id) if item.subject_user_id else None
    account = db.get(Account, item.account_id) if item.account_id else None
    return InheritanceItemOut(
        id=item.id,
        subject_user_id=item.subject_user_id,
        subject_display_name=subject.display_name if subject else None,
        account_id=item.account_id,
        account_label=f"{account.institution_name} / {account.account_name}" if account else None,
        title=item.title,
        contact_info=item.contact_info,
        required_documents=item.required_documents,
        deadline_text=item.deadline_text,
        deadline_date=item.deadline_date,
        is_done=item.is_done,
        notes=item.notes,
    )


@router.get("", response_model=list[InheritanceItemOut])
def list_inheritance_items(
    subject_user_id: int | None = Query(default=None),
    account_id: int | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(InheritanceItem)
    if subject_user_id is not None:
        stmt = stmt.where(InheritanceItem.subject_user_id == subject_user_id)
    if account_id is not None:
        stmt = stmt.where(InheritanceItem.account_id == account_id)
    items = db.scalars(stmt.order_by(InheritanceItem.id)).all()
    return [_to_out(i, db) for i in items]


@router.post("", response_model=InheritanceItemOut, status_code=status.HTTP_201_CREATED)
def create_inheritance_item(
    payload: InheritanceItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = InheritanceItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_out(item, db)


@router.put("/{item_id}", response_model=InheritanceItemOut)
def update_inheritance_item(
    item_id: int,
    payload: InheritanceItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(InheritanceItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _to_out(item, db)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inheritance_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(InheritanceItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")
    db.delete(item)
    db.commit()

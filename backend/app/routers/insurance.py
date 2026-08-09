from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Insurance, User
from ..schemas import InsuranceCreate, InsuranceOut, InsuranceUpdate

router = APIRouter(prefix="/api/insurance", tags=["insurance"])


def _to_out(insurance: Insurance, db: Session) -> InsuranceOut:
    subject = db.get(User, insurance.subject_user_id) if insurance.subject_user_id else None
    return InsuranceOut(
        id=insurance.id,
        subject_user_id=insurance.subject_user_id,
        subject_display_name=subject.display_name if subject else None,
        insurance_type=insurance.insurance_type,
        company_name=insurance.company_name,
        product_name=insurance.product_name,
        policy_number=insurance.policy_number,
        insured_person=insurance.insured_person,
        beneficiary=insurance.beneficiary,
        coverage_summary=insurance.coverage_summary,
        coverage_amount=float(insurance.coverage_amount) if insurance.coverage_amount is not None else None,
        premium=float(insurance.premium) if insurance.premium is not None else None,
        premium_cycle=insurance.premium_cycle,
        renewal_date=insurance.renewal_date,
        contact_info=insurance.contact_info,
        notes=insurance.notes,
    )


@router.get("", response_model=list[InsuranceOut])
def list_insurance(
    subject_user_id: int | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Insurance)
    if subject_user_id is not None:
        stmt = stmt.where(Insurance.subject_user_id == subject_user_id)
    items = db.scalars(stmt.order_by(Insurance.id)).all()
    return [_to_out(i, db) for i in items]


@router.post("", response_model=InsuranceOut, status_code=status.HTTP_201_CREATED)
def create_insurance(
    payload: InsuranceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insurance = Insurance(**payload.model_dump())
    db.add(insurance)
    db.commit()
    db.refresh(insurance)
    return _to_out(insurance, db)


@router.put("/{insurance_id}", response_model=InsuranceOut)
def update_insurance(
    insurance_id: int,
    payload: InsuranceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insurance = db.get(Insurance, insurance_id)
    if insurance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="insurance not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(insurance, field, value)
    db.commit()
    db.refresh(insurance)
    return _to_out(insurance, db)


@router.delete("/{insurance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_insurance(
    insurance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insurance = db.get(Insurance, insurance_id)
    if insurance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="insurance not found")
    db.delete(insurance)
    db.commit()

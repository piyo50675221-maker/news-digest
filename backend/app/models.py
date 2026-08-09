import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

ACCOUNT_TYPES = ("bank", "securities", "pension", "crypto", "credit_card")
ASSET_CLASSES = ("cash", "stock", "fund", "pension", "crypto", "liability")
SCOPES = ("personal", "household")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    accounts: Mapped[list["Account"]] = relationship(back_populates="owner")


class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = (
        CheckConstraint(f"scope IN {SCOPES}", name="ck_accounts_scope"),
        CheckConstraint(f"account_type IN {ACCOUNT_TYPES}", name="ck_accounts_account_type"),
        CheckConstraint(f"asset_class IN {ASSET_CLASSES}", name="ck_accounts_asset_class"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    scope: Mapped[str] = mapped_column(String(20))
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    account_type: Mapped[str] = mapped_column(String(20))
    asset_class: Mapped[str] = mapped_column(String(20))
    institution_name: Mapped[str] = mapped_column(String(200))
    account_name: Mapped[str] = mapped_column(String(200))
    currency: Mapped[str] = mapped_column(String(10), default="JPY")
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    owner: Mapped["User | None"] = relationship(back_populates="accounts")
    balances: Mapped[list["BalanceSnapshot"]] = relationship(
        back_populates="account", cascade="all, delete-orphan", order_by="BalanceSnapshot.snapshot_date"
    )


class BalanceSnapshot(Base):
    __tablename__ = "balance_snapshots"
    __table_args__ = (UniqueConstraint("account_id", "snapshot_date", name="uq_account_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    snapshot_date: Mapped[datetime.date] = mapped_column(Date)
    balance: Mapped[float] = mapped_column(Numeric(18, 2))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    account: Mapped["Account"] = relationship(back_populates="balances")


class Insurance(Base):
    __tablename__ = "insurances"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    insurance_type: Mapped[str] = mapped_column(String(50))
    company_name: Mapped[str] = mapped_column(String(200))
    product_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    policy_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insured_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    beneficiary: Mapped[str | None] = mapped_column(String(200), nullable=True)
    coverage_summary: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    coverage_amount: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    premium: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    premium_cycle: Mapped[str | None] = mapped_column(String(20), nullable=True)
    renewal_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    contact_info: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class InheritanceItem(Base):
    __tablename__ = "inheritance_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    contact_info: Mapped[str | None] = mapped_column(String(500), nullable=True)
    required_documents: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    deadline_text: Mapped[str | None] = mapped_column(String(200), nullable=True)
    deadline_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

Scope = Literal["personal", "household"]
AccountType = Literal["bank", "securities", "pension", "crypto", "credit_card"]
AssetClass = Literal["cash", "stock", "fund", "pension", "crypto", "liability"]


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str


class BalanceSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    snapshot_date: datetime.date
    balance: float


class BalanceSnapshotCreate(BaseModel):
    snapshot_date: datetime.date
    balance: float


class AccountCreate(BaseModel):
    scope: Scope
    account_type: AccountType
    asset_class: AssetClass
    institution_name: str
    account_name: str
    currency: str = "JPY"
    notes: str | None = None

    @field_validator("institution_name", "account_name")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class AccountUpdate(BaseModel):
    scope: Scope | None = None
    account_type: AccountType | None = None
    asset_class: AssetClass | None = None
    institution_name: str | None = None
    account_name: str | None = None
    currency: str | None = None
    notes: str | None = None


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scope: Scope
    owner_user_id: int | None
    account_type: AccountType
    asset_class: AssetClass
    institution_name: str
    account_name: str
    currency: str
    notes: str | None
    latest_balance: float | None = None
    latest_balance_date: datetime.date | None = None


class CsvImportPreviewRow(BaseModel):
    raw: list[str]


class CsvImportPreview(BaseModel):
    headers: list[str]
    sample_rows: list[list[str]]
    detected_encoding: str
    token: str


class CsvImportConfirm(BaseModel):
    token: str
    date_column: str
    balance_column: str


class CsvImportResult(BaseModel):
    imported: int
    updated: int
    skipped: int


class PortfolioBreakdownItem(BaseModel):
    key: str
    label: str
    total: float


class PortfolioAccountItem(BaseModel):
    account: AccountOut
    balance: float
    balance_date: datetime.date | None


class PortfolioSummary(BaseModel):
    total_net_worth: float
    by_asset_class: list[PortfolioBreakdownItem]
    by_account_type: list[PortfolioBreakdownItem]
    accounts: list[PortfolioAccountItem]


class NetWorthHistoryPoint(BaseModel):
    date: datetime.date
    total: float


class PortfolioHistory(BaseModel):
    points: list[NetWorthHistoryPoint]


class InsuranceCreate(BaseModel):
    subject_user_id: int | None = None
    insurance_type: str
    company_name: str
    product_name: str | None = None
    policy_number: str | None = None
    insured_person: str | None = None
    beneficiary: str | None = None
    coverage_summary: str | None = None
    coverage_amount: float | None = None
    premium: float | None = None
    premium_cycle: str | None = None
    renewal_date: datetime.date | None = None
    contact_info: str | None = None
    notes: str | None = None

    @field_validator("company_name", "insurance_type")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class InsuranceUpdate(BaseModel):
    subject_user_id: int | None = None
    insurance_type: str | None = None
    company_name: str | None = None
    product_name: str | None = None
    policy_number: str | None = None
    insured_person: str | None = None
    beneficiary: str | None = None
    coverage_summary: str | None = None
    coverage_amount: float | None = None
    premium: float | None = None
    premium_cycle: str | None = None
    renewal_date: datetime.date | None = None
    contact_info: str | None = None
    notes: str | None = None


class InsuranceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_user_id: int | None
    subject_display_name: str | None = None
    insurance_type: str
    company_name: str
    product_name: str | None
    policy_number: str | None
    insured_person: str | None
    beneficiary: str | None
    coverage_summary: str | None
    coverage_amount: float | None
    premium: float | None
    premium_cycle: str | None
    renewal_date: datetime.date | None
    contact_info: str | None
    notes: str | None


class InheritanceItemCreate(BaseModel):
    subject_user_id: int | None = None
    account_id: int | None = None
    title: str
    contact_info: str | None = None
    required_documents: str | None = None
    deadline_text: str | None = None
    deadline_date: datetime.date | None = None
    is_done: bool = False
    notes: str | None = None

    @field_validator("title")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class InheritanceItemUpdate(BaseModel):
    subject_user_id: int | None = None
    account_id: int | None = None
    title: str | None = None
    contact_info: str | None = None
    required_documents: str | None = None
    deadline_text: str | None = None
    deadline_date: datetime.date | None = None
    is_done: bool | None = None
    notes: str | None = None


class InheritanceItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_user_id: int | None
    subject_display_name: str | None = None
    account_id: int | None
    account_label: str | None = None
    title: str
    contact_info: str | None
    required_documents: str | None
    deadline_text: str | None
    deadline_date: datetime.date | None
    is_done: bool
    notes: str | None

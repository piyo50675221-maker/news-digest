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

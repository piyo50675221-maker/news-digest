from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Account, User
from ..schemas import (
    AccountOut,
    NetWorthHistoryPoint,
    PortfolioAccountItem,
    PortfolioBreakdownItem,
    PortfolioHistory,
    PortfolioSummary,
    Scope,
)
from .accounts import _to_account_out, _visible_accounts_query

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

ASSET_CLASS_LABELS = {
    "cash": "現金・預金",
    "stock": "株式",
    "fund": "投資信託",
    "pension": "年金",
    "crypto": "暗号資産",
    "liability": "負債(クレカ利用額等)",
}

ACCOUNT_TYPE_LABELS = {
    "bank": "銀行口座",
    "securities": "証券口座",
    "pension": "年金",
    "crypto": "暗号資産",
    "credit_card": "クレジットカード",
}


def _sign(account: Account) -> int:
    return -1 if account.asset_class == "liability" else 1


@router.get("", response_model=PortfolioSummary)
def get_portfolio(
    scope: Scope | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = db.scalars(_visible_accounts_query(user, scope)).all()

    by_asset_class: dict[str, float] = defaultdict(float)
    by_account_type: dict[str, float] = defaultdict(float)
    total_net_worth = 0.0
    account_items: list[PortfolioAccountItem] = []

    for account in accounts:
        latest = account.balances[-1] if account.balances else None
        balance = float(latest.balance) if latest else 0.0
        by_asset_class[account.asset_class] += balance
        by_account_type[account.account_type] += balance
        total_net_worth += balance * _sign(account)
        account_items.append(
            PortfolioAccountItem(
                account=_to_account_out(account),
                balance=balance,
                balance_date=latest.snapshot_date if latest else None,
            )
        )

    return PortfolioSummary(
        total_net_worth=total_net_worth,
        by_asset_class=[
            PortfolioBreakdownItem(key=k, label=ASSET_CLASS_LABELS.get(k, k), total=v)
            for k, v in sorted(by_asset_class.items())
        ],
        by_account_type=[
            PortfolioBreakdownItem(key=k, label=ACCOUNT_TYPE_LABELS.get(k, k), total=v)
            for k, v in sorted(by_account_type.items())
        ],
        accounts=account_items,
    )


@router.get("/history", response_model=PortfolioHistory)
def get_portfolio_history(
    scope: Scope | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = db.scalars(_visible_accounts_query(user, scope)).all()

    all_dates = sorted({b.snapshot_date for a in accounts for b in a.balances})
    idx = {a.id: -1 for a in accounts}
    last_val = {a.id: 0.0 for a in accounts}

    points: list[NetWorthHistoryPoint] = []
    for d in all_dates:
        for account in accounts:
            blist = account.balances
            while idx[account.id] + 1 < len(blist) and blist[idx[account.id] + 1].snapshot_date <= d:
                idx[account.id] += 1
                last_val[account.id] = float(blist[idx[account.id]].balance)
        total = sum(last_val[a.id] * _sign(a) for a in accounts)
        points.append(NetWorthHistoryPoint(date=d, total=total))

    return PortfolioHistory(points=points)

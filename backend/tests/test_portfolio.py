from .conftest import login


def _create_account(client, **overrides):
    payload = {
        "scope": "household",
        "account_type": "bank",
        "asset_class": "cash",
        "institution_name": "テスト銀行",
        "account_name": "口座",
    }
    payload.update(overrides)
    resp = client.post("/api/accounts", json=payload)
    assert resp.status_code == 201
    return resp.json()["id"]


def test_net_worth_subtracts_credit_card_liability(client):
    login(client, "alice", "alicepw")

    bank_id = _create_account(client, institution_name="銀行A", asset_class="cash", account_type="bank")
    card_id = _create_account(
        client, institution_name="カードA", asset_class="liability", account_type="credit_card"
    )

    client.post(f"/api/accounts/{bank_id}/balances", json={"snapshot_date": "2026-08-01", "balance": 1000000})
    client.post(f"/api/accounts/{card_id}/balances", json={"snapshot_date": "2026-08-01", "balance": 50000})

    resp = client.get("/api/portfolio", params={"scope": "household"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_net_worth"] == 950000

    by_class = {item["key"]: item["total"] for item in data["by_asset_class"]}
    assert by_class["cash"] == 1000000
    assert by_class["liability"] == 50000


def test_portfolio_history_forward_fills_latest_balance(client):
    login(client, "alice", "alicepw")
    bank_id = _create_account(client)

    client.post(f"/api/accounts/{bank_id}/balances", json={"snapshot_date": "2026-07-01", "balance": 100000})
    client.post(f"/api/accounts/{bank_id}/balances", json={"snapshot_date": "2026-08-01", "balance": 150000})

    resp = client.get("/api/portfolio/history", params={"scope": "household"})
    assert resp.status_code == 200
    points = resp.json()["points"]
    assert points == [
        {"date": "2026-07-01", "total": 100000.0},
        {"date": "2026-08-01", "total": 150000.0},
    ]

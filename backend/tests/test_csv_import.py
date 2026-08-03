import io

from .conftest import login


def test_csv_import_preview_and_confirm_upserts_balances(client):
    login(client, "alice", "alicepw")

    resp = client.post(
        "/api/accounts",
        json={
            "scope": "household",
            "account_type": "bank",
            "asset_class": "cash",
            "institution_name": "銀行",
            "account_name": "口座",
        },
    )
    account_id = resp.json()["id"]

    csv_content = "日付,残高\n2026-07-01,\"1,000,000\"\n2026-08-01,1200000\n"
    files = {"file": ("balances.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    preview = client.post(f"/api/accounts/{account_id}/balances/import/preview", files=files)
    assert preview.status_code == 200
    preview_data = preview.json()
    assert preview_data["headers"] == ["日付", "残高"]
    token = preview_data["token"]

    confirm = client.post(
        f"/api/accounts/{account_id}/balances/import/confirm",
        json={"token": token, "date_column": "日付", "balance_column": "残高"},
    )
    assert confirm.status_code == 200
    assert confirm.json() == {"imported": 2, "updated": 0, "skipped": 0}

    balances = client.get(f"/api/accounts/{account_id}/balances").json()
    assert {(b["snapshot_date"], b["balance"]) for b in balances} == {
        ("2026-07-01", 1000000.0),
        ("2026-08-01", 1200000.0),
    }


def test_csv_import_confirm_with_unknown_token_fails(client):
    login(client, "alice", "alicepw")
    resp = client.post(
        "/api/accounts",
        json={
            "scope": "household",
            "account_type": "bank",
            "asset_class": "cash",
            "institution_name": "銀行",
            "account_name": "口座",
        },
    )
    account_id = resp.json()["id"]

    confirm = client.post(
        f"/api/accounts/{account_id}/balances/import/confirm",
        json={"token": "does-not-exist", "date_column": "日付", "balance_column": "残高"},
    )
    assert confirm.status_code == 400

from fastapi.testclient import TestClient

from .conftest import login


def test_personal_account_hidden_from_other_user(app_module):
    alice = TestClient(app_module)
    bob = TestClient(app_module)
    login(alice, "alice", "alicepw")
    login(bob, "bob", "bobpw")

    resp = alice.post(
        "/api/accounts",
        json={
            "scope": "personal",
            "account_type": "bank",
            "asset_class": "cash",
            "institution_name": "Alice Bank",
            "account_name": "普通預金",
        },
    )
    assert resp.status_code == 201
    account_id = resp.json()["id"]

    alice_accounts = alice.get("/api/accounts", params={"scope": "personal"}).json()
    assert any(a["id"] == account_id for a in alice_accounts)

    bob_accounts = bob.get("/api/accounts", params={"scope": "personal"}).json()
    assert not any(a["id"] == account_id for a in bob_accounts)

    # bob cannot read or modify alice's personal account directly either
    assert bob.get(f"/api/accounts/{account_id}/balances").status_code == 403
    assert bob.put(f"/api/accounts/{account_id}", json={"notes": "hacked"}).status_code == 403
    assert bob.delete(f"/api/accounts/{account_id}").status_code == 403


def test_household_account_shared_and_editable_by_both(app_module):
    alice = TestClient(app_module)
    bob = TestClient(app_module)
    login(alice, "alice", "alicepw")
    login(bob, "bob", "bobpw")

    resp = alice.post(
        "/api/accounts",
        json={
            "scope": "household",
            "account_type": "bank",
            "asset_class": "cash",
            "institution_name": "家族銀行",
            "account_name": "生活費口座",
        },
    )
    assert resp.status_code == 201
    account_id = resp.json()["id"]

    bob_accounts = bob.get("/api/accounts", params={"scope": "household"}).json()
    assert any(a["id"] == account_id for a in bob_accounts)

    update_resp = bob.put(f"/api/accounts/{account_id}", json={"notes": "bob edited"})
    assert update_resp.status_code == 200
    assert update_resp.json()["notes"] == "bob edited"

    balance_resp = bob.post(
        f"/api/accounts/{account_id}/balances",
        json={"snapshot_date": "2026-08-01", "balance": 500000},
    )
    assert balance_resp.status_code == 201

    alice_view = alice.get(f"/api/accounts/{account_id}/balances")
    assert alice_view.status_code == 200
    assert len(alice_view.json()) == 1


def test_requires_login(client):
    resp = client.get("/api/accounts")
    assert resp.status_code == 401

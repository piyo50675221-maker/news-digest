from fastapi.testclient import TestClient

from .conftest import login


def test_insurance_crud_and_not_scoped(app_module):
    alice = TestClient(app_module)
    login(alice, "alice", "alicepw")

    users = alice.get("/api/users").json()
    alice_id = next(u["id"] for u in users if u["username"] == "alice")

    resp = alice.post(
        "/api/insurance",
        json={
            "subject_user_id": alice_id,
            "insurance_type": "生命保険",
            "company_name": "テスト生命",
            "coverage_amount": 20_000_000,
            "premium": 8000,
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["subject_display_name"] == "Alice"
    insurance_id = body["id"]

    listed = alice.get("/api/insurance").json()
    assert any(i["id"] == insurance_id for i in listed)

    filtered = alice.get("/api/insurance", params={"subject_user_id": alice_id}).json()
    assert any(i["id"] == insurance_id for i in filtered)

    updated = alice.put(f"/api/insurance/{insurance_id}", json={"premium": 9000})
    assert updated.status_code == 200
    assert updated.json()["premium"] == 9000

    assert alice.delete(f"/api/insurance/{insurance_id}").status_code == 204
    assert not any(i["id"] == insurance_id for i in alice.get("/api/insurance").json())


def test_inheritance_item_linked_to_account(app_module):
    alice = TestClient(app_module)
    login(alice, "alice", "alicepw")

    account = alice.post(
        "/api/accounts",
        json={
            "scope": "household",
            "account_type": "bank",
            "asset_class": "cash",
            "institution_name": "Test Bank",
            "account_name": "普通",
        },
    ).json()

    resp = alice.post(
        "/api/inheritance-items",
        json={
            "account_id": account["id"],
            "title": "解約手続き",
            "required_documents": "戸籍謄本",
            "deadline_text": "死亡から10ヶ月以内",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["account_label"] == "Test Bank / 普通"
    item_id = body["id"]

    by_account = alice.get("/api/inheritance-items", params={"account_id": account["id"]}).json()
    assert any(i["id"] == item_id for i in by_account)

    done = alice.put(f"/api/inheritance-items/{item_id}", json={"is_done": True})
    assert done.status_code == 200
    assert done.json()["is_done"] is True

    assert alice.delete(f"/api/inheritance-items/{item_id}").status_code == 204

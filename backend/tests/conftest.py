import sys

import pytest


@pytest.fixture()
def app_module(monkeypatch, tmp_path):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    for mod in list(sys.modules):
        if mod.startswith("app"):
            del sys.modules[mod]

    from app.auth import hash_password
    from app.database import Base, SessionLocal, engine
    from app.main import app
    from app.models import User

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    alice = User(username="alice", display_name="Alice", password_hash=hash_password("alicepw"))
    bob = User(username="bob", display_name="Bob", password_hash=hash_password("bobpw"))
    db.add_all([alice, bob])
    db.commit()
    db.close()

    return app


@pytest.fixture()
def client(app_module):
    from fastapi.testclient import TestClient

    with TestClient(app_module) as test_client:
        yield test_client


def login(client, username, password):
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200
    return resp

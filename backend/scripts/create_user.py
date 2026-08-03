"""CLI to create the household's users (run once per user, e.g. self and spouse).

Usage:
    python scripts/create_user.py <username> <display_name>
    (will prompt for a password)
"""

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import User


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(1)

    username, display_name = sys.argv[1], sys.argv[2]
    password = getpass.getpass("Password: ")
    password_confirm = getpass.getpass("Password (confirm): ")
    if password != password_confirm:
        print("Passwords did not match.")
        raise SystemExit(1)
    if not password:
        print("Password must not be empty.")
        raise SystemExit(1)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.username == username)):
            print(f"User '{username}' already exists.")
            raise SystemExit(1)
        user = User(username=username, display_name=display_name, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        print(f"Created user '{username}' ({display_name}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()

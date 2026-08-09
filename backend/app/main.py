import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .database import Base, engine
from .routers import accounts, auth, inheritance, insurance, portfolio, users

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
SECRET_KEY_FILE = DATA_DIR / "secret_key.txt"


def _load_or_create_secret_key() -> str:
    if SECRET_KEY_FILE.exists():
        return SECRET_KEY_FILE.read_text().strip()
    key = secrets.token_hex(32)
    SECRET_KEY_FILE.write_text(key)
    return key


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="資産管理アプリ", lifespan=lifespan)

app.add_middleware(SessionMiddleware, secret_key=_load_or_create_secret_key(), same_site="lax")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(accounts.router)
app.include_router(portfolio.router)
app.include_router(insurance.router)
app.include_router(inheritance.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

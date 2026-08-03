import csv
import datetime
import io
import re
import secrets
from pathlib import Path

IMPORT_TMP_DIR = Path(__file__).resolve().parent.parent / "data" / "tmp_imports"
IMPORT_TMP_DIR.mkdir(parents=True, exist_ok=True)

_DATE_FORMATS = ["%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d"]
_NUMERIC_STRIP_RE = re.compile(r"[^0-9.\-]")


def decode_csv_bytes(raw: bytes) -> tuple[str, str]:
    """Decode CSV bytes trying UTF-8 (with/without BOM) then Shift_JIS (CP932).

    Returns (decoded_text, encoding_name).
    """
    for encoding in ("utf-8-sig", "utf-8", "cp932"):
        try:
            return raw.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    raise ValueError("could not decode file as UTF-8 or Shift_JIS(CP932)")


def parse_preview(text: str, max_rows: int = 10) -> tuple[list[str], list[list[str]]]:
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise ValueError("CSV file is empty")
    headers = rows[0]
    sample_rows = rows[1 : 1 + max_rows]
    return headers, sample_rows


def save_import_token(text: str) -> str:
    token = secrets.token_urlsafe(16)
    (IMPORT_TMP_DIR / f"{token}.csv").write_text(text, encoding="utf-8")
    return token


def load_import_token(token: str) -> str:
    path = IMPORT_TMP_DIR / f"{token}.csv"
    if not path.exists():
        raise ValueError("import session expired or not found, please re-upload the file")
    return path.read_text(encoding="utf-8")


def discard_import_token(token: str) -> None:
    path = IMPORT_TMP_DIR / f"{token}.csv"
    path.unlink(missing_ok=True)


def parse_date(value: str) -> datetime.date:
    value = value.strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"could not parse date: {value!r}")


def parse_balance(value: str) -> float:
    cleaned = _NUMERIC_STRIP_RE.sub("", value.strip())
    if not cleaned or cleaned in ("-", "."):
        raise ValueError(f"could not parse balance: {value!r}")
    return float(cleaned)


def parse_rows(text: str, date_column: str, balance_column: str) -> list[tuple[datetime.date, float]]:
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise ValueError("CSV file has no header row")
    if date_column not in reader.fieldnames or balance_column not in reader.fieldnames:
        raise ValueError("selected columns not found in CSV header")

    results = []
    for row in reader:
        raw_date = row.get(date_column)
        raw_balance = row.get(balance_column)
        if raw_date is None or raw_balance is None or not raw_date.strip():
            continue
        results.append((parse_date(raw_date), parse_balance(raw_balance)))
    return results

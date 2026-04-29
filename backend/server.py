from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------- Configuration ----------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MIN = 60 * 24 * 7  # 7 days for friendlier UX

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Aplikasi Keuangan Saya")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Helpers ----------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MIN),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_MIN * 60,
        path="/",
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(key="access_token", path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Tidak terautentikasi")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token kedaluwarsa")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Token tidak valid")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan")
    return user


# ---------- Models ----------
class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: datetime


class TransactionIn(BaseModel):
    type: Literal["income", "expense"]
    amount: float = Field(gt=0)
    category: str
    description: Optional[str] = ""
    date: Optional[str] = None  # ISO date
    wallet_id: Optional[str] = None  # source wallet (optional)


class TransactionOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: str
    amount: float
    category: str
    description: str
    date: str
    created_at: str
    wallet_id: Optional[str] = None


class BudgetIn(BaseModel):
    category: str
    amount: float = Field(gt=0)
    month: str  # format "YYYY-MM"


class BudgetOut(BaseModel):
    id: str
    user_id: str
    category: str
    amount: float
    month: str


class GoalIn(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = 0
    deadline: Optional[str] = None


class GoalOut(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[str] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[str] = None


class WalletIn(BaseModel):
    name: str
    type: Literal["bank", "ewallet", "cash", "other"]
    balance: float = 0
    color: Optional[str] = None  # hex like "#118EEA"
    icon: Optional[str] = None   # short label like "BCA", "DANA"


class WalletUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["bank", "ewallet", "cash", "other"]] = None
    balance: Optional[float] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class WalletOut(BaseModel):
    id: str
    user_id: str
    name: str
    type: str
    balance: float
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: str


class VoiceParseReq(BaseModel):
    text: str


# ---------- Default Categories ----------
DEFAULT_CATEGORIES = {
    "expense": [
        "Makanan", "Transportasi", "Belanja", "Tagihan", "Hiburan",
        "Kesehatan", "Pendidikan", "Rumah", "Lainnya"
    ],
    "income": [
        "Gaji", "Bonus", "Investasi", "Bisnis", "Hadiah", "Lainnya"
    ],
}


# ---------- Auth Endpoints ----------
@api_router.post("/auth/register", response_model=UserOut)
async def register(req: RegisterReq, response: Response):
    email = req.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    user_doc = {
        "id": user_id,
        "name": req.name,
        "email": email,
        "password_hash": hash_password(req.password),
        "created_at": now.isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return UserOut(id=user_id, name=req.name, email=email, created_at=now)


@api_router.post("/auth/login", response_model=UserOut)
async def login(req: LoginReq, response: Response):
    email = req.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return UserOut(
        id=user["id"], name=user["name"], email=email,
        created_at=datetime.fromisoformat(user["created_at"])
    )


@api_router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Berhasil keluar"}


@api_router.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(
        id=user["id"], name=user["name"], email=user["email"],
        created_at=datetime.fromisoformat(user["created_at"])
    )


# ---------- Categories ----------
@api_router.get("/categories")
async def get_categories():
    return DEFAULT_CATEGORIES


# ---------- Transactions ----------
async def _apply_wallet_delta(user_id: str, wallet_id: Optional[str], ttype: str, amount: float, sign: int = 1):
    """Adjust wallet balance. sign=+1 to apply, -1 to reverse."""
    if not wallet_id:
        return
    delta = amount if ttype == "income" else -amount
    delta *= sign
    await db.wallets.update_one(
        {"id": wallet_id, "user_id": user_id},
        {"$inc": {"balance": delta}},
    )


@api_router.post("/transactions", response_model=TransactionOut)
async def create_transaction(t: TransactionIn, user=Depends(get_current_user)):
    tx_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    date = t.date or now.date().isoformat()
    # Validate wallet ownership if provided
    if t.wallet_id:
        w = await db.wallets.find_one({"id": t.wallet_id, "user_id": user["id"]}, {"_id": 0})
        if not w:
            raise HTTPException(status_code=400, detail="Dompet tidak ditemukan")
    doc = {
        "id": tx_id,
        "user_id": user["id"],
        "type": t.type,
        "amount": float(t.amount),
        "category": t.category,
        "description": t.description or "",
        "date": date,
        "created_at": now.isoformat(),
        "wallet_id": t.wallet_id,
    }
    await db.transactions.insert_one(doc)
    await _apply_wallet_delta(user["id"], t.wallet_id, t.type, float(t.amount), +1)
    doc.pop("_id", None)
    return TransactionOut(**doc)


@api_router.get("/transactions", response_model=List[TransactionOut])
async def list_transactions(
    user=Depends(get_current_user),
    type: Optional[str] = None,
    category: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = 500,
):
    query: dict = {"user_id": user["id"]}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if start or end:
        date_q: dict = {}
        if start:
            date_q["$gte"] = start
        if end:
            date_q["$lte"] = end
        query["date"] = date_q
    cursor = db.transactions.find(query, {"_id": 0}).sort("date", -1).limit(limit)
    return await cursor.to_list(length=limit)


@api_router.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: str, user=Depends(get_current_user)):
    existing = await db.transactions.find_one({"id": tx_id, "user_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    await db.transactions.delete_one({"id": tx_id, "user_id": user["id"]})
    # Reverse wallet effect
    await _apply_wallet_delta(user["id"], existing.get("wallet_id"), existing["type"], existing["amount"], -1)
    return {"message": "Terhapus"}


@api_router.put("/transactions/{tx_id}", response_model=TransactionOut)
async def update_transaction(tx_id: str, t: TransactionIn, user=Depends(get_current_user)):
    existing = await db.transactions.find_one({"id": tx_id, "user_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    if t.wallet_id:
        w = await db.wallets.find_one({"id": t.wallet_id, "user_id": user["id"]}, {"_id": 0})
        if not w:
            raise HTTPException(status_code=400, detail="Dompet tidak ditemukan")
    update = {
        "type": t.type, "amount": float(t.amount), "category": t.category,
        "description": t.description or "", "date": t.date or datetime.now(timezone.utc).date().isoformat(),
        "wallet_id": t.wallet_id,
    }
    # Reverse old, apply new (handles wallet change too)
    await _apply_wallet_delta(user["id"], existing.get("wallet_id"), existing["type"], existing["amount"], -1)
    await db.transactions.update_one({"id": tx_id, "user_id": user["id"]}, {"$set": update})
    await _apply_wallet_delta(user["id"], t.wallet_id, t.type, float(t.amount), +1)
    doc = await db.transactions.find_one({"id": tx_id}, {"_id": 0})
    return TransactionOut(**doc)


# ---------- Stats ----------
@api_router.get("/stats/summary")
async def stats_summary(user=Depends(get_current_user), month: Optional[str] = None):
    """month format 'YYYY-MM'. If None -> current month."""
    if not month:
        now = datetime.now(timezone.utc)
        month = f"{now.year:04d}-{now.month:02d}"
    start = f"{month}-01"
    # compute end
    y, m = month.split("-")
    yy, mm = int(y), int(m)
    if mm == 12:
        next_start = f"{yy+1:04d}-01-01"
    else:
        next_start = f"{yy:04d}-{mm+1:02d}-01"

    txs = await db.transactions.find(
        {"user_id": user["id"], "date": {"$gte": start, "$lt": next_start}},
        {"_id": 0}
    ).to_list(length=10000)

    total_income = sum(t["amount"] for t in txs if t["type"] == "income")
    total_expense = sum(t["amount"] for t in txs if t["type"] == "expense")
    by_category: dict = {}
    for t in txs:
        if t["type"] == "expense":
            by_category[t["category"]] = by_category.get(t["category"], 0) + t["amount"]

    # all-time balance from transactions
    all_txs = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=100000)
    balance = sum((t["amount"] if t["type"] == "income" else -t["amount"]) for t in all_txs)

    # total balance from wallets (preferred saldo total when user has wallets)
    wallets = await db.wallets.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=500)
    wallet_balance = sum(w.get("balance", 0) for w in wallets)
    has_wallets = len(wallets) > 0

    # last 6 months
    months_data = []
    today = datetime.now(timezone.utc).date()
    for i in range(5, -1, -1):
        ref_year = today.year
        ref_month = today.month - i
        while ref_month <= 0:
            ref_month += 12
            ref_year -= 1
        m_str = f"{ref_year:04d}-{ref_month:02d}"
        m_start = f"{m_str}-01"
        if ref_month == 12:
            m_end = f"{ref_year+1:04d}-01-01"
        else:
            m_end = f"{ref_year:04d}-{ref_month+1:02d}-01"
        m_txs = [t for t in all_txs if m_start <= t["date"] < m_end]
        months_data.append({
            "month": m_str,
            "income": sum(t["amount"] for t in m_txs if t["type"] == "income"),
            "expense": sum(t["amount"] for t in m_txs if t["type"] == "expense"),
        })

    return {
        "month": month,
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "wallet_balance": wallet_balance,
        "has_wallets": has_wallets,
        "by_category": [{"category": k, "amount": v} for k, v in by_category.items()],
        "trend": months_data,
        "transaction_count": len(txs),
    }


# ---------- Budgets ----------
@api_router.post("/budgets", response_model=BudgetOut)
async def create_budget(b: BudgetIn, user=Depends(get_current_user)):
    bid = str(uuid.uuid4())
    doc = {"id": bid, "user_id": user["id"], "category": b.category, "amount": float(b.amount), "month": b.month}
    # upsert per (user, category, month)
    await db.budgets.update_one(
        {"user_id": user["id"], "category": b.category, "month": b.month},
        {"$set": doc},
        upsert=True,
    )
    saved = await db.budgets.find_one(
        {"user_id": user["id"], "category": b.category, "month": b.month},
        {"_id": 0},
    )
    return BudgetOut(**saved)


@api_router.get("/budgets", response_model=List[BudgetOut])
async def list_budgets(user=Depends(get_current_user), month: Optional[str] = None):
    q: dict = {"user_id": user["id"]}
    if month:
        q["month"] = month
    items = await db.budgets.find(q, {"_id": 0}).to_list(length=500)
    return items


@api_router.delete("/budgets/{bid}")
async def delete_budget(bid: str, user=Depends(get_current_user)):
    res = await db.budgets.delete_one({"id": bid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Anggaran tidak ditemukan")
    return {"message": "Terhapus"}


# ---------- Wallets ----------
DEFAULT_WALLET_COLOR = {
    "bank": "#118EEA",
    "ewallet": "#0095DA",
    "cash": "#21BE7C",
    "other": "#5C677D",
}


@api_router.post("/wallets", response_model=WalletOut)
async def create_wallet(w: WalletIn, user=Depends(get_current_user)):
    wid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": wid,
        "user_id": user["id"],
        "name": w.name,
        "type": w.type,
        "balance": float(w.balance or 0),
        "color": w.color or DEFAULT_WALLET_COLOR.get(w.type, "#118EEA"),
        "icon": w.icon or w.name[:3].upper(),
        "created_at": now,
    }
    await db.wallets.insert_one(doc)
    doc.pop("_id", None)
    return WalletOut(**doc)


@api_router.get("/wallets", response_model=List[WalletOut])
async def list_wallets(user=Depends(get_current_user)):
    items = await db.wallets.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(length=500)
    return items


@api_router.put("/wallets/{wid}", response_model=WalletOut)
async def update_wallet(wid: str, w: WalletUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in w.model_dump().items() if v is not None}
    if "balance" in update:
        update["balance"] = float(update["balance"])
    if not update:
        raise HTTPException(status_code=400, detail="Tidak ada perubahan")
    res = await db.wallets.update_one({"id": wid, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dompet tidak ditemukan")
    doc = await db.wallets.find_one({"id": wid}, {"_id": 0})
    return WalletOut(**doc)


@api_router.delete("/wallets/{wid}")
async def delete_wallet(wid: str, user=Depends(get_current_user)):
    res = await db.wallets.delete_one({"id": wid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dompet tidak ditemukan")
    return {"message": "Terhapus"}


# ---------- Savings Goals ----------
@api_router.post("/goals", response_model=GoalOut)
async def create_goal(g: GoalIn, user=Depends(get_current_user)):
    gid = str(uuid.uuid4())
    doc = {
        "id": gid, "user_id": user["id"], "name": g.name,
        "target_amount": float(g.target_amount),
        "current_amount": float(g.current_amount or 0),
        "deadline": g.deadline,
    }
    await db.goals.insert_one(doc)
    doc.pop("_id", None)
    return GoalOut(**doc)


@api_router.get("/goals", response_model=List[GoalOut])
async def list_goals(user=Depends(get_current_user)):
    items = await db.goals.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=500)
    return items


@api_router.put("/goals/{gid}", response_model=GoalOut)
async def update_goal(gid: str, g: GoalUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in g.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Tidak ada perubahan")
    res = await db.goals.update_one({"id": gid, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Target tidak ditemukan")
    doc = await db.goals.find_one({"id": gid}, {"_id": 0})
    return GoalOut(**doc)


@api_router.delete("/goals/{gid}")
async def delete_goal(gid: str, user=Depends(get_current_user)):
    res = await db.goals.delete_one({"id": gid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Target tidak ditemukan")
    return {"message": "Terhapus"}


# ---------- Voice Parser (Indonesian rule-based) ----------
NUMBER_WORDS_ID = {
    "nol": 0, "satu": 1, "dua": 2, "tiga": 3, "empat": 4, "lima": 5,
    "enam": 6, "tujuh": 7, "delapan": 8, "sembilan": 9, "sepuluh": 10,
    "sebelas": 11, "duabelas": 12, "lima belas": 15, "dua puluh": 20,
    "tiga puluh": 30, "empat puluh": 40, "lima puluh": 50, "seratus": 100,
    "seribu": 1000, "sejuta": 1000000,
}

CATEGORY_KEYWORDS = {
    # expense
    "Makanan": ["makan", "makanan", "kopi", "minum", "sarapan", "siang", "malam", "kafe", "restoran", "jajan", "snack"],
    "Transportasi": ["transport", "transportasi", "bensin", "gojek", "grab", "ojek", "taksi", "bus", "kereta", "tol", "parkir"],
    "Belanja": ["belanja", "shopping", "baju", "pakaian", "sepatu", "supermarket"],
    "Tagihan": ["tagihan", "listrik", "air", "internet", "wifi", "pulsa", "kuota"],
    "Hiburan": ["hiburan", "film", "bioskop", "game", "konser", "netflix", "spotify"],
    "Kesehatan": ["kesehatan", "obat", "dokter", "rumah sakit", "klinik", "vitamin"],
    "Pendidikan": ["pendidikan", "buku", "kursus", "sekolah", "kuliah", "bimbel"],
    "Rumah": ["rumah", "sewa", "kontrakan", "kos", "perabot", "furniture"],
    # income
    "Gaji": ["gaji", "upah", "salary"],
    "Bonus": ["bonus", "thr"],
    "Investasi": ["investasi", "dividen", "saham", "deposito"],
    "Bisnis": ["bisnis", "usaha", "jualan", "dagang"],
    "Hadiah": ["hadiah", "kado"],
}

EXPENSE_KEYWORDS = ["pengeluaran", "keluar", "bayar", "beli", "belanja", "spend", "habis"]
INCOME_KEYWORDS = ["pemasukan", "masuk", "terima", "dapat", "gaji", "bonus", "income"]


def parse_amount(text: str) -> Optional[float]:
    """Parse Indonesian-style amounts: '50 ribu', '1.5 juta', '50000', etc."""
    t = text.lower()
    # 1.5 juta
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(juta|jt)\b', t)
    if m:
        return float(m.group(1).replace(",", ".")) * 1_000_000
    # 50 ribu / 50rb / 50k
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(ribu|rb|k)\b', t)
    if m:
        return float(m.group(1).replace(",", ".")) * 1000
    # raw number with optional dots/commas (e.g., 50.000 or 50000)
    m = re.search(r'(\d{1,3}(?:[.,]\d{3})+|\d+)', t)
    if m:
        raw = m.group(1).replace(".", "").replace(",", "")
        try:
            return float(raw)
        except ValueError:
            return None
    return None


def detect_type(text: str) -> str:
    t = text.lower()
    for kw in INCOME_KEYWORDS:
        if kw in t:
            return "income"
    for kw in EXPENSE_KEYWORDS:
        if kw in t:
            return "expense"
    return "expense"  # default


def detect_category(text: str, ttype: str) -> str:
    t = text.lower()
    valid = DEFAULT_CATEGORIES["income"] if ttype == "income" else DEFAULT_CATEGORIES["expense"]
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if cat not in valid:
            continue
        for kw in keywords:
            if kw in t:
                return cat
    return "Lainnya"


def extract_description(text: str) -> str:
    """Remove command/amount tokens, keep meaningful description."""
    t = text.lower()
    # remove common command words
    for word in EXPENSE_KEYWORDS + INCOME_KEYWORDS + ["catat", "tambah", "untuk", "buat", "rupiah", "rp"]:
        t = re.sub(rf'\b{word}\b', '', t)
    # remove amounts
    t = re.sub(r'\d+(?:[.,]\d+)?\s*(juta|jt|ribu|rb|k)\b', '', t)
    t = re.sub(r'\d{1,3}(?:[.,]\d{3})+|\d+', '', t)
    # collapse spaces
    t = re.sub(r'\s+', ' ', t).strip()
    return t.capitalize() if t else ""


@api_router.post("/voice/parse")
async def voice_parse(req: VoiceParseReq, user=Depends(get_current_user)):
    text = req.text or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Teks kosong")
    ttype = detect_type(text)
    amount = parse_amount(text)
    category = detect_category(text, ttype)
    description = extract_description(text)
    return {
        "type": ttype,
        "amount": amount,
        "category": category,
        "description": description,
        "raw_text": text,
        "parsed_ok": amount is not None,
    }


# ---------- Mount ----------
app.include_router(api_router)

# CORS - allow cookies; FRONTEND origin from env
frontend_origins = os.environ.get("CORS_ORIGINS", "*")
origins = [o.strip() for o in frontend_origins.split(",") if o.strip()]
# When using cookies cross-origin we cannot use "*"; reflect origin via regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else [],
    allow_origin_regex=".*" if origins == ["*"] else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.transactions.create_index([("user_id", 1), ("date", -1)])
    await db.budgets.create_index([("user_id", 1), ("month", 1)])
    await db.goals.create_index("user_id")
    await db.wallets.create_index("user_id")
    logger.info("Startup complete - DB indexes ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

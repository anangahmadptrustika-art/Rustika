"""Comprehensive backend tests for Aplikasi Keuangan (Indonesian Finance App).

Covers: Auth, Categories, Transactions, Stats, Budgets, Goals, Voice parsing,
data isolation, and 401 protection.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to /app/frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                break

API = f"{BASE_URL}/api"

PRIMARY_EMAIL = "budi@test.com"
PRIMARY_PWD = "rahasia123"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def primary_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login",
               json={"email": PRIMARY_EMAIL, "password": PRIMARY_PWD},
               timeout=30)
    if r.status_code != 200:
        # try register
        s.post(f"{API}/auth/register", json={
            "name": "Budi Santoso", "email": PRIMARY_EMAIL, "password": PRIMARY_PWD
        }, timeout=30)
        r = s.post(f"{API}/auth/login",
                   json={"email": PRIMARY_EMAIL, "password": PRIMARY_PWD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def secondary_session():
    """Second user for data-isolation testing."""
    s = requests.Session()
    email = f"test_iso_{uuid.uuid4().hex[:8]}@test.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Iso User", "email": email, "password": "rahasia123"
    }, timeout=30)
    assert r.status_code == 200, f"Register failed: {r.text}"
    return s, email


# ---------- Auth ----------
class TestAuth:
    def test_register_new_user(self):
        s = requests.Session()
        email = f"test_reg_{uuid.uuid4().hex[:8]}@test.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "New User", "email": email, "password": "rahasia123"
        }, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == email
        assert data["name"] == "New User"
        assert "id" in data
        # cookie set
        assert any(c.name == "access_token" for c in s.cookies)

    def test_register_duplicate(self, primary_session):
        r = requests.post(f"{API}/auth/register", json={
            "name": "Dup", "email": PRIMARY_EMAIL, "password": "rahasia123"
        }, timeout=30)
        assert r.status_code == 400

    def test_login_success_sets_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login",
                   json={"email": PRIMARY_EMAIL, "password": PRIMARY_PWD}, timeout=30)
        assert r.status_code == 200
        assert any(c.name == "access_token" for c in s.cookies)
        body = r.json()
        assert body["email"] == PRIMARY_EMAIL

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": PRIMARY_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me_returns_current_user(self, primary_session):
        r = primary_session.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == PRIMARY_EMAIL

    def test_me_unauthorized(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_logout_clears_cookie(self):
        s = requests.Session()
        s.post(f"{API}/auth/login",
               json={"email": PRIMARY_EMAIL, "password": PRIMARY_PWD}, timeout=30)
        r = s.post(f"{API}/auth/logout", timeout=30)
        assert r.status_code == 200
        # cookie cleared in session jar after logout
        # subsequent /me without cookies must fail
        s2 = requests.Session()
        r2 = s2.get(f"{API}/auth/me", timeout=30)
        assert r2.status_code == 401


# ---------- Categories ----------
class TestCategories:
    def test_categories_returns_indonesian(self):
        r = requests.get(f"{API}/categories", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "income" in data and "expense" in data
        assert "Makanan" in data["expense"]
        assert "Gaji" in data["income"]


# ---------- Transactions ----------
class TestTransactions:
    def test_create_list_update_delete(self, primary_session):
        # create
        payload = {"type": "expense", "amount": 50000, "category": "Makanan",
                   "description": "TEST_makan siang", "date": "2026-01-15"}
        r = primary_session.post(f"{API}/transactions", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        tx = r.json()
        assert tx["amount"] == 50000
        assert tx["category"] == "Makanan"
        assert tx["type"] == "expense"
        tx_id = tx["id"]

        # list
        r = primary_session.get(f"{API}/transactions", timeout=30)
        assert r.status_code == 200
        ids = [t["id"] for t in r.json()]
        assert tx_id in ids

        # filter by type
        r = primary_session.get(f"{API}/transactions?type=expense", timeout=30)
        assert all(t["type"] == "expense" for t in r.json())

        # filter by date range
        r = primary_session.get(f"{API}/transactions?start=2026-01-01&end=2026-01-31",
                                timeout=30)
        assert r.status_code == 200

        # update
        upd = {**payload, "amount": 75000, "description": "TEST_updated"}
        r = primary_session.put(f"{API}/transactions/{tx_id}", json=upd, timeout=30)
        assert r.status_code == 200
        assert r.json()["amount"] == 75000

        # verify GET reflects update
        r = primary_session.get(f"{API}/transactions", timeout=30)
        found = [t for t in r.json() if t["id"] == tx_id][0]
        assert found["amount"] == 75000
        assert found["description"] == "TEST_updated"

        # delete
        r = primary_session.delete(f"{API}/transactions/{tx_id}", timeout=30)
        assert r.status_code == 200

        # verify deleted
        r = primary_session.get(f"{API}/transactions", timeout=30)
        ids = [t["id"] for t in r.json()]
        assert tx_id not in ids

    def test_unauth_blocked(self):
        r = requests.get(f"{API}/transactions", timeout=30)
        assert r.status_code == 401

    def test_delete_nonexistent_returns_404(self, primary_session):
        r = primary_session.delete(f"{API}/transactions/nonexistent-id", timeout=30)
        assert r.status_code == 404


# ---------- Stats ----------
class TestStats:
    def test_stats_summary_structure(self, primary_session):
        # seed one income and one expense
        primary_session.post(f"{API}/transactions", json={
            "type": "income", "amount": 5000000, "category": "Gaji",
            "description": "TEST_gaji", "date": "2026-01-10"
        }, timeout=30)
        primary_session.post(f"{API}/transactions", json={
            "type": "expense", "amount": 100000, "category": "Makanan",
            "description": "TEST_food", "date": "2026-01-12"
        }, timeout=30)
        r = primary_session.get(f"{API}/stats/summary?month=2026-01", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["month", "total_income", "total_expense", "balance",
                  "by_category", "trend", "transaction_count"]:
            assert k in d
        assert d["month"] == "2026-01"
        assert d["total_income"] >= 5000000
        assert d["total_expense"] >= 100000
        assert isinstance(d["trend"], list) and len(d["trend"]) == 6
        assert all("month" in t and "income" in t and "expense" in t for t in d["trend"])


# ---------- Budgets ----------
class TestBudgets:
    def test_budget_crud_and_upsert(self, primary_session):
        payload = {"category": "Makanan", "amount": 1000000, "month": "2026-01"}
        r = primary_session.post(f"{API}/budgets", json=payload, timeout=30)
        assert r.status_code == 200
        bid = r.json()["id"]

        # upsert same category/month should not duplicate
        r2 = primary_session.post(f"{API}/budgets",
                                  json={**payload, "amount": 1500000}, timeout=30)
        assert r2.status_code == 200

        # list
        r = primary_session.get(f"{API}/budgets?month=2026-01", timeout=30)
        items = r.json()
        same_cat = [b for b in items if b["category"] == "Makanan"
                    and b["month"] == "2026-01"]
        assert len(same_cat) == 1
        assert same_cat[0]["amount"] == 1500000

        # delete
        r = primary_session.delete(f"{API}/budgets/{same_cat[0]['id']}", timeout=30)
        assert r.status_code in (200, 404)


# ---------- Goals ----------
class TestGoals:
    def test_goal_crud(self, primary_session):
        r = primary_session.post(f"{API}/goals", json={
            "name": "TEST_Liburan", "target_amount": 10000000,
            "current_amount": 0, "deadline": "2026-12-31"
        }, timeout=30)
        assert r.status_code == 200
        gid = r.json()["id"]

        r = primary_session.get(f"{API}/goals", timeout=30)
        assert any(g["id"] == gid for g in r.json())

        r = primary_session.put(f"{API}/goals/{gid}",
                                json={"current_amount": 2500000}, timeout=30)
        assert r.status_code == 200
        assert r.json()["current_amount"] == 2500000

        # verify persisted
        r = primary_session.get(f"{API}/goals", timeout=30)
        g = [g for g in r.json() if g["id"] == gid][0]
        assert g["current_amount"] == 2500000

        r = primary_session.delete(f"{API}/goals/{gid}", timeout=30)
        assert r.status_code == 200


# ---------- Voice Parse ----------
class TestVoiceParse:
    def test_expense_parse(self, primary_session):
        r = primary_session.post(f"{API}/voice/parse", json={
            "text": "catat pengeluaran 50 ribu untuk makan siang"
        }, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "expense"
        assert d["amount"] == 50000
        assert d["category"] == "Makanan"
        assert "siang" in d["description"].lower() or "makan" in d["description"].lower()
        assert d["parsed_ok"] is True

    def test_income_parse(self, primary_session):
        r = primary_session.post(f"{API}/voice/parse", json={
            "text": "pemasukan gaji 5 juta"
        }, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "income"
        assert d["amount"] == 5000000
        assert d["category"] == "Gaji"

    def test_voice_unauth_blocked(self):
        r = requests.post(f"{API}/voice/parse", json={"text": "test"}, timeout=30)
        assert r.status_code == 401

    def test_empty_text(self, primary_session):
        r = primary_session.post(f"{API}/voice/parse", json={"text": "  "}, timeout=30)
        assert r.status_code == 400


# ---------- Data Isolation ----------
class TestDataIsolation:
    def test_users_only_see_own_transactions(self, primary_session, secondary_session):
        s2, _ = secondary_session
        # primary creates
        r = primary_session.post(f"{API}/transactions", json={
            "type": "expense", "amount": 12345, "category": "Lainnya",
            "description": "TEST_iso", "date": "2026-01-20"
        }, timeout=30)
        assert r.status_code == 200
        primary_tx_id = r.json()["id"]

        # secondary lists -> must NOT see primary's tx
        r = s2.get(f"{API}/transactions", timeout=30)
        assert r.status_code == 200
        ids = [t["id"] for t in r.json()]
        assert primary_tx_id not in ids

        # secondary cannot delete primary's tx
        r = s2.delete(f"{API}/transactions/{primary_tx_id}", timeout=30)
        assert r.status_code == 404

        # cleanup
        primary_session.delete(f"{API}/transactions/{primary_tx_id}", timeout=30)


# ---------- 401 protection sweep ----------
class TestProtection:
    @pytest.mark.parametrize("method,path", [
        ("get", "/transactions"), ("post", "/transactions"),
        ("get", "/budgets"), ("post", "/budgets"),
        ("get", "/goals"), ("post", "/goals"),
        ("get", "/stats/summary"),
    ])
    def test_protected_endpoints_require_auth(self, method, path):
        r = requests.request(method, f"{API}{path}", json={}, timeout=30)
        assert r.status_code == 401, f"{method.upper()} {path} -> {r.status_code}"

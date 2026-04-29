# PRD: Sakuku — Aplikasi Keuangan Pribadi

## Original Problem Statement
> BUATKAN SAYA APLIKASI KEUANGAN YANG LENGKAP, DENGAN USER FRENLY. DENGAN SISTEM LOGIN. YANG MEMILIKI FITUR YANG DAPAT MEMBACA PERINTAH SUARA

## User Choices
- Fitur lengkap: transaksi + anggaran + target tabungan + laporan
- Login: JWT email/password (httpOnly cookie)
- Voice: Web Speech API browser (lang=id-ID)
- Voice parsing: Rule-based (Bahasa Indonesia)
- Tema: Modern & profesional (Organic & Earthy — earth tones, no purple gradients)
- Bahasa: Bahasa Indonesia

## Architecture
- **Backend**: FastAPI (Python) + MongoDB (motor async)
- **Frontend**: React 19 + react-router 7 + Tailwind + Recharts + Sonner toasts
- **Auth**: bcrypt password hashing + PyJWT (HS256) + httpOnly access_token cookie (7d expiry)
- **Voice**: Web Speech API client-side → POST /api/voice/parse rule-based parser

## User Personas
- Pengguna individual yang ingin mencatat keuangan harian dengan cepat (via suara)
- Pengguna yang ingin memantau anggaran bulanan & target menabung

## Implemented (2026-04-29)
### Backend (`/app/backend/server.py`)
- Auth: register/login/logout/me with JWT cookie
- Transactions CRUD with filters (type, category, date range)
- Budgets CRUD (upsert by user+category+month)
- Savings Goals CRUD with quick progress updates
- Stats summary: balance, monthly totals, by-category, 6-month trend
- Voice parser endpoint: Indonesian rules for "ribu/juta/rb/jt/k", expense/income detection, category keywords
- MongoDB indexes on startup (users.email unique, transactions, budgets, goals)

### Frontend (`/app/frontend/src/`)
- Pages: Login, Register, Dashboard, Transactions, Budgets, Goals, Reports
- Layout: Desktop sidebar + mobile bottom nav + global floating mic FAB
- Voice modal with pulsing mic animation (id-ID locale) and parsed-result confirmation
- Charts: Area (trend), Pie (by category), Bar (monthly comparison)
- Theme: Outfit + Manrope fonts; #2C3D30 / #D99B58 / #5F8575 / #C86753 palette
- All interactive elements have data-testid

## Test Status
- Backend: 26/26 pytest tests passed
- Frontend: end-to-end verified (login, dashboard, voice modal, add transaction, budgets, goals, reports)
- Test credentials: `/app/memory/test_credentials.md`

## Backlog (P1)
- Edit goal dialog (currently can update via quick-add buttons only)
- Replace native `<select>` & `<input type=date>` with shadcn Select + Calendar (design polish)
- Migrate FastAPI on_event → lifespan handler
- Recurring transactions / scheduled income
- Export CSV / PDF report

## Backlog (P2)
- Multi-currency support
- Sharing budgets with family
- Push notifications for budget overruns
- Dark mode toggle
- AI-powered voice parsing (Emergent LLM Key) for natural phrasing

## Next Tasks
- Await user feedback to prioritize backlog items

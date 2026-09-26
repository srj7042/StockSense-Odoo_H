# StockSense — Production-Ready Inventory Management System

StockSense is a centralized, real-time, database-driven Inventory Management System (IMS). Every validated stock operation immediately mutates stock inside a database transaction and creates an auditable stock ledger entry.

## Quick Start Commands

### Local Development Mode

**Terminal 1 (Backend)**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API running at: `http://127.0.0.1:8000`*

**Terminal 2 (Frontend)**
```bash
cd frontend
npm run dev -- -p 3000
```
*Frontend UI running at: `http://localhost:3000`*

---

## Demo Credentials

- **Inventory Manager**: `manager@stocksense.com` / `password123`
- **Warehouse Staff**: `staff@stocksense.com` / `password123`

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: FastAPI, Python 3.9+, SQLite / PostgreSQL, SQLAlchemy
- **Authentication**: JWT, PBKDF2 Password Hashing, Role-Based Access Control (`MANAGER`, `STAFF`)

## Project Structure

```text
StockSense/
├── backend/            # FastAPI REST API & Database Models
│   ├── app/
│   │   ├── main.py     # API entry point & CORS
│   │   ├── models.py   # SQLAlchemy schema
│   │   ├── schemas.py  # Pydantic request/response schemas
│   │   ├── auth.py     # JWT & password hashing
│   │   ├── seed.py     # Database seed data
│   │   ├── services/   # Inventory posting engine & transaction safety
│   │   └── routers/    # API endpoints (products, receipts, deliveries, transfers, adjustments, ledger, etc.)
│   └── stocksense.db   # SQLite database
├── frontend/           # Next.js App Router Web UI
│   ├── src/
│   │   ├── app/        # Pages (dashboard, products, operations, ledger, alerts, settings, profile, auth)
│   │   ├── components/ # Sidebar, Header, StatusBadge, DemoFlowBanner
│   │   └── lib/        # API client & auth session utils
│   └── public/
└── README.md
```

## End-to-End Demo Flow

1. **Landing Page (`/`)**: Overview, Features, About, Sign In / Sign Up buttons.
2. **Sign In (`/login`)**: Login as Manager or Staff with password visibility toggle.
3. **Dashboard (`/dashboard`)**: View real-time DB KPIs, Recharts movement trends, and low-stock risk.
4. **Receipt**: Post goods receipt (+50 units) &rarr; Stock increases, inbound ledger movement created.
5. **Transfer**: Move 10 units between locations &rarr; Source decreases by 10, destination increases by 10, total stock unchanged.
6. **Delivery**: Post delivery order (4 units) &rarr; Destination stock decreases.
7. **Adjustment**: Physical count adjustment &rarr; Balance updated with auditable reason.
8. **Stock Ledger**: Review read-only chronological movement audit log.

---

## Authors

- **Suraj**
- **Nitesh**
- **Parth**
- **Sujal**


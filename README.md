# Nexora POS — Phase 1 foundation

A polished, responsive React/Vite/Tailwind POS interface with a Node/Express/MySQL backend scaffold. This delivery prioritizes the visual system and interactive frontend so the screens and core workflow can be reviewed before full backend integration.

## Included

- Premium violet glassmorphism UI with light/dark themes
- Responsive navigation, global page search, notifications, role preview
- Dashboard with sales chart, payment mix, recent transactions, stock attention
- Inventory list with search, category/status filters, selection and status pills
- Interactive POS catalog/cart, quantity controls, role-aware price/discount UI, full-payment flow, cash change calculation, receipt preview/print
- UI scaffolds for Items, Categories, Purchases, Suppliers, Customers, Staff & Roles, Transactions, Reports, Returns & Refunds, and Settings
- Express API scaffold with health check, login, item listing/creation, and transactional sale endpoint
- MySQL schema for users, settings, catalog, stock movement ledger, purchases, sales, payments, returns and audit logs

## Important prototype boundary

The frontend currently uses illustrative in-memory demo data. A sale in the UI changes local state only; it is **not persisted** to MySQL yet. Role selection is a UI preview and is not a secure authentication mechanism. Do not use this prototype for live sales or real business records. The backend endpoints are separate and require database setup and API integration before they can power the UI.

The sale API stores one payment per sale and requires full payment. Negative stock is blocked by default and Admin-only override validation exists, but the negative-stock cost-basis/reconciliation policy remains a known unresolved business decision. Review and test before production use.

## Requirements

- Node.js 20+ recommended
- MySQL 8.0+
- npm

## Run the frontend

```bash
cd client
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`).

## Set up MySQL

1. Start MySQL locally.
2. Import `database/schema.sql` using MySQL Workbench or the MySQL CLI.

Example:

```bash
mysql -u root -p < database/schema.sql
```

The schema creates the `nexora_pos` database and its tables. If your local MySQL account has a password, use it when prompted.

## Run the API

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your MySQL username/password and a long random `JWT_SECRET`, then:

```bash
npm install
npm run dev
```

API health check: `http://localhost:4000/api/health`

Create the first Admin account using a strong password (12+ characters):

```bash
node src/seed-admin.js "Store Admin" admin@example.com "your-strong-password"
```

Login endpoint: `POST /api/auth/login` with JSON `{ "email": "admin@example.com", "password": "your-strong-password" }`.

Protected endpoints currently include:
- `GET /api/items`
- `POST /api/items`
- `POST /api/sales`

Use a Bearer token from the login response. The frontend is not yet connected to these endpoints.

## Confirmed business rules represented in the design

- Single business / single store for v1
- Configurable business currency; no foreign exchange
- Tax disabled by default
- Discounts and price overrides restricted to Manager/Admin
- No credit sales; completed sales require full payment
- Weighted average cost as inventory valuation method
- Negative stock prohibited by default; Admin override requires warning, reason and audit record

## Known design decisions still open

- Split payments (not included in v1 UI)
- Negative-stock cost treatment and reconciliation details
- Capitalization of freight/purchase-side charges into weighted average cost
- Damaged stock write-off accounting
- Line-level discounts (current design proposes order-level only)
- Receipt hardware/thermal printer support
- Tax rules if the optional tax setting is enabled

## Next phases

1. Connect frontend authentication and API state to the backend.
2. Complete catalog, categories, suppliers, purchases and inventory movement workflows.
3. Complete returns/refunds, staff management, settings and report endpoints.
4. Add automated tests for permissions, WAC calculations, stock locking, idempotency and rollback behavior.
5. Conduct security review and production hardening before using real data.

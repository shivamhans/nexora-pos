# Nexora POS

Nexora POS is a desktop-first point-of-sale and inventory workspace built with React, Vite, Tailwind CSS, Express, and local MySQL.

## Current branch: Phase 2 API integration

The `phase-2-api-integration` branch adds:
- Sign-in against the Express API, with the authenticated user and role shown in the workspace.
- Catalog loading from `GET /api/items`; connected sales use the database catalog instead of the sample catalog.
- POS sale submission to `POST /api/sales`, including payment method, cash received/change, order discount reason, authorized price overrides, and Admin stock-override reasons.
- A stable idempotency key for retries during the same checkout attempt.
- A polished sign-in screen with API health status and an explicitly demo-only entry.
- Example environment files and a GitHub Actions build/syntax workflow.

**This is still not a production-ready POS.** Several pages, dashboard charts, customers, purchases, returns, settings and reports remain demo/scaffold screens. The dashboard metrics are illustrative; they must not be treated as real sales totals or profit. Real tax calculation, purchase receiving/WAC updates, reconciliation queue processing, complete returns/refunds, and end-to-end/security tests are not finished.

## Stack
- Frontend: React + Vite + Tailwind CSS, Lucide, Recharts
- Backend: Node.js + Express REST API
- Database: local MySQL 8+
- The browser calls the Express API; it must never connect directly to MySQL.

## Run locally
Requirements: Node.js 20+ (22 recommended) and MySQL 8+.

### 1. Start MySQL
Start your local MySQL service. Import the schema once from the repository root:

```bash
mysql -u root -p < database/schema.sql
```

Alternatively, open `database/schema.sql` in MySQL Workbench and execute it. The schema creates the `nexora_pos_cg` database.

### 2. Configure and start the API
In a terminal:

```bash
cd server
```

Copy `server/.env.example` to `server/.env` (on Windows PowerShell, use `Copy-Item .env.example .env`) and update the MySQL credentials. Replace `JWT_SECRET` with a long, random secret before signing in. Then:

```bash
npm install
npm run dev
```

Health endpoint: http://localhost:4001/api/health

Create the first Admin account in another terminal, from the `server` folder:

```bash
node src/seed-admin.js "Store Admin" admin@example.com "use-a-strong-unique-password"
```

Use a strong password of at least 12 characters. Keep it private.

### 3. Start the frontend
In a separate terminal, from the repository root:

```bash
cd client
```

Copy `client/.env.example` to `client/.env` if you want to set an API URL explicitly. The default is `http://localhost:4001/api`.

Then:

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal, normally http://localhost:5173. Sign in with the Admin credentials you created. Select **Explore demo workspace** only to inspect the design using sample data.

## Confirmed v1 business rules
- One business and one store for v1.
- One configurable base currency; no foreign-exchange conversion.
- Tax is configurable and disabled by default.
- Only Admin/Manager can apply discounts or override prices; reasons and audit records are required.
- No credit sales; full payment is required before a sale completes.
- Weighted average cost (WAC) is the stock valuation method.
- Negative stock is blocked by default. An Admin override requires a warning, a reason, an audit record, and reconciliation follow-up.
- Stock updates when a purchase is received, not when it is merely ordered.
- Stock changes use an append-only movement ledger.
- Use MySQL DECIMAL for monetary values. Keep historical sale cost snapshots. Sale, sale lines, payment and stock changes must be atomic.
- Do not claim net profit without an expenses module. Gross profit must only be shown when cost data is available.

## Remaining phases
1. Finish UI polish and responsive review.
2. Connect core UI screens to authentication/API state and database-backed sales/catalog.
3. Complete items, categories, suppliers, purchase receiving, WAC updates, stock adjustments, customer and transaction history.
4. Complete returns/refunds, staff management, configurable settings, report endpoints and audit-log views.
5. Add an explicit negative-stock reconciliation queue and settle the cost-basis policy for overridden sales.
6. Add tests for permissions, WAC calculations, concurrent stock locking, duplicate submissions, rollback behavior and secure configuration; complete a security review before production.

## Decisions intentionally left open
- Split payments.
- Negative-stock cost treatment and reconciliation policy.
- Capitalizing freight/purchase-side charges into WAC.
- Damaged-stock write-off accounting.
- Line-level discounts (current proposal is order-level only).
- Thermal receipt printer/hardware support.
- Tax rules if optional tax is enabled.

## Security reminders
- Never commit `.env`, passwords, tokens, keys, or real customer/business exports.
- Authentication and permissions must be enforced by the API. Role preview exists only in demo mode.
- Do not use this branch for live transactions until the unfinished modules, tests and security checks are complete.

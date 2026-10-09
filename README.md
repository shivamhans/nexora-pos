# Nexora POS

Nexora POS is a desktop-first point-of-sale and inventory workspace built with React, Vite, Tailwind CSS, Express, and local MySQL.

## Current milestone: Phases 2–3 — operational API integration

The authenticated workspace now includes:
- Premium sign-in screen, API/database connection status, and a demo-only entry.
- Database-backed catalog and checkout, with authorization enforced by the API.
- Items and categories, including opening stock and active/inactive status.
- Supplier and customer directories; POS can attach a selected customer to a sale.
- Purchase orders with a separate receiving step. Stock quantity and weighted-average cost (WAC) change only when received quantities are recorded.
- Inventory adjustments and a stock movement history.
- An Admin/Manager-visible negative-stock reconciliation queue; Admins can resolve it using a physical count.
- Searchable transaction history and stored line/payment details.
- Local environment examples, setup guidance, and GitHub Actions build/syntax checks.

**This is not yet a production-ready POS.** The dashboard figures/charts remain illustrative sample data, and a banner warns authenticated users about this. Staff management, returns/refunds, persisted settings, and database-backed reporting are not complete. Tax calculation, split payments, freight capitalization into WAC, and thermal receipt hardware support are not implemented. Automated CI checks syntax and builds; it does not run end-to-end tests against your local MySQL instance.

## Stack
- Frontend: React + Vite + Tailwind CSS, Lucide, Recharts
- Backend: Node.js + Express REST API
- Database: local MySQL 8+
- Browser requests go to Express. The browser must never connect directly to MySQL.

## Run locally
Requirements: Node.js 20+ (22 recommended) and MySQL 8+.

### 1. Configure the database
Start your local MySQL service. Import the schema from the repository root:

```bash
mysql -u root -p < database/schema.sql
```

Alternatively, execute `database/schema.sql` in MySQL Workbench. The schema creates/uses `nexora_pos_cg`.

If you imported the schema before the Phase 3 reconciliation change, run the schema again. Its `CREATE TABLE IF NOT EXISTS` statements create the new `negative_stock_reconciliation` table without dropping existing tables/records.

### 2. Configure and start the API
Open a terminal in the `server` directory. Create `server/.env` from `server/.env.example` (PowerShell: `Copy-Item .env.example .env`) and set your local MySQL credentials.

```dotenv
PORT=4001
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=nexora_pos_cg
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
```

Replace `JWT_SECRET` with a long, unique random value before login. On PowerShell, generate one with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Keep the API running:

```bash
npm install
npm run dev
```

Health endpoint: http://localhost:4001/api/health

### 3. Create your Nexora Admin login
The `DB_PASSWORD` in `server/.env` is the **MySQL password**, not the password you use on the Nexora sign-in screen.

From the `server` directory, run this once to create your application account:

```bash
node src/seed-admin.js "Store Admin" admin@example.com "replace-with-your-own-strong-password"
```

Replace the sample password with your own unique password of at least 12 characters. Then sign in using `admin@example.com` and that same password.

If the command reports that the email already exists, that account has already been created; use its existing password or reset it before trying again. If login still fails after account creation, confirm the server is using the expected `nexora_pos_cg` database and restart the API after changing `JWT_SECRET`.

### 4. Start the frontend
In a separate terminal, open the `client` directory. Copy `client/.env.example` to `client/.env` if you need to specify the API URL:

```dotenv
VITE_API_URL=http://localhost:4001/api
```

Then run:

```bash
npm install
npm run dev
```

Open the Vite URL printed by the terminal (commonly `http://localhost:5173`, or `5174` if 5173 is already occupied). The API allows local `localhost`/ `127.0.0.1` development origins. Select **Explore demo workspace** only when you want to inspect sample data without signing in.

## Confirmed v1 business rules
- One business and one store for v1.
- One configurable base currency; no foreign-exchange conversion.
- Tax is configurable and disabled by default.
- Only Admin/Manager can apply discounts or override prices; reasons and audit records are required.
- No credit sales; full payment is required before completing a sale.
- Weighted average cost (WAC) is the inventory valuation method.
- Negative stock is blocked by default. Admin override requires a warning and reason, creates an audit record and reconciliation entry, and must be followed up with a physical count.
- Purchase orders do not affect stock until received.
- Stock changes are recorded in a movement ledger.
- Use MySQL DECIMAL for money. Historical sales keep cost snapshots. Sale, lines, payment, stock movements, and reconciliation entries must be committed atomically.
- Do not claim net profit without an expenses module. Gross profit should only be shown when cost data is reliable.

## Still to implement
1. Staff account management and persisted role administration.
2. Returns/refunds with partial-return validation and refund settlement.
3. Persisted currency, tax, business profile and receipt settings.
4. Database-backed dashboard/report metrics and export.
5. Automated tests for permissions, WAC calculations, concurrency/stock locks, duplicate submissions, rollback, reconciliation, and security.
6. Responsive/manual testing against an actual local MySQL instance and a security review before real use.

## Decisions intentionally left open
- Split payments.
- Treatment of provisional negative-stock sale costs and whether historical cost snapshots should ever be restated.
- Capitalizing freight/purchase-side charges into WAC.
- Damaged-stock write-off accounting/reporting.
- Line-level discounts (current design uses order-level only).
- Thermal receipt printer/hardware support.
- Tax rules if optional tax is enabled.

## Security reminders
- Never commit `.env`, passwords, tokens, keys, or real customer/business exports.
- Server-side permission checks are mandatory. Role preview exists only in demo mode.
- Do not use this branch for live sales or real business records until the remaining workflows, integration tests, and security checks are complete.

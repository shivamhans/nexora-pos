# Nexora POS

Nexora POS is a desktop-first point-of-sale and inventory system built with React, Vite, Tailwind CSS, Express, and local MySQL.

## Current milestone: Phase 4 — management and reporting

The feature branch now includes:
- Premium sign-in and database-backed sales/catalog workflows.
- Items and categories, supplier/customer directories, purchase orders and receiving with weighted-average-cost (WAC) updates.
- Inventory adjustments, stock movement history, and an Admin reconciliation queue for negative-stock overrides.
- Searchable transaction history with sale line/payment detail.
- Admin-only staff management: invite staff, assign roles, activate/deactivate accounts, and reset passwords. The API reloads the current role/status from the database for protected requests.
- Partial returns validated against the original sale quantity and prior returns, with optional restocking, a manual settlement record, stock/WAC updates, and audit trail.
- Persisted business name/currency/locale/timezone/receipt footer settings.
- Database-backed reports for sales, refunds, inventory value, payment breakdown and daily performance. Gross profit is withheld when provisional sale costs exist; net profit is not reported without expense tracking.
- CI checks for the frontend production build and backend JavaScript syntax.

**Still not production-ready.** Returns record the declared manual settlement method but do not send funds through a payment gateway. Tax remains disabled because a tax-rate/calculation policy is not configured. The signed-in dashboard fetches its metrics from saved database records; illustrative figures are shown only in the unsigned-in demo workspace. End-to-end and concurrency/security testing against your local MySQL instance has not been completed.

## Item identifiers
When creating an item, the SKU field is optional. If you leave it blank, the API generates a unique `NX-` SKU at save time. If you enter your own SKU, it must be unique. A **SKU (Stock Keeping Unit)** is your internal code for identifying a product or product variant, for example `CHO-050` for a 50 g chocolate bar or `NX-1001` for a general product code. Each distinct item should have its own unique SKU. A barcode is a separate scannable identifier; it does not have to be the same as the SKU. Item creation also supports an optional product photo: select a JPEG, PNG or WebP image (up to 8 MB before resizing). The browser compresses it to a small JPEG and the API stores it in MySQL, so no separate uploads folder is needed.

## Stack
- Frontend: React + Vite + Tailwind CSS, Lucide, Recharts
- Backend: Node.js + Express REST API
- Database: local MySQL 8+
- The browser calls Express; it must never connect directly to MySQL.

## Run locally
Requirements: Node.js 20+ (22 recommended) and MySQL 8+.

### 1. Update the database schema
Start MySQL. From the repository root, execute:

```bash
mysql -u root -p < database/schema.sql
```

Alternatively, execute `database/schema.sql` in MySQL Workbench. It targets `nexora_pos_cg`. You can re-run it after updates: the `CREATE TABLE IF NOT EXISTS` statements preserve existing tables/rows and create the new `negative_stock_reconciliation` and `return_payments` tables if missing. Back up data before applying schema changes to any database with valuable records.

### 1a. Apply the Phase 4 upgrade migration
If your browser displays errors like `Table 'nexora_pos_cg.negative_stock_reconciliation' doesn't exist` or `Table 'nexora_pos_cg.return_payments' doesn't exist`, your existing database predates the newer tables. In MySQL Workbench, open `database/phase4-migration.sql` from this branch and execute it. It safely creates `negative_stock_reconciliation` and `return_payments` if missing, and adds the optional `items.image_data` column if missing. It does not drop existing records. Run it once after downloading this update, then restart the API.

### 2. Configure and start the API
In the `server` folder, copy `server/.env.example` to `server/.env` (PowerShell from that folder: `Copy-Item .env.example .env`).

Example local settings:

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

Use your actual MySQL password. Generate a JWT secret in PowerShell with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Replace the JWT placeholder with the generated value and keep it private. Start the server:

```bash
npm install
npm run dev
```

Health endpoint: http://localhost:4001/api/health

### 3. Create the first Nexora Admin login
The MySQL setting `DB_PASSWORD` is **not** the Nexora application sign-in password.

From the `server` folder, run:

```bash
node src/seed-admin.js "Store Admin" admin@example.com "Your-own-strong-password-12+"
```

Replace the example password with your own unique password of at least 12 characters. **A password like `admin` is rejected**, and the seed script will not create the account. After a successful command, sign in with `admin@example.com` and the exact password used there.

If an account already exists and its password is unknown, reset it from the `server` folder:

```bash
node src/reset-user-password.js admin@example.com "Your-new-strong-password-12+"
```

This changes the password hash for an existing account; it does not create missing accounts or activate disabled accounts. Keep the new password private.

### 4. Start the frontend
In another terminal, enter the `client` folder. Copy `client/.env.example` to `client/.env` if you want to set the API URL explicitly:

```dotenv
VITE_API_URL=http://localhost:4001/api
```

Then:

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`, or `http://localhost:5174` if 5173 is occupied). Local Vite origins are allowed by the API. If you change `JWT_SECRET`, restart the API and sign in again.

## Same-Wi-Fi LAN setup (recommended for nearby devices)

Use this when the PC running Nexora/MySQL and phones/tablets are connected to the same Wi-Fi. No ngrok tunnel is needed.

1. On the Windows PC running Nexora, open PowerShell and run `ipconfig`. Find the **IPv4 Address** under the connected Wi-Fi adapter (for example `192.168.1.23`). Use your actual address.
2. In `server/.env`, set `PORT=4001`, `HOST=0.0.0.0`, and `LAN_ACCESS=true`. Keep `DB_HOST=127.0.0.1` because MySQL runs on the same PC.
3. In `client/.env.local` or `client/.env`, set `VITE_HOST=0.0.0.0`, `VITE_PORT=5175`, and `VITE_API_URL=http://localhost:4001/api`. Remove old `NGROK_HOST` and `https://...ngrok-free.app/api` values. Nexora automatically replaces localhost in this API URL with the private IP when a LAN device opens the frontend.
4. In separate terminals, start Express from `server` with `npm run dev`, and Vite from `client` with `npm run dev -- --host 0.0.0.0 --port 5175`. If Windows Defender Firewall prompts, allow Node.js on **Private networks only**.
5. On the host PC, open `http://localhost:5175`. On a phone/tablet on the same Wi-Fi, open `http://YOUR-PC-IP:5175`, replacing the placeholder with the IPv4 address from step 1.
6. If it cannot connect, first open `http://YOUR-PC-IP:4001/api/health` from that device. It should return JSON with `"status":"ok"` and `"database":"connected"`. If it times out, check Windows Firewall inbound TCP ports 4001 and 5175 on the Private profile, and make sure the device isn't on guest Wi-Fi or blocked by router/AP client isolation.

LAN CORS allows HTTP origins using private IPv4 addresses only when `LAN_ACCESS=true`; exact `CLIENT_ORIGIN` entries continue to work. Do not forward ports 4001/5175 on your router. Use trusted devices and require each user to sign in.

## Optional remote testing with ngrok

For devices **not** on the same Wi-Fi, use separate ngrok tunnels. Set `NGROK_HOST` to the exact frontend hostname, set `VITE_API_URL` to the HTTPS API tunnel URL ending in `/api`, add the exact frontend HTTPS origin to `CLIENT_ORIGIN`, and restart both services. Do not mix the ngrok API URL with the same-Wi-Fi setup.

## Confirmed v1 business rules
- One business and one store.
- One configurable base currency; no foreign-exchange conversion. Changing the currency setting changes labels, not historical amounts.
- Tax is disabled by default and cannot yet be enabled until a tax rate/rules policy is implemented.
- Only Admin/Manager can apply discounts or override prices; reasons and audit records are required.
- No credit sales; full payment is required before sale completion.
- Weighted-average-cost valuation; cost is updated when purchases are received.
- Negative stock is blocked by default. An Admin override creates an audit record and reconciliation entry; an Admin must reconcile the physical count.
- Stock changes use a movement ledger, and money uses DECIMAL database fields.
- Historical sale cost snapshots are retained. Gross profit is withheld if provisional cost snapshots affect the selected report period. Net profit is not reported without an expenses module.

## Known limitations and decisions
- Manual return/refund settlement is recorded for a selected method (Cash/UPI/Card); no payment gateway is called.
- Split payments remain out of scope.
- Freight capitalization into WAC remains blocked until the policy is approved.
- A returned item restocked into inventory uses the original sale cost snapshot for the WAC update. Lines whose cost snapshot is provisional from a negative-stock override are blocked from restocking until that cost-basis policy is resolved; unresolved negative stock must also be reconciled first.
- Damaged-stock write-offs are Admin-only and logged; full expense/write-off reporting remains incomplete.
- Staff password resets and role changes are audited; disabled accounts are denied API requests.
- Printing now uses an explicit receipt-only layout for POS completion and transaction history; verify paper size and printer scaling in the browser print dialog.
- Thermal receipt hardware, tax rules, and full audit-log browsing remain incomplete.

## Before real store use
Run the frontend build and backend syntax CI, then test the workflows against a disposable/local MySQL database: seed login, role restrictions, item creation, purchase receipt/WAC, sale/idempotency, partial returns, concurrent stock changes, reconciliation and rollback behavior. Complete a security review and back up business data before production use.

## Security reminders
- Never commit `.env`, passwords, tokens, keys, or real customer/business exports.
- Use a strong unique JWT secret and application passwords.
- The UI is not the security boundary; the server enforces roles and account status.
- The feature branch is still a draft and should not be used for live sales until end-to-end verification is complete.

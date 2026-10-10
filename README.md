# Nexora POS

Nexora POS is a desktop-first point-of-sale and inventory system built with React, Vite, Tailwind CSS, Express, and local MySQL.

## Current milestone: Phase 5 — final workflow completion and stabilization

The draft feature branch now includes:
- Premium sign-in, role-aware navigation, same-Wi-Fi LAN support, and a responsive light/dark workspace.
- Database-backed POS, checkout, transaction history, item catalog, inventory adjustments, stock movement ledger and Admin reconciliation.
- **Item editing:** Admins/Managers can update an item's name, SKU, barcode, category, selling price, low-stock threshold and product photo after creation. Changes are validated server-side and written to the audit log. On-hand quantity and weighted-average cost are deliberately excluded from the editor; they can only change through the stock/receiving workflows.
- **Category editing:** Admins/Managers can edit category name and description and update active/inactive status. The API validates duplicate names and retains linked item history.
- **Purchase order editing:** Admins/Managers can edit the supplier, date, notes, line items, quantities and unit costs while an order is still `ORDERED` and nothing has been received. Once any quantity is received, the API rejects edits so stock/WAC history cannot be rewritten. Every edit is audited.
- **Per-user permissions:** Admins can open **Permissions** for Manager/Cashier accounts, choose which workspace modules they may open, and choose which table columns are visible in each enabled table. The server enforces module access and role limits; Admin accounts always retain full access. Item average cost is omitted from the item-list API when the signed-in user has no enabled Items/Inventory average-cost column.

- SKU auto-generation when creating an item without a custom code, compressed item-photo storage in MySQL, live product photos in the POS/catalog, and receipt-only printing.
- **WhatsApp receipts:** the POS completion screen creates a branded, shareable PNG receipt with the saved business name, receipt number/date, customer, item lines, subtotal/discount/total, and payment details. On browsers supporting file sharing, use the native share sheet and choose WhatsApp. On browsers without it (common for local HTTP LAN pages), Nexora downloads the PNG and opens a prefilled WhatsApp message; attach the downloaded PNG manually before sending.
- Supplier/customer directories, purchase orders and receiving with weighted-average-cost updates.
- Searchable transaction history and partial returns with quantity/refund checks, optional restocking, manual settlement records, stock movements and audit history.
- Admin-only staff management: invite staff, assign roles, activate/deactivate accounts, and reset passwords. Protected APIs reload current account role/status.
- Persisted business name, currency, locale, timezone and receipt footer; the sidebar uses the saved business name and stock alerts use each item's configured threshold.
- Database-backed reports and dashboard. Gross profit is withheld when provisional costs affect a period; net profit is not reported without expense tracking.
- GitHub Actions checks the frontend production build and backend JavaScript syntax.

**Phase 5 is the final implementation pass, not a production-readiness certification.** Tax collection remains disabled until its rate/calculation policy is approved; returns record a manual settlement method but do not transfer funds through a payment gateway. End-to-end, multi-device concurrency, rollback and security testing with your local MySQL setup is still required before real-store use.

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

### 1a. Apply the Phase 4/5 upgrade migration
If your browser displays errors like `Table 'nexora_pos_cg.negative_stock_reconciliation' doesn't exist` or `Table 'nexora_pos_cg.return_payments' doesn't exist`, your existing database predates the newer tables. In MySQL Workbench, open `database/phase4-migration.sql` from this branch and execute it. It safely creates `negative_stock_reconciliation` and `return_payments` if missing, adds `items.image_data` and `users.permissions_json` if missing, and does not drop existing records. Run the whole script after downloading this update, then restart the API. The migration is idempotent for these additions.

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

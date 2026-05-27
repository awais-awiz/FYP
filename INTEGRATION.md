# S.A.F.E. Table — Integration Guide

Two services:

- **backend/** — FastAPI + MongoDB (`/api/*` routes, `/ws/*` WebSockets).
- **safetablefyp/** — Vite + React. Talks to the backend through `safetablefyp/src/lib/api.js`.

## Local development

### Prerequisites
- Python 3.11+
- Node 18+
- A running MongoDB on `mongodb://localhost:27017` (Atlas is fine — change `MONGODB_URL`).

### One-time setup

```bash
# backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # already provisioned with a working SECRET_KEY in this repo
python seed_data.py              # optional — seeds menu items, an admin user, etc.

# frontend
cd ../safetablefyp
npm install
cp .env.example .env             # already provisioned
```

### Run

Two terminals:

```bash
# Terminal 1 — backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd safetablefyp
npm run dev                       # http://localhost:8080
```

Vite proxies `/api/*` and `/ws/*` to the backend on port 8000, so the SPA stays
same-origin and you avoid CORS in dev.

### Default admin credentials (after seed_data.py)
See `backend/seed_data.py`. If unset, create one:

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456","full_name":"Admin","role":"manager"}'
```
Then approve via the admin UI (or directly in Mongo for the first user).
For a true `admin` role, insert one in Mongo manually since signup is gated to
non-admin roles by design.

## Environment variables

### Backend (`backend/.env`)

| Var                       | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `ENV`                     | `dev` / `staging` / `prod` — gates dev-only endpoints                |
| `MONGODB_URL`             | Mongo connection string                                              |
| `DATABASE_NAME`           | DB name (`safetable` by default)                                     |
| `SECRET_KEY`              | JWT signing key. ≥32 chars; rejects placeholders                     |
| `ALGORITHM`               | JWT algorithm (`HS256`)                                              |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Staff session TTL                                                |
| `ALLOWED_ORIGINS`         | Comma-separated CORS origins                                         |
| `HOST` / `PORT`           | Bind for `uvicorn`                                                   |
| `GROQ_API_KEY`            | Voice ordering / chatbot LLM (optional in dev)                       |
| `GROQ_API_URL`            | Override for self-hosted gateways                                    |
| `GROQ_MODEL`              | Groq model id                                                        |
| `ASSEMBLYAI_API_KEY`      | Speech-to-text (preferred)                                           |
| `OPENAI_API_KEY`          | Legacy STT fallback                                                  |
| `HEYGEN_API_KEY`          | TTS (optional — falls back to browser `speechSynthesis`)             |
| `HEYGEN_VOICE_ID`         | Voice id at HeyGen                                                   |
| `STRIPE_SECRET_KEY`       | Use `sk_test_placeholder` for simulated mode                         |
| `STRIPE_PUBLISHABLE_KEY`  | Public key (frontend)                                                |
| `STRIPE_WEBHOOK_SECRET`   | **Required when `ENV=prod`**; webhook fails closed without it        |

### Frontend (`safetablefyp/.env`)

| Var                       | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `VITE_API_URL`            | API origin in production (e.g. `https://api.example.com`). Empty in dev so the proxy handles it. |
| `VITE_API_PROXY_TARGET`   | Where Vite forwards `/api` and `/ws` in dev (default `http://localhost:8000`). |
| `VITE_WS_URL`             | Optional override for WebSocket origin                               |

## How the app fits together

### Auth (staff)

- **Login** — `POST /api/auth/login` returns a JWT (audience `staff`).
- **Persisted client side**: token in `localStorage["safetable_token"]`.
- **Bootstrap**: on app load, `App.jsx` calls `useAuth.bootstrap()` which validates the token via `GET /api/auth/me`. If the token is bad, state clears.
- **Signup** — `POST /api/auth/signup` writes to `db.approvals`. **No login is possible until approved.**
- **Approve** — `POST /api/staff/approvals/{id}/approve` (admin/manager). This **materializes the user** in `db.users` so they can log in.
- **Logout** — `POST /api/auth/logout` (no-op server side; the client drops the token).
- **`ProtectedRoute`** waits for `bootstrapping=false` before bouncing, so refresh works.

### Customer flow

- Customers don't log in. They get a short-lived **customer ticket** (audience `customer`) bound to a `(table_number, session_id)`.
- `useCustomerSession.start(n)` calls `POST /api/tables/dev-session?table_number=N` (dev-only) which opens a session AND returns a signed ticket. In production, replace this with a QR-code flow that hands customers a ticket already minted by staff.
- The ticket is stored in `localStorage["safetable_ticket"]` and auto-attached as `X-Customer-Ticket` for orders, voice, feedback, and so on.

### Orders / kitchen

- The customer hits `POST /api/orders` with the ticket; backend re-validates the session, server-trusts pricing, and atomically reserves stock.
- The kitchen subscribes to `WS /ws/kitchen?token=<jwt>` for live `new_order` / `order_update` events; any received event triggers a refetch of `GET /api/orders/kitchen/active` so the store stays sync'd.
- State machine: `pending → confirmed → preparing → ready → completed` (CAS-protected).

### Service requests

- `useService` is layered over `/api/tasks`. Customer "request cleaning" / "help" / "bill" actions become tasks with `role: cleaner` or `role: server`. Cleaner/server dashboards filter the same collection.

### Payments

- `POST /api/stripe/create-payment-intent` returns either a real intent or a simulated one (no Stripe key). Either way the response includes a `qr_code_base64` shown on the success dialog.
- Webhooks at `POST /api/stripe/webhook` — set `STRIPE_WEBHOOK_SECRET` in prod (`stripe listen --forward-to localhost:8000/api/stripe/webhook` for local end-to-end testing).

## API reference (used by the SPA)

Every backend route is reachable via `lib/api.js`. Notable namespaces:

- `api.auth.{login, signup, me, logout, changePassword}`
- `api.menu.{list, categories, get, create, update, remove}`
- `api.orders.{create, get, byTable, activeByTable, updateStatus, kitchenActive, kitchenStats}`
- `api.voice.order(...)`
- `api.chatbot.{chat, history, clear, recommendations}`
- `api.languages.{list, detect, translate}`
- `api.payments.{generateQR, confirm, get, byOrder}`
- `api.stripe.{createPaymentIntent, paymentStatus, generateQR, simulate}`
- `api.ambience.{get, update, applyPreset}`
- `api.feedback.{submit, list, stats}`
- `api.staff.{list, create, get, update, remove, pendingApprovals, approve, reject}`
- `api.tasks.{list, create, get, updateStatus, remove}`
- `api.sales.{summary, topItems, revenueChart}`
- `api.admin.{dashboardStats, orderHistory}`
- `api.tables.{createSession, getSession, endSession, active, mySession, devSession}`
- `api.models3d.{list, get, byMenuItem}`
- `api.health.check()`
- WebSockets: `api.openKitchenSocket()`, `api.openCustomerSocket(table, sessionId)`

## Known limitations

- The customer flow uses a **dev-only** public endpoint `/api/tables/dev-session` to mint tickets. **Disable it for production** by setting `ENV=prod`. Production should bind a ticket via QR code mailed/printed from staff-issued sessions.
- The kitchen WebSocket sends the staff JWT in the URL query string. This works but exposes tokens to proxy logs. Migrating to a `Sec-WebSocket-Protocol`-based handshake is recommended (see `audit notes`).
- Several backend endpoints are still public and should be ticket-gated for production: `/api/chatbot/*`, `/api/feedback`, `/api/ambience/*`, `/api/stripe/create-payment-intent`. The frontend already passes the customer ticket to all of these — the backend just doesn't *require* it yet.
- The SPA's "addTable / removeTable" floor-plan UI was removed: tables are derived from active sessions on the backend.
- `MenuScene` (Three.js R3F) renders placeholders. Real GLB models live behind `/api/models3d` (currently dummy URLs in `routes/models3d.py`).

## Troubleshooting

- **"Network error contacting /api/..."** → backend isn't running, or `VITE_API_PROXY_TARGET` doesn't match the backend port.
- **"SECRET_KEY must be set..."** at backend boot → your `.env` is missing or contains a placeholder. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- **401 spam from `/api/auth/me`** → token expired/invalid. Hit logout to clear, then log in again.
- **WebSocket immediately closes (1008)** → Origin not allowed, or the JWT is missing/invalid. Check `ALLOWED_ORIGINS`.
- **Orders never appear in the kitchen** → either the customer ticket was issued for a different `table_number`, or the session was ended. Re-bootstrap with `useCustomerSession.start(n)`.

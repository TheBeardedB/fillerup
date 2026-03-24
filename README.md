# Fuel Log

Next.js fuel economy tracker. Public dashboard with charts and table, protected entry form and CSV import. GitHub OAuth single-user auth.

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | How to get it |
|---|---|
| `GITHUB_ID` | GitHub → Settings → Developer settings → OAuth Apps → New OAuth App. Set callback URL to `http://localhost:3000/api/auth/callback/github` |
| `GITHUB_SECRET` | Generated alongside the Client ID above |
| `ALLOWED_GITHUB_EMAIL` | Your GitHub account email |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `DATABASE_URL` | Local Postgres connection string, e.g. `postgresql://user:pass@localhost:5432/fuellog` |

### 3. Generate and run migrations
```bash
npm run db:generate
npm run db:migrate
```

### 4. Start dev server
```bash
npm run dev
```

---

## Deploying to Railway

### 1. Create services
In your Railway project:
- **Add service → GitHub repo** (point at this repo)
- **Add service → Database → PostgreSQL**

Railway will automatically set `DATABASE_URL` on the app service when you link the Postgres service.

### 2. Set environment variables on the app service
In Railway → your app service → Variables:

| Variable | Value |
|---|---|
| `GITHUB_ID` | From your GitHub OAuth App (update callback URL to your Railway domain: `https://your-app.railway.app/api/auth/callback/github`) |
| `GITHUB_SECRET` | From your GitHub OAuth App |
| `ALLOWED_GITHUB_EMAIL` | Your GitHub email |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.railway.app` |

> `DATABASE_URL` is injected automatically by Railway when the Postgres service is linked.

### 3. Deploy
Push to your repo — Railway will build and run:
```bash
npx drizzle-kit migrate && next start
```
Migrations run automatically on every deploy before the server starts.

---

## Importing Your Existing Data

Export your Numbers fill-up log as CSV. The importer expects these column headers (case-insensitive):

```
Date, Odometer, Cost, Gallons
```

Miles Travelled, $/Gallon, and Miles/Gallon are ignored — they're recalculated from scratch on import. Sign in, go to **Import CSV**, and upload the file. Existing rows (matched by date + odometer) are skipped so it's safe to re-import.

---

## Adding Fill-Ups on Mobile

Navigate to `/entry` (tap **Add Fill-Up** in the nav). The form:
- Defaults date to today
- Shows live $/Gallon, Miles, and MPG preview as you type
- Saves on submit

---

## Database Schema

```sql
fillups (
  id              serial primary key,
  date            date not null,
  odometer        numeric(10,1) not null,
  cost            numeric(8,2) not null,
  gallons         numeric(8,3) not null,
  dol_per_gallon  numeric(8,4),
  miles_per_gallon numeric(8,4),
  miles_travelled numeric(10,1),
  created_at      timestamp default now()
)
```

Unique deduplication key for imports: `(date, odometer)`.

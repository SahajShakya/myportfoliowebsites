# PHP Backend + Frontend Deployment Checklist

`npm run build` produces a **complete deployable** in `dist/`:
frontend, PHP backend, uploads and `.htaccess` are all bundled together.
Upload the contents of `dist/` to `htdocs/` — no manual arrangement needed.

## Pre-Deployment Checklist

### Local Testing
- [ ] Run `npm run dev` - React dev server works (proxies /api and /uploads to :8000)
- [ ] Run `npm run server` - PHP backend runs on :8000 (`.htrouter.php`)
- [ ] Test API endpoints with authorization
- [ ] Run `npm run build` - Build completes without errors
- [ ] Run `npm run start` - Production build served locally by the PHP router

### Environment Configuration
- [ ] Create `.env.production` with production frontend values (`VITE_API_URL=/api`)
- [ ] Create backend `.env` for the server with strong `SETUP_TOKEN` and real DB/SMTP/OpenRouter credentials
- [ ] Verify all database credentials
- [ ] Verify EmailJS and SMTP credentials

## Infinity Free Deployment Steps

### 1. Database Setup
- [ ] Log in to Infinity Free control panel
- [ ] Create MySQL database (or reuse `if0_36990839_portfolio`)
- [ ] Access PhpMyAdmin and import `dist/api/schema.sql`
- [ ] Verify all tables created successfully

### 2. Build
```bash
npm run build            # or npm run build:prod (uses .env.production)
```

The build automatically copies your backend env (`.env.backend.production`)
into `dist/api/.env`. `dist/` now contains **everything**:
```
dist/
├── index.html      frontend entry
├── assets/         compiled JS/CSS/3D assets
├── uploads/        uploaded files (empty → served from /uploads)
├── mypic.png
├── .htaccess       Apache router (API + SPA, blocks .env access)
└── api/            PHP backend (index.php, config/, routes/, .env)
```

> Keep `.env.backend.production` up to date locally (DB/SMTP/OpenRouter values) —
> it is gitignored so it stays off GitHub.

### 3. File Upload via FTP
Upload the **contents** of `dist/` (not the dist folder itself) into `htdocs/` —
the whole `dist/` is one deployable unit, including `api/.env`:

```
dist/*  →  htdocs/   (overwrite everything)
```

### 4. Backend Environment
The backend `.env` is already bundled at `htdocs/api/.env` after upload —
**no manual creation needed.**

If you change credentials later, edit `.env.backend.production`, rebuild, and
re-upload just `dist/api/.env` (or create `htdocs/api/.env` manually):

```
FRONTEND_URL=https://sahajshakya.com.np
SETUP_TOKEN=<strong-random-token>
DB_HOST_PROD=sql112.infinityfree.com
DB_NAME_PROD=if0_36990839_portfolio
DB_USER_PROD=if0_36990839
DB_PASSWORD_PROD=...
DB_PORT_PROD=3306
SMTP_USER=...
SMTP_PASS=...
OPENROUTER_API_KEY=...
```

### 5. Setup & Migrate
- [ ] Visit `https://sahajshakya.com.np/api/setup?token=YOUR_SETUP_TOKEN` to run migrations + seed
- [ ] Visit `https://sahajshakya.com.np/api/migrate-paths?token=YOUR_SETUP_TOKEN` to fix document paths

### 6. Testing
- [ ] Visit `https://sahajshakya.com.np/` - React app loads correctly
- [ ] Login page works
- [ ] Check browser console for errors
- [ ] Upload a file - confirm it appears in `/uploads/`
- [ ] Test on multiple devices

## What NOT to Upload
```
- node_modules/
- .git/
- .env, .env.local, .env.production, .env.backend.production (source envs stay local)
- src/ (source files, not needed in production)
- public/api/.env (the build bundles dist/api/.env from .env.backend.production instead)
- tests/ and debug scripts
```

## Chat Feature (Cloudflare Worker)

InfinityFree's free hosting blocks API POSTs (its browser security system), which is
why `/api/chat/*` fails with a 403 on the live site. The chat therefore runs on a
free Cloudflare Worker that calls OpenRouter directly. The portfolio site only loads
the worker URL.

### One-time setup (Cloudflare)
1. Run `npm run chat:export:prod` — dumps your portfolio knowledge base from the
   production DB into `chat-worker/knowledge.json`.
2. Run `npm run chat:bundle` — inlines it into `dist/chat-worker.js` (single file).
3. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create Worker**.
4. Delete the starter code, paste the entire `dist/chat-worker.js`, and **Deploy**.
5. In the worker's **Settings → Variables**: add `OPENROUTER_API_KEY` (paste your
   key; mark as Secret). Optional: `OPENROUTER_MODEL=openai/gpt-4o`.
6. Copy your worker URL, e.g. `https://sahaj-chat.<your-subdomain>.workers.dev`.

### Point the frontend at it
1. In `.env.production`, set `VITE_CHAT_API_URL=https://sahaj-chat.<your-subdomain>.workers.dev`
2. `npm run build`
3. Re-upload `dist/*` → `htdocs/` (overwrite).
4. Hard-refresh and test the chat widget.

### When your portfolio content changes
- Re-run `npm run chat:export:prod` + `npm run chat:bundle`, then paste the new
  `dist/chat-worker.js` into the Cloudflare dashboard (Deploy).

> Local dev is unaffected — without `VITE_CHAT_API_URL` the hook falls back to
> `/api`, which the local PHP backend still serves.

## After Deployment

### First Steps
1. Test basic functionality
2. Check browser console for errors
3. Check backend logs via FTP/panel

### Ongoing Maintenance
- Monitor error logs weekly
- Backup database weekly (npm run db:dump:prod)
- Update React dependencies monthly
- Test new features on staging before production

## Rollback Plan

1. Keep a backup of `dist/` and `/public/api/` locally
2. If issues occur:
   - Download current files from server
   - Delete problematic files
   - Re-upload from last working backup
   - Verify database integrity

## Security Reminders

- [ ] Change all default passwords
- [ ] Use a strong random `SETUP_TOKEN`
- [ ] Enable HTTPS
- [ ] Restrict direct access to PHP files where possible
- [ ] Regularly backup the database
- [ ] Monitor error logs for attacks

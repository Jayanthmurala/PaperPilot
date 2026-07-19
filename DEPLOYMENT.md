# PaperPilot — Deployment Guide

**Frontend → Vercel · Backend → Render (Docker) · Database → MongoDB Atlas**

```
   Vercel                        Render (Docker)                MongoDB Atlas
┌────────────┐   HTTPS/JWT    ┌──────────────────┐   motor    ┌──────────────┐
│  React SPA │ ─────────────▶ │  FastAPI + OCR   │ ─────────▶ │  eduassist_db │
│ (CRA build)│  REACT_APP_    │  Tesseract·Groq  │            └──────────────┘
└────────────┘  BACKEND_URL   └──────────────────┘
```

---

## 1 · Backend → Render

The API ships as a **Docker image** because OCR needs the `tesseract-ocr`
system binary — a plain Python runtime can't provide it. The Docker configuration is pre-configured with a **100MB** request body size limit to support multi-page PDF uploads (up to 50+ pages).

### Option A — Blueprint (recommended)
[`render.yaml`](./render.yaml) is already committed at the repo root.

1. Push this repo to GitHub.
2. Render → **New ▸ Blueprint** → pick the repo → it reads `render.yaml`.
3. Fill in the three secrets it prompts for (below), then **Apply**.

### Option B — Manual
Render → **New ▸ Web Service** → repo → **Runtime: Docker**, **Root Directory: `backend`**,
Dockerfile path `./Dockerfile`, health check path `/api/`.

### Environment variables (set in the Render dashboard)

| Key | Value | Notes |
|---|---|---|
| `MONGO_URL` | `mongodb+srv://…` | Your Atlas connection string |
| `GROQ_API_KEY` | `gsk_…` | From console.groq.com — **required** for OCR cleanup + grading |
| `CORS_ORIGINS` | `https://<your-app>.vercel.app` | **Must match your Vercel URL exactly.** Comma-separate for multiple. No trailing slash. |
| `SECRET_KEY` | *(auto-generated)* | Render generates it once. Changing it logs everyone out. |
| `DB_NAME` | `eduassist_db` | Kept as-is so existing data isn't orphaned |
| `ACCESS_TOKEN_EXPIRE_DAYS` | `7` | Optional |
| ~~`PORT`~~ | — | **Do NOT set.** Render injects it; the Dockerfile binds to `$PORT`. |

---

## 2 · Frontend → Vercel

1. Vercel → **Add New ▸ Project** → import the repo.
2. **Root Directory: `frontend`** ← important (it's a monorepo).
3. Framework preset: **Create React App** (auto-detected via [`vercel.json`](./frontend/vercel.json)).
4. Add the environment variable:

   | Key | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | `https://<your-service>.onrender.com` |

   > No `/api` suffix — the app appends it (`API = ${BACKEND_URL}/api`).

5. **Deploy.**

---

## 3 · Wire the two together

After both are live, one cross-reference each way:

- Vercel `REACT_APP_BACKEND_URL` → the Render URL
- Render `CORS_ORIGINS` → the Vercel URL

Redeploy the backend after changing `CORS_ORIGINS`.

---

## ⚠️ Gotchas that will actually bite you

1. **CRA bakes env vars at BUILD time.** `REACT_APP_BACKEND_URL` is compiled into the
   bundle — setting it *after* a deploy does nothing. Set it, then **redeploy**.

2. **MongoDB Atlas blocks Render by default.** Atlas → **Network Access** → add
   `0.0.0.0/0` (allow from anywhere). Render's free tier has no static outbound IPs,
   so an IP allowlist won't work. Without this the API boots but every query hangs.

3. **Render free tier sleeps.** After ~15 min idle the service spins down; the next
   request takes **~30–60 s** to wake. The first login will feel broken — it isn't.

4. **CORS must be exact.** `https://app.vercel.app` ≠ `https://app.vercel.app/`.
   Vercel *preview* deploys get unique URLs — they'll be CORS-blocked unless you add
   them too (or accept that only production works).

5. **Don't lose `SECRET_KEY`.** It signs the JWTs. Rotating it invalidates every
   existing login. (It's env-driven now — the old hardcoded secret was removed.)

6. **`npm install` needs `--legacy-peer-deps`** (React 19 vs. some React-18 peer ranges).
   Handled by [`frontend/.npmrc`](./frontend/.npmrc) + `vercel.json`'s `installCommand`.

---

## 4 · Test the image locally before pushing

Same image Render will run — if it works here, it works there:

```bash
# from the repo root
docker compose up --build

# then:
curl http://localhost:8000/api/
#   {"message":"PaperPilot API - Subjective Answer Evaluation System"}

# prove OCR's system binary made it into the image:
docker compose exec api tesseract --version
```

`docker-compose.yml` reads `backend/.env`, so it uses the same config you run locally.
(No Mongo container — the database is Atlas.)

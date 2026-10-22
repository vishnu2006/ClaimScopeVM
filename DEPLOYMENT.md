# ClaimScope — Production Deployment Guide
**Next.js Frontend on Cloudflare Pages** • **FastAPI Backend on Render**

This guide provides step-by-step instructions and exact settings to deploy ClaimScope to production with **zero paid services**.

---

## Architecture Overview

```mermaid
flowchart LR
    User([User Browser])
    CF[Cloudflare Pages<br/>Next.js Frontend]
    Render[Render Web Service<br/>FastAPI Backend]
    DB[(Render PostgreSQL<br/>or Managed DB)]
    Gemini[Google Gemini 2.5 Flash<br/>Free Tier API]

    User -->|HTTPS| CF
    CF -->|REST / JSON| Render
    Render -->|SQLAlchemy async| DB
    Render -->|Multimodal / Vision| Gemini
```

---

## 1. Cloudflare Pages vs. Cloudflare Workers Analysis

### Verdict: **Cloudflare Pages (Direct Git Integration with Next.js Preset)**

- **Why**: 
  - All 13 ClaimScope routes are interactive Single Page Application (SPA) client components (`'use client'`).
  - Next.js dynamic routing (`/cases/[id]`) relies on client-side routing (`useParams()`) connected to the backend API.
  - Cloudflare Pages provides a native **Next.js** build preset with unlimited free bandwidth and automatic Git CI/CD deployments on push.
  - Static export (`output: 'export'`) is **not needed** and would artificially restrict future SSR or API route expansion; Cloudflare Pages builds standard Next.js effortlessly.

---

## 2. Render Backend Deployment (Step-by-Step)

### Step 2.1: Create Free PostgreSQL Database on Render
To ensure case records, investigations, and telemetry survive server sleep/restarts:
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Set:
   - **Name**: `claimscope-db`
   - **Database**: `claimscope`
   - **User**: `claimscope_user`
   - **Region**: Oregon (US West) or Ohio (US East)
   - **Plan**: Free
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (e.g. `postgres://claimscope_user:...@dpg-.../claimscope`).
   - *Note: Replace the leading `postgres://` or `postgresql://` with `postgresql+asyncpg://` for async SQLAlchemy.*

### Step 2.2: Create Web Service for FastAPI Backend
1. In Render, click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/vishnu2006/ClaimScopeVM.git`.
3. Configure the settings:
   - **Name**: `claimscope-api`
   - **Region**: Same region as your database
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan Type**: Free

### Step 2.3: Enter Backend Environment Variables on Render
Under **Environment Variables**, add:
| Key | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Internal PostgreSQL URL from Step 2.1 |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key (Backend-only) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Multimodal model |
| `DEBUG` | `False` | Production mode |
| `CORS_ORIGINS` | `http://localhost:3000,https://claimscope.pages.dev` | Frontend origins (update with custom domain if applicable) |
| `CORS_ORIGIN_REGEX` | `^https:\/\/.*\.pages\.dev$` | Allows all Cloudflare Pages preview & production deployments |
| `PYTHONUNBUFFERED` | `1` | Real-time logging |

4. Click **Create Web Service**.
5. Note your backend URL (e.g., `https://claimscope-api.onrender.com`).
6. Test health: `https://claimscope-api.onrender.com/health` should return `{"status": "healthy", ...}`.

---

## 3. Cloudflare Pages Frontend Deployment (Step-by-Step)

### Step 3.1: Connect Repository to Cloudflare Pages
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select your GitHub repository: `ClaimScopeVM`.
4. Click **Begin setup**.

### Step 3.2: Configure Build Settings
Fill in the exact fields:
- **Project name**: `claimscope` (creates `https://claimscope.pages.dev`)
- **Production branch**: `master`
- **Framework preset**: `Next.js`
- **Root directory**: `frontend`
- **Build command**: `npm run build`
- **Build output directory**: `.next`

### Step 3.3: Enter Frontend Environment Variables
Under **Environment Variables (Production)**:
| Variable Name | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://claimscope-api.onrender.com/api/v1` | Your live Render backend API URL (include `/api/v1`) |
| `NODE_VERSION` | `20` | LTS Node.js runtime |

*(Optional: Duplicate `NEXT_PUBLIC_API_URL` under the **Preview** tab so pull request previews can also query your API).*

### Step 3.4: Deploy
Click **Save and Deploy**. Cloudflare Pages will build the Next.js frontend and provide your live URL.

---

## 4. Verification Checklist

1. [ ] **Homepage**: Open `https://claimscope.pages.dev` — logo, hero, StarBorder animations, and TargetCursor should render smoothly.
2. [ ] **Navigation**: Click through *Overview*, *Claims*, *Investigation*, *Reports*, *Platform*, and *Demo Lab*.
3. [ ] **Demo Lab Instant Intake**: Go to `/demo` and click **Load Incident Package (Case D)**. The case should create instantly and redirect to the workbench.
4. [ ] **Investigation Stepper**: Click **Run Adaptive Investigation**. Telemetry steps should execute with Gemini 2.5 Flash.
5. [ ] **Dossier PDF Download**: Click **Download Official Dossier (PDF)**. A clean A4 PDF should download with exact page numbers (*Page X of Y*) and footer attribution (*Built by Vishnu Pandrangi*).
6. [ ] **Persistence**: Refresh or reopen after backend spins down; historical case state should load intact from PostgreSQL.

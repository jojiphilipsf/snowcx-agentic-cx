# SnowCX — Agentic CX Intelligence

A premium, production-grade **Agentic Customer Experience Intelligence** platform built with **Next.js**, **Snowflake**, and **Cortex AI**. Designed for telecom operators to deliver AI-powered customer 360, proactive care, intelligent call analytics, and next-best-action recommendations — all powered by Snowflake's unified data platform.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features & Pages](#features--pages)
- [Data Model (16 Tables)](#data-model-16-tables)
- [AI / Cortex Integration](#ai--cortex-integration)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (One-Click Install)](#quick-start-one-click-install)
- [Manual Installation](#manual-installation)
- [Running Locally](#running-locally)
- [Deploying to SPCS (Snowpark Container Services)](#deploying-to-spcs)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

SnowCX demonstrates how a telecom company can unify customer data, call center recordings, network incidents, churn predictions, and AI-generated recommendations into a single agentic application — all running on Snowflake.

**Key capabilities:**
- **Customer 360**: Full customer profile with usage, billing, engagement, QoE, churn risk, conversation memory, and AI agent recommendations
- **Call Center Analytics**: Sentiment analysis, intent classification, call quality monitoring, and rep performance tracking across 60+ recorded calls
- **Agent Assist**: AI-powered case summarization, contextual call history, and rep assist briefs using Cortex LLM
- **Proactive Care**: Network incident tracking with customer-level impact analysis and notification management
- **Next Best Action**: ML-driven churn prediction with prioritized retention and upsell recommendations
- **AI Chat**: Natural language Q&A against the full dataset using Snowflake Cortex `mistral-large2`

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (React UI)                     │
│  Next.js 16 + Tailwind v4 + Recharts + Framer Motion    │
└──────────────┬───────────────────────────────────────────┘
               │ HTTP (port 3000)
┌──────────────▼───────────────────────────────────────────┐
│              Next.js API Routes (Server)                   │
│  /api/customers, /api/customer-detail, /api/call-analytics │
│  /api/agent-assist, /api/proactive-care, /api/next-best-   │
│  action, /api/ai-chat                                      │
│                                                            │
│  ┌─ Server-side Cache ─────────────────────────────────┐   │
│  │ In-memory Map, configurable TTL (15-60s), LRU 200   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────┬─────────────────────────────────────────────┘
               │ HTTP POST (port 3001)
┌──────────────▼─────────────────────────────────────────────┐
│           Snowflake Python Proxy (sf-proxy.py)              │
│  Authenticates via connections.toml (OAuth / password)       │
│  Proxies SQL queries to Snowflake                            │
└──────────────┬──────────────────────────────────────────────┘
               │ Snowflake SQL
┌──────────────▼──────────────────────────────────────────────┐
│                  Snowflake (TELECOM_CX.DATA)                 │
│  16 tables · Cortex LLM (mistral-large2) · SPCS hosting     │
└──────────────────────────────────────────────────────────────┘
```

**Why the Python proxy?** Snowflake's Node.js SDK does not support OAuth/browser-based authentication in server contexts. The lightweight Python proxy (`sf-proxy.py`, 72 lines) bridges this gap using the Python connector which has full OAuth support.

---

## Features & Pages

### 1. Storyboard (AE Talk Track)
Static page for Account Executives presenting the demo. Includes:
- Business outcome KPIs (churn reduction, CSAT improvement, call deflection, revenue impact)
- Story arc and value framing
- Demo talk track with timing guide
- Agent inventory (6 AI agents and their capabilities)
- Confirmed and inferred platform capabilities

### 2. Customer 360
The most data-rich page with 10 tabs:
- **Overview**: 5 hero KPIs, signal badges, customer info
- **Usage**: 6-month voice/data/SMS trends
- **Billing**: Payment history, overage tracking
- **Engagement**: Channel activity, self-service metrics
- **QoE (Quality of Experience)**: Network performance, latency, coverage
- **Cases**: Support ticket history with status tracking
- **Calls**: Call recordings with sentiment and full transcripts
- **Orchestration**: AI agent recommendations and action audit trail
- **Memory**: Conversation memory formatted as human-readable cards (intent, specialist, summary, escalation)
- **AI Assistant**: Chat with Cortex LLM about the selected customer

### 3. Call Center Analytics
Three-tab dashboard:
- **Dashboard**: 6 KPIs, call volume area chart, sentiment donut, intent distribution bar, quality donut
- **Call Explorer**: Filterable call table with detail panel and full conversation transcripts
- **Rep Performance**: Per-representative metrics with bar charts and performance table

### 4. Agent Assist
AI-powered case management:
- Case list sidebar with source/priority/status filters
- Case detail panel with AI-generated summary
- Contextual customer data and call history
- Rep assist briefs from conversation memory

### 5. Proactive Care
Network incident management:
- Incident accordion with severity indicators
- Expand for impact KPIs, root cause analysis, affected customer breakdown
- Notification status tracking (already notified vs. pending)
- Customer-level impact details by plan tier, region, and churn risk

### 6. Next Best Action
ML-driven recommendations:
- **Overview**: Churn risk distribution, at-risk customer stats, revenue metrics
- **Upsell/Retention**: Prioritized offers per customer with propensity scores, estimated value, and channel preferences

---

## Data Model (16 Tables)

All tables live in `TELECOM_CX.DATA`:

| Table | Rows | Description |
|-------|------|-------------|
| `TELECOM_CUSTOMERS` | 500 | Core customer profiles (plan, tenure, segment, churn risk) |
| `TELECOM_DEVICES` | 500 | Device model, OS, payment status, warranty |
| `TELECOM_USAGE` | 3,000 | 6 months of voice/data/SMS usage per customer |
| `TELECOM_BILLING` | 3,000 | 6 months of billing (base, taxes, overage, payment status) |
| `TELECOM_ENGAGEMENT` | 3,000 | Channel engagement (app, web, chat, store, email) |
| `TELECOM_QOE` | 1,500 | 3 months of network quality (latency, speeds, coverage) |
| `TELECOM_CALL_RECORDINGS` | 60 | Call center recordings with full transcripts and sentiment |
| `TELECOM_CASES` | ~800 | Support cases linked to calls and customers |
| `TELECOM_CASE_NOTES` | ~1,800 | Case notes with agent IDs and timestamps |
| `TELECOM_INCIDENTS` | 25 | Network incidents (outages, degradation events) |
| `TELECOM_INCIDENT_IMPACT` | ~800 | Per-customer impact from each incident |
| `TELECOM_CHURN_SCORES` | 500 | ML churn predictions with risk factors |
| `TELECOM_NBA_RECOMMENDATIONS` | ~1,200 | Next-best-action offers (retention + upsell) |
| `TELECOM_CONVERSATION_MEMORY` | 500 | Agent conversation memory (intent, specialist, summary) |
| `TELECOM_ACTION_AUDIT` | ~750 | Action audit trail with autonomy levels and approvals |
| `TELECOM_AGENT_RECOMMENDATIONS` | ~1,500 | AI agent routing and diagnostic recommendations |

**Data relationships**: Call recordings with negative sentiment automatically generate open support cases. Customers with negative calls get elevated churn risk scores and retention offers in NBA recommendations. Conversation memory and agent recommendations are contextualized based on all upstream signals.

---

## AI / Cortex Integration

The app uses **Snowflake Cortex** for AI capabilities:

- **LLM**: `SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', prompt)` — used in the AI Chat feature for natural language Q&A about customer data
- **Prompt pattern**: Simple string prompt (not OBJECT_CONSTRUCT) with escaped customer context
- **Use cases**: Customer situation summarization, troubleshooting suggestions, retention strategy recommendations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom NOC dark theme |
| Charts | Recharts 3 with NOC color palette |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Next.js API Routes → Python Proxy → Snowflake |
| Database | Snowflake (TELECOM_CX.DATA) |
| AI | Snowflake Cortex (mistral-large2) |
| Deployment | SPCS (Snowpark Container Services) or local |
| Container | Docker / Podman, multi-stage Alpine build |

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **Python** 3.9+ ([download](https://python.org))
- **Python packages**: `snowflake-connector-python`, `pandas`, `numpy`
- **Snowflake account** with:
  - A connection configured in `~/.snowflake/connections.toml` (preferred) or env vars
  - ACCOUNTADMIN role (for initial setup) or equivalent privileges
  - Cortex LLM access (for AI Chat feature)

### Setting up a Snowflake connection

Create or edit `~/.snowflake/connections.toml`:

```toml
[myconnection]
account = "your-account-identifier"
user = "your_username"
authenticator = "externalbrowser"   # or "snowflake" for password auth
role = "SYSADMIN"
warehouse = "COMPUTE_WH"
```

If using password auth:
```toml
[myconnection]
account = "your-account-identifier"
user = "your_username"
password = "your_password"
role = "SYSADMIN"
warehouse = "COMPUTE_WH"
```

---

## Quick Start (One-Click Install)

```bash
# Clone the repo
git clone https://github.com/jojiphilipsf/snowcx-agentic-cx.git
cd snowcx-agentic-cx

# Run the installer (creates DB, loads data, installs deps, builds app)
bash install.sh --connection myconnection
```

The installer will:
1. Verify prerequisites (Node.js 18+, Python 3.9+, snowflake-connector-python)
2. Create Snowflake infrastructure (database, schema, warehouse, roles, compute pool)
3. Generate and load 16 tables of demo data (~500 customers)
4. Install Node.js dependencies
5. Build the Next.js application

### Installer Options

```bash
bash install.sh --connection myconn              # Full install
bash install.sh --connection myconn --skip-data   # Skip data (tables exist)
bash install.sh --connection myconn --skip-infra  # Skip DDL (infra exists)
bash install.sh --connection myconn --spcs        # Also deploy to SPCS
```

---

## Manual Installation

### Step 1: Snowflake Infrastructure

Run the SQL setup script in Snowsight or via SnowSQL:

```bash
# In Snowsight: paste contents of setup/snowflake-setup.sql
# Or via SnowSQL:
snowsql -c myconnection -f setup/snowflake-setup.sql
```

This creates:
- Database `TELECOM_CX` with schema `DATA`
- Warehouse `TELECOM_CX_WH` (X-Small)
- Role `TELECOM_CX_DEMO_RL` with appropriate grants
- Compute pool `TELECOM_CX_POOL` (for SPCS)
- Image repository `TELECOM_CX_REPO` (for SPCS)

### Step 2: Load Demo Data

```bash
SNOWFLAKE_CONNECTION_NAME=myconnection python3 setup/seed-data.py
```

This generates 16 tables with cohesive, interlinked data:
- 500 customers with devices, usage, billing, engagement
- 60 call recordings with full conversation transcripts
- ~800 support cases linked to negative calls
- 25 network incidents with customer-level impact
- ML churn scores, NBA recommendations, conversation memory

### Step 3: Install Dependencies

```bash
npm ci
```

### Step 4: Build

```bash
npm run build
```

---

## Running Locally

You need **two terminals** — one for the Snowflake proxy and one for the Next.js dev server.

### Terminal 1: Start the Snowflake Proxy

```bash
SNOWFLAKE_CONNECTION_NAME=myconnection python3 sf-proxy.py
```

This starts a lightweight HTTP proxy on port 3001 that authenticates to Snowflake and forwards SQL queries. You should see:

```
Connecting to Snowflake...
Connected!
Snowflake proxy running on http://localhost:3001
```

### Terminal 2: Start the Next.js Dev Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SNOWFLAKE_CONNECTION_NAME` | (none) | Connection name from connections.toml |
| `SF_PROXY_URL` | `http://localhost:3001` | URL of the Python proxy |
| `SNOWFLAKE_DB_SCHEMA` | `TELECOM_CX.DATA` | Target database.schema |
| `PROXY_PORT` | `3001` | Port for sf-proxy.py |

---

## Deploying to SPCS

### Option A: Via Installer

```bash
bash install.sh --connection myconn --skip-data --skip-infra --spcs
```

### Option B: Manual Steps

1. **Build the container** (use `podman` if `docker` is blocked):

```bash
# Get your registry URL
REGISTRY=$(snow sql -q "SHOW IMAGE REPOSITORIES IN SCHEMA TELECOM_CX.DATA" --format json | python3 -c "import sys,json; print([r for r in json.load(sys.stdin) if 'TELECOM_CX_REPO' in str(r)][0]['repository_url'])")

# Build
docker build --platform linux/amd64 -t ${REGISTRY}/snowcx-react:latest .

# Login & push
docker login ${REGISTRY}
docker push ${REGISTRY}/snowcx-react:latest
```

2. **Create the SPCS service**:

```sql
CREATE SERVICE IF NOT EXISTS TELECOM_CX.DATA.SNOWCX_SERVICE
  IN COMPUTE POOL TELECOM_CX_POOL
  FROM SPECIFICATION $$
spec:
  containers:
    - name: snowcx-react
      image: /telecom_cx/data/telecom_cx_repo/snowcx-react:latest
      env:
        SNOWFLAKE_ACCOUNT: <your_account>
        SNOWFLAKE_DATABASE: TELECOM_CX
        SNOWFLAKE_SCHEMA: DATA
        SNOWFLAKE_WAREHOUSE: TELECOM_CX_WH
      readinessProbe:
        port: 8080
        path: /
      resources:
        requests:
          cpu: 0.5
          memory: 1Gi
        limits:
          cpu: 2
          memory: 4Gi
  endpoints:
    - name: app
      port: 8080
      public: true
$$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;
```

3. **Get the endpoint URL**:

```sql
SHOW ENDPOINTS IN SERVICE TELECOM_CX.DATA.SNOWCX_SERVICE;
```

---

## Project Structure

```
snowcx-agentic-cx/
├── setup/
│   ├── snowflake-setup.sql     # Snowflake infrastructure DDL
│   └── seed-data.py            # Data generator (16 tables, 500 customers)
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind v4 theme + NOC design tokens
│   │   ├── layout.tsx          # Root layout with Inter font
│   │   ├── page.tsx            # Redirect to /storyboard
│   │   ├── api/
│   │   │   ├── customers/route.ts       # Customer list API
│   │   │   ├── customer-detail/route.ts # Full 360 data (3 parallel query groups)
│   │   │   ├── call-analytics/route.ts  # Dashboard, calls, reps
│   │   │   ├── agent-assist/route.ts    # Cases, notes, context, call history
│   │   │   ├── proactive-care/route.ts  # Incidents, impact, summary
│   │   │   ├── next-best-action/route.ts# Overview, at-risk, NBA offers
│   │   │   └── ai-chat/route.ts         # Cortex LLM chat
│   │   └── (dashboard)/
│   │       ├── layout.tsx               # Dashboard shell with sidebar
│   │       ├── storyboard/page.tsx      # AE talk track
│   │       ├── customer360/page.tsx     # Customer 360 (10 tabs)
│   │       ├── call-analytics/page.tsx  # Call center analytics (3 tabs)
│   │       ├── agent-assist/page.tsx    # AI agent assist
│   │       ├── proactive-care/page.tsx  # Network incident tracking
│   │       └── next-best-action/page.tsx# Churn & upsell recommendations
│   ├── components/
│   │   ├── Shell.tsx            # Collapsible sidebar with SnowCX branding
│   │   ├── Charts.tsx           # NOC-themed chart wrappers (bar, line, area, donut)
│   │   └── ui.tsx               # GlassCard, KPICard, StatusBadge, DataTable, etc.
│   └── lib/
│       ├── snowflake.ts         # Query layer with caching (proxy client)
│       ├── hooks.ts             # useFetch with SWR client cache
│       └── colors.ts            # Chart and status color palettes
├── sf-proxy.py                  # Snowflake Python proxy (OAuth bridge)
├── Dockerfile                   # Multi-stage production build
├── service-spec.yaml            # SPCS service specification
├── install.sh                   # One-click installer
├── package.json
├── next.config.ts               # standalone output for Docker
├── tsconfig.json
├── postcss.config.mjs
└── .gitignore
```

---

## Configuration

### Changing the Database/Schema

Set the `SNOWFLAKE_DB_SCHEMA` environment variable:

```bash
# In seed-data.py
SNOWFLAKE_DB_SCHEMA=MY_DB.MY_SCHEMA python3 setup/seed-data.py

# In sf-proxy.py (edit line 24)
conn.cursor().execute("USE SCHEMA MY_DB.MY_SCHEMA")

# In Next.js (set in .env.local or environment)
SNOWFLAKE_DB_SCHEMA=MY_DB.MY_SCHEMA
```

### Changing the Cortex LLM Model

Edit `src/app/api/ai-chat/route.ts` and change the model name:

```typescript
// Change 'mistral-large2' to your preferred model
const sql = `SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '${escaped}') AS RESPONSE`;
```

Available models: `mistral-large2`, `llama3.1-70b`, `llama3.1-405b`, `mixtral-8x7b`, etc.

### Performance Tuning

The app includes two caching layers:

1. **Server-side** (`src/lib/snowflake.ts`): In-memory cache with configurable TTL per query type (15-60 seconds), LRU eviction at 200 entries
2. **Client-side** (`src/lib/hooks.ts`): SWR cache with 20-second TTL and stale-while-revalidate pattern

Adjust TTL values in the `cachedQuery()` calls within each API route.

---

## Troubleshooting

### "Connection refused" on port 3001
The Snowflake proxy isn't running. Start it in a separate terminal:
```bash
SNOWFLAKE_CONNECTION_NAME=myconnection python3 sf-proxy.py
```

### OAuth browser window doesn't open
If your connection uses `externalbrowser` auth, make sure you're NOT running with `--headless` flag. The proxy needs a browser to complete OAuth.

### "Database TELECOM_CX does not exist"
Run the infrastructure setup first:
```bash
bash install.sh --connection myconnection --skip-data
```
Or execute `setup/snowflake-setup.sql` in Snowsight.

### Slow initial page loads
First load after proxy restart is slower due to cold Snowflake warehouse. Subsequent loads are cached (15-60s TTL). The warehouse auto-suspends after 120 seconds of inactivity.

### SPCS deployment: "Image not found"
Ensure you pushed to the correct registry path:
```bash
SHOW IMAGE REPOSITORIES IN SCHEMA TELECOM_CX.DATA;
```
The image path in `service-spec.yaml` must match: `/telecom_cx/data/telecom_cx_repo/snowcx-react:latest`

### Port conflicts
If port 3000 or 3001 is in use:
```bash
# Change Next.js port
npm run dev -- -p 4100

# Change proxy port
PROXY_PORT=3002 python3 sf-proxy.py

# Update proxy URL for Next.js
SF_PROXY_URL=http://localhost:3002 npm run dev -- -p 4100
```

---

## Design System

The app uses a premium dark theme inspired by the **NOC (Network Operations Center) Design System**:

- **Background**: `#0a0a0f` (deep), `#0f172a` (surface), `#1e293b` (elevated)
- **Accent**: `#29b5e8` (Snowflake cyan)
- **Font**: Inter (Google Fonts)
- **Glass morphism**: Cards with `backdrop-blur` and subtle borders
- **KPI Cards**: Gradient accent bars (7 color variants)
- **Charts**: Custom color sequence: `#29b5e8`, `#6366f1`, `#10b981`, `#f59e0b`, `#ef4444`, `#8b5cf6`, `#ec4899`, `#14b8a6`

---

## License

This is a demo/reference application. Use at your own discretion.

Built with [Snowflake](https://snowflake.com) + [Next.js](https://nextjs.org) + [Cortex AI](https://docs.snowflake.com/en/user-guide/snowflake-cortex)

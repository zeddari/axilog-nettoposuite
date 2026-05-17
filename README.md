# Axilog NetTopoSuite

Enterprise Network Topology & Service Management Platform.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS (dark/light mode) |
| Backend | Node.js 20 + Fastify 4 + TypeScript |
| Database | MySQL 8 |
| Auth | Keycloak SSO (OIDC/PKCE) + local accounts |
| Real-time | Socket.IO 4 |
| Topology | React Flow 11 |
| MCP | Model Context Protocol server (NLP interactions) |

## Quick start (development)

### Prerequisites
- Node.js 20+
- MySQL 8 running locally (or via Docker)
- Generate JWT keys (one-time):

```bash
mkdir -p certs
openssl genrsa -out certs/jwt.key 4096
openssl rsa -in certs/jwt.key -pubout -out certs/jwt.key.pub
```

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in MYSQL_PASSWORD, etc.
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run database migrations

```bash
mysql -u root -p topology < backend/src/db/migrations/001_core.sql
```

### 4. Start all services

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

Default login: `admin@axilog.local` / `Admin@Axilog123` *(change immediately)*

---

## Docker (production)

```bash
# Copy and fill in .env
cp .env.example .env

# Start without SSO
docker compose -f docker/docker-compose.yml up -d

# Start with Keycloak SSO
docker compose -f docker/docker-compose.yml --profile sso up -d
```

---

## Project structure

```
revamp/
├── backend/          Node.js Fastify API
│   └── src/
│       ├── modules/  Feature modules (auth, topology, alarms, catalogue…)
│       ├── plugins/  Fastify plugins (JWT auth, RBAC)
│       ├── db/       Kysely schema + migrations
│       └── shared/   TypeScript types
├── frontend/         React 18 + Vite
│   └── src/
│       ├── components/  Layout (AppShell, Sidebar, TopBar, AlarmBanner)
│       ├── features/    Feature modules (topology canvas, catalogue…)
│       ├── hooks/       useTheme, useAuth
│       ├── pages/       Route pages
│       ├── api/         Axios API clients
│       └── store/       Zustand stores
├── mcp-server/       MCP server (NLP tools for AI clients)
├── docker/           docker-compose.yml, MySQL init, Nginx config
├── keycloak/         Keycloak realm export (axilog realm)
├── certs/            JWT RS256 keys (gitignored)
└── .env.example      Environment template
```

## Authentication

The app supports two auth modes, both enabled at the same time:

| Mode | How to use |
|------|-----------|
| **Local** | Email + password. Register at `/register` (if `ALLOW_REGISTRATION=true`) |
| **Keycloak SSO** | Click "Sign in with Axilog SSO" on login page (requires `VITE_KEYCLOAK_ENABLED=true`) |

## Roles

| Role | Access |
|------|--------|
| `admin` | Full access |
| `operator` | Topology read/write, alarm management, discovery |
| `service_manager` | Full catalogue, read-only topology |
| `viewer` | Read-only everywhere |

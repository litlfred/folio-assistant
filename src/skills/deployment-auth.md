---
name: deployment-auth
roles: [owner]
---

# Deployment & Auth Skill

## Role

Handles questions and tasks related to the folio deployment infrastructure,
OAuth authentication, role-based access control, and server management.

## Architecture Overview

```
Internet → Caddy (:443, auto TLS)
         → auth-gateway (:4180, Bun) — dual OAuth + role sessions
         → lean-mcp (:8080) — Lean LSP + content API
         → static viewer/assistant files
```

## Dual OAuth + Role System

### Providers

| Provider | Role | Whitelist file | Capabilities |
|----------|------|----------------|--------------|
| Google | `viewer` | `deploy/google-viewers.txt` | Read papers, submit feedback (with username) |
| GitHub | `collaborator` | `deploy/github-collaborators.txt` | Edit/WYSIWYG, delete todos, manage branches |
| GitHub (owner match) | `owner` | Same file, auto-detected | All above + commit to main |

### Auth flow

1. User visits folio → redirected to `/login` chooser page
2. User picks Google or GitHub → OAuth flow with respective provider
3. Auth-gateway checks whitelist → rejects if not listed
4. Auth-gateway issues HMAC-signed session cookie with `{email, name, provider, role}`
5. All subsequent requests carry cookie → auth-gateway injects `X-User-Role` headers
6. API server reads headers and enforces permissions

### Bearer token bypass

CLI/API clients can skip OAuth entirely:
```
curl -H 'Authorization: Bearer <FOLIO_API_TOKEN>' https://folio.litlfred.org/mcp
```

## CRITICAL: Whitelist Protection

**NEVER modify these files:**
- `deploy/google-viewers.txt`
- `deploy/github-collaborators.txt`

Only the repo owner can edit them manually. If asked to add/remove users,
instruct the owner to edit the files directly and push to main. The
self-updater will pick up changes within 60 seconds.

## API Permission Matrix

| Endpoint | Method | Min Role | Notes |
|----------|--------|----------|-------|
| `/api/paper`, `/api/folio` | GET | viewer | Read-only |
| `/api/feedback` | GET | viewer | Read feedback |
| `/api/feedback` | POST | viewer | Create feedback (author attached) |
| `/api/feedback` | DELETE | collaborator | Delete feedback items |
| `/api/block/save` | POST | collaborator | Edit markdown content |
| `/mcp` | POST | viewer (OAuth) or bearer token | MCP protocol |

## Unified Docker Image

The folio deployment uses the **same Docker image** as all CI/CD
workflows: `ghcr.io/litlfred/qou/paper-assistant:latest`.

Built by `.github/workflows/build-lean-mcp.yml` from
`scripts/mcp-server/Dockerfile`, it includes everything needed to
run the MCP server, build PDFs, compile Lean, and execute CI scripts —
all offline once pulled.

### Image build triggers

| Trigger | Frequency |
|---------|-----------|
| Push to main (content, Lean, MCP, CI scripts) | On change |
| Weekly schedule | Sunday 06:00 UTC |
| Manual dispatch | `build-lean-mcp.yml` |

### Auto-deployment

The `deploy/self-update-folio.sh` cron script (runs every 60s on the
Hetzner server) polls GHCR for new image digests and auto-deploys.
Typical latency from merge to live: ~2-3 minutes.

### LLM provider config

The `llm` section in `lean-mcp.config.json` configures which LLM
backend the MCP server uses:

```json
"llm": {
  "provider": "anthropic",   // "anthropic" | "openai" | "local"
  "providers": {
    "anthropic": { "model": "claude-sonnet-4-6", "api_base": "https://api.anthropic.com" },
    "openai":    { "model": "gpt-4o", "api_base": "https://api.openai.com/v1" },
    "local":     { "model": "llama3", "api_base": "http://localhost:11434/v1" }
  }
}
```

Switch provider by changing `"provider"`. For local LLMs, start
Ollama (`ollama serve`) before the MCP server.

## Key Files

| File | Purpose |
|------|---------|
| `lean-mcp.config.json` | Central config (auth, LLM, Lean, image, domain) |
| `scripts/mcp-server/Dockerfile` | **Unified Docker image** (MCP + CI + build) |
| `.github/workflows/build-lean-mcp.yml` | Image build workflow |
| `deploy/auth-gateway/server.ts` | Auth gateway service (Bun, ~520 lines) |
| `deploy/docker-compose.folio.yml` | Service orchestration (Caddy + auth-gateway + lean-mcp) |
| `deploy/Caddyfile.folio.template` | Reverse proxy config template |
| `deploy/generate-config.sh` | Generate .env + Caddyfile from config |
| `deploy/self-update-folio.sh` | Auto-update cron script |
| `.github/workflows/deploy-folio.yml` | CI: provision/update/destroy Hetzner server |
| `deploy/google-viewers.txt` | Google viewer whitelist (PROTECTED) |
| `deploy/github-collaborators.txt` | GitHub collaborator whitelist (PROTECTED) |

## GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `HETZNER_API_TOKEN` | Hetzner Cloud infrastructure |
| `GOOGLE_CLIENT_ID` | Google OAuth (viewers) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (viewers) |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth (collaborators) |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth (collaborators) |

## Common Tasks

### Add a new viewer
Instruct the repo owner to add their Gmail to `deploy/google-viewers.txt` and push.

### Add a new collaborator
Instruct the repo owner to add their GitHub username to `deploy/github-collaborators.txt` and push.

### Rotate OAuth credentials
Run the "update" action in the Deploy Folio workflow after updating GitHub Secrets.

### Debug auth issues
1. Check `/health` endpoint (no auth)
2. Check auth-gateway logs: `docker logs auth-gateway`
3. Verify whitelist files are mounted: `docker exec auth-gateway cat /etc/auth-gateway/google-viewers.txt`
4. Check cookie in browser DevTools → Application → Cookies

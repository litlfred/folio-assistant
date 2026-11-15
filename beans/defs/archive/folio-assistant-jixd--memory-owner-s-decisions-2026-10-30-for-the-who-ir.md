---
# folio-assistant-jixd
$schema: bean/1.0.0
title: 'Memory: Owner''s decisions (2026-10-30) for the WHO IRIS CDN Exporter: Cloudflare hosts exports, GitHub Pages only previews'
status: completed
type: task
priority: low
created_at: 2026-10-30T15:13:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-iris-cdn-exporter.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner's decisions (2026-10-30) for the WHO IRIS CDN Exporter: Cloudflare hosts exports, GitHub Pages only previews


Thread "Build WHO IRIS CDN export processes", issue litlfred/who-iris#100, branch claude/iris-cdn-exporter.

Owner decisions 2026-10-30:
- Initial load = metadata PLUS PDFs (~361 GiB).
- Change feed = DSpace REST API only (no OAI-PMH); weekly reconciliation catches withdrawals.
- Exported assets live on Cloudflare: a git repo on Cloudflare (Artifacts, NOT GitHub) + R2/CDN. Cloudflare is an actor in the processes.
- litlfred/who-iris and WHO/who-iris GitHub Pages are NOT for exported assets; they only preview the full exported site. UPDATED 17:02Z same day: who-iris also holds, as `materialized`, every IRIS item the harness layers had ingested (moved in from smart-base, smart-immunizations, smart-hiv, folio-assistant; thread "Move IRIS assets into who-iris"), as part of the fuller "pre-CDN preview" (owner's words).
- Signatures: keys as verificationMethods in a did:web DID document; do not assume GDHCN.
Also decided: per-item JWS + release JWS (ES256, x5c chain to WHO signing DID); full graph rebuild nightly; GitHub Actions runs it; key in GH environment secret iris-cdn-release; Cloudflare git holds release history only, bytes in R2. Signing key is assumed already published under a DID (offline, not modelled).
Merged who-iris#103 (bad1555) 2026-10-30 15:4xZ; follow-ups who-iris#104. Owner still to provide the DID/domain and set up Cloudflare + secrets.

**Why:** coordinator/other threads touching who-iris docs or publishing must not put exports on gh-pages.
**How to apply:** route export storage to Cloudflare; keep who-iris Pages as preview only.

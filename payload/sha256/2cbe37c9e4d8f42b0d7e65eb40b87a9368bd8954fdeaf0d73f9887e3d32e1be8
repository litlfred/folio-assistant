---
# folio-assistant-a3fj
$schema: bean/1.0.0
title: 'Dependency advisories: 7 high, 12 moderate in smart-trust, who-iris and dth-hrh installs'
status: todo
type: bug
priority: normal
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T04:10:00Z
parent: folio-assistant-3o2w
---

**Category:** security (dependencies). **Rule:** `scz-review-dependency-changes`. **Severity:** normal: build-time tooling, not served code; `check-dependency-advisories` is warn-only by design.

**Evidence** (`bun audit` after `bun install`, 2026-10-31):

- smart-trust: 24 (7 high, 12 moderate, 5 low). dth-hrh: 24 (7 high, 12 moderate, 5 low). who-iris: 21 (6 high, 11 moderate, 4 low).
- High: `undici` < 6.29.1 (GHSA-2m5v-pch6-74hx TLS certificate validation bypass via dropped tls options; GHSA-qrxm-fqhp-jwvm; GHSA-vxpw-j846-p89q; GHSA-vrm6-8vpv-qv8q; GHSA-v9p9-hfj2-hcw8), `@fastify/busboy` < 3.2.1 (GHSA-x8mw-p69m-v3mx), `zod` < 4.6.6 (GHSA-mrhx-c7xc-m3w5; smart-trust and dth-hrh; dth-hrh's own `package.json` asks for `zod ^4.6.5`).
- Moderate includes `node-csv` prototype replacement (GHSA-8cw4-87c7-c6xx), `minimatch`, `glob`, more `undici`.

Most come in through the mounted layers' dependencies (shared with the groups reviewing those layers), so the fix is mainly a bump in the layer that declares each one, then a lockfile refresh here. Find the owner of each with `bun why <pkg>`.

**Fix:** bump `zod` to ≥ 4.6.6 in dth-hrh; bump `undici` (via its parent) everywhere; refresh `bun.lock` in who-iris and dth-hrh.

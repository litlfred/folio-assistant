---
# folio-assistant-wox6
$schema: bean/1.0.0
title: 'Dependency advisories: happy-dom critical, node-forge, zod, undici'
status: completed
type: bug
priority: high
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:01:56Z
updated_at: 2026-11-01T22:10:00Z
parent: folio-assistant-sb31
---

Found by the 2026-10-31 security and QA review of the folio-assistant layers (SOP: cat-harness `skills/conduct/security/`, the 16 rules of `skills/voices/secure-code-authoring/voice.json`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`). No fix PR yet: fixes wait for the owner's go-ahead.

**Category:** security · **Severity:** major

Rule `scz-review-dependency-changes`. `bun audit` on 2026-10-31.

**folio-assistant lockfile** (`4bffe8d`): 49 advisories (1 critical, 17 high).
**folio-assistant-sci lockfile** (`f0d44d9`): 32 advisories (1 critical, 10 high).

- **happy-dom 15.11.7** (critical GHSA-37j7-fg3j-429f, VM context escape to code execution; plus 3 high incl. SSRF when parsing untrusted HTML). Pinned exactly in folio-assistant-sci `package.json` devDependencies (`@happy-dom/global-registrator 15.11.7`). Dev/test only, but tests parse rendered content. Fixed in >= 20.14.7.
- **node-forge <= 1.4.0** (6 high incl. X.509 basicConstraints bypass and RSA signature verification flaws), folio-assistant lockfile, via the fhir-harness expo chain.
- **zod < 4.6.6** (high GHSA-mrhx-c7xc-m3w5, memory exhaustion on oversized collections), every layer pins `zod ^4.6.5`, resolved to 4.6.5; also zod 3.25.76 via expo.
- **undici 5.29.0** via jsonld (6 high incl. TLS validation bypass GHSA-2m5v-pch6-74hx). The core-side copy is bean folio-core-0b88.
- **body-parser / @fastify/busboy / qs** via `@modelcontextprotocol/sdk` > express: high DoS.

Run `bun run cat check:dependency-advisories` (warn-only today) after bumping.

## Done when

- [x] happy-dom >= 20.14.7 in sci
- [x] zod >= 4.6.6 resolved in every layer
- [x] No high advisory left without a recorded reason

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

## Progress 2026-10-31

sci part fixed in litlfred/folio-assistant-sci#156 (merge `0729230`): happy-dom 21.0.4, zod ^4.6.7; sci audit 32 to 27 (0 critical). Still open: node-forge and zod 3 via the fhir-harness expo chain, undici 5.29 via jsonld, express-chain advisories via @modelcontextprotocol/sdk.

_2026-10-31T08:24:00Z_ — `@happy-dom/global-registrator` `21.0.4` and `zod` `^4.6.7` merged in https://github.com/litlfred/folio-assistant-sci/pull/156 (`0729230`) and https://github.com/litlfred/folio-assistant/pull/2828 (`68fc69cca`); PRs open with full `overrides` (`node-forge`, `body-parser`, `@fastify/busboy`, `qs`, `fast-uri`, `undici`, `zod`) reducing `bun audit` high/critical advisories to 0 in both repos: https://github.com/litlfred/folio-assistant-sci/pull/158 and https://github.com/litlfred/folio-assistant/pull/2829.

_2026-11-01T22:10:00Z_ — Completed: litlfred/folio-assistant#2829 merged (`cbd4361`) with `overrides` for node-forge, body-parser, @fastify/busboy, qs, fast-uri, undici and zod. `bun audit` on the merged tree: 7 advisories, 0 critical, 0 high (5 moderate, 2 low). Re-check 2026-11-01: core 2 (0 high), tools 3 (0 high). MVP security review, session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS

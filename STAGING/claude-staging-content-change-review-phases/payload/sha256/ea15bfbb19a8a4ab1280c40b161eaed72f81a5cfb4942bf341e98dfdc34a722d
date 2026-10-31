---
# folio-assistant-hgxs
$schema: bean/1.0.0
title: 'smart-immunizations package-lock.json: 27 advisories (1 critical tar, 14 high) via the npm dependency'
status: in-progress
type: bug
priority: high
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:15:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** major (advisory) · **rule:** scz-review-dependency-changes

**Where:** litlfred/smart-immunizations `package.json` (dependencies `fsh-sushi ^3.16.5` and `npm ^11.5.2`) and its `package-lock.json`, from `npm audit --package-lock-only` on 2026-10-31.

**Evidence:** critical `tar <=7.5.20` (hardlink path traversal, arbitrary file overwrite); high: axios, brace-expansion, fast-uri, form-data, glob, ip-address, libnpmdiff, libnpmpublish, lodash, minimatch, npm, pacote, picomatch, sigstore. Most arrive through `npm` itself being listed as a runtime dependency. `tools/node/package-lock.json` is clean (0).

The repo also declares bun workspaces (bunfig.toml), so it is unclear whether this lock is still the one installs read. If it is stale, deleting it is the fix.

## Done when
- [x] `npm` dropped as a dependency (or the lock regenerated) and `npm audit` reports no critical or high, or the stale lock is removed

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T08:25Z_ — Fixed in https://github.com/litlfred/smart-immunizations/pull/105 (dropped `npm` from `package.json` `dependencies`, added `overrides` for transitive advisories, and regenerated `package-lock.json`; `npm audit --package-lock-only` now reports 0 vulnerabilities).

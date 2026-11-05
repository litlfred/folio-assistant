---
# folio-assistant-9ml4
$schema: bean/1.0.0
title: 'Cache-first CI: one cached-step primitive, derived keys, trust classes, budget, hit-rate report'
status: in-progress
type: feature
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T13:19:32Z
updated_at: 2026-11-05T13:19:32Z
parent: folio-assistant-k3vv
---

Every CI step is a pure function of its inputs. The primitive is `.github/actions/cached-step` (litlfred/folio-assistant#2972).

- **Trust classes:**
  - (a) entries that can be verified exactly: committers may publish them with `cache:publish`, and CI only verifies them;
  - (b) verdicts, which go through #2957 and #2958;
  - (c) main-only entries.
- **Daily report:** the hit-rate and budget report runs in `sweeps.yml`.
- **Determinism audit:** builds each producer twice and diffs the bytes.

## Still to do
- cat-harness-tools `cache-key.ts` and the cat-harness skill `cache-first-ci`. The patches are ready but need repository access.
- Port `bundle-cache.sh`, the prepared image, the layers ref and the cone onto the primitive, each by its owner.
- File a bean for each non-deterministic writer the audit lists.

## Done when
- [ ] every bespoke cache is on cached-step
- [ ] the daily report shows a hit rate per step
- [ ] the cache stays under 80 % of 10 GB

_2026-11-05T13:19:32Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for CI speed 14 (cache-first CI), session https://claude.ai/code/session_01VQDpPeMVBfa2srZmpTnGfi, which holds the claim.

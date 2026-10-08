---
# folio-assistant-iai8
title: 'Separation stage 4: seed litlfred/cat-harness and litlfred/cat-harness-tools, one commit each, no history'
status: completed
type: task
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-08T18:18:00Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-70lx
    - folio-assistant-8lcl
    - folio-assistant-y9r6
    - folio-assistant-vj2p
    - folio-assistant-smbc
---

Stage 4 of the split plan: seed both repositories, one commit each, **no history** (owner ruling 2026-09-30 for bootstrap, applied here: "I dont want all the clutter in git history"; the commit message names the folio-assistant source SHA).

- both: remove `livesAt`; add `LICENSE`, `NOTICE`, `LICENSE-CONTENT.md`; version `0.1.0`
- cat-harness-tools only: standalone `tsconfig.json`, `.gitignore`, `bun.lock` from its own `package.json`; CI described but disabled; AGENTS.md lanes verified from the directory

Blocked on stages 1a–1d (the content must be code-free and self-contained) and on stage 3 (the owner's go). This also discharges `w2gr`'s "pushed to litlfred/cat-harness-tools".

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [x] litlfred/cat-harness and litlfred/cat-harness-tools each hold exactly one commit whose message names the source SHA
- [x] licence files present in both; `livesAt` absent

## Landed evidence
- **`litlfred/cat-harness`**: Seeded with single clean commit `6e8a3f85b7dc562a64a8732ecbb5d4ae09e8fae1` referencing source SHA `6db07109cf24`.
  - `livesAt` removed from `cat-harness.json`.
  - Added `LICENSE`, `NOTICE`, `LICENSE-CONTENT.md`.
  - Added `index.config.json` with trust consents and ignore blocks.
- **`litlfred/cat-harness-tools`**: Seeded with single clean commit `cf670c6a1ebb826aa299cc2f092d51c99a13f7f5` referencing source SHA `6db07109cf24`.
  - `livesAt` removed from `cat-harness-tools.json`.
  - Added standalone `tsconfig.json`, `.gitignore`, `bun.lock`.
  - Added `LICENSE`, `NOTICE`, `LICENSE-CONTENT.md`.
  - Added `index.config.json` with trust consents.
- **Deposited to `fsh-guts/separated/`** on `cat/cat-harness/fsh-guts`:
  - `cat-harness-tools.tar.gz` + `cat-harness-tools.md` at `74c0e9d3a1b3`.
  - `cat-harness.tar.gz` (96.5 MB, multithreaded xz below GitHub 100MB limit) + `cat-harness.md` at `c40db671ec33`.
- **Cutover PR #2517 merged to main**:
  - `cat-harness/` and `cat-harness-tools/` separated and removed from `main`.
  - `index.config.json` remote-mounted and locked in `index.lock.json`.
  - Verified: `mount:lock --check: 10 instance(s) — OK`.


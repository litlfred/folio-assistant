---
# folio-assistant-1ple
$schema: bean/1.0.0
title: 'state:mount follows an ABSOLUTE marker path out of its own checkout: a copied checkout re-mounts (and can empty) the original'
status: completed
type: bug
priority: high
created_at: 2026-10-14T13:19:55Z
updated_at: 2026-10-16T07:48:00Z
parent: folio-assistant-fs43
---

Found 2026-10-14 (session_01XueePufkpx8fwJxavyDS5h; owner chose "C1: track it as a bean").

## What happened
A scratch copy of an index checkout (`cp -a /home/user/folio-assistant <scratch>/S`) carried the original's `.git/branch-mounts/*.json` markers. Each marker's `into` is an ABSOLUTE path (`/home/user/folio-assistant/beans`, `…/todos`, `…/fsh-guts`, `…/issue-marks`). `bun run cat state:mount` run inside the COPY acted on the ORIGINAL's directories and then rewrote the marker to point at the copy. The original's `beans/defs/` lost all 1801 files locally; todos, fsh-guts and issue-marks were emptied too. Timestamps matched to the second (defs changed 11:00:37.25–.54 UTC; the copy's `beans.json` rewritten at 11:00:37.62).

Afterwards `state:mount` in the original reported **"1801 unpushed change(s) left untouched; push them with `bun run cat state:push`"**. Following that advice would have pushed 1801 deletions and emptied `cat/cat-harness/beans` for everyone. Nothing was pushed; the mounts were restored from the branch tips.

## Two defects
1. **The marker's `into` is absolute and trusted.** A mount marker must be checkout-relative (or `state:mount`/`state:push` must refuse an `into` outside the repository root they run in).
2. **"unpushed changes" counts deletions of the whole graph as work to push.** A mount whose working copy has lost (nearly) every file is far more likely damaged than edited. `state:mount` should say so, and `state:push` should refuse a push that deletes more than a threshold of the tip's files without an explicit flag.

## Done when
- [x] markers store a checkout-relative `into`; a marker whose `into` resolves outside the repo root is refused (test: `cp -a` a checkout, run `state:mount` in the copy, the original is byte-identical afterwards)
- [x] `state:push` refuses a mass deletion (e.g. >50% of the tip's files) without `--allow-mass-delete`, and `state:mount` reports such a mount as "damaged?", not as unpushed work
- [x] existing absolute markers are migrated or re-written on next mount

## Closed 2026-10-16
- Merged in `litlfred/cat-harness-tools#389` (`00b2fabcdf113d25a9d46097fc91614f054871ff`):
  - `branch-mount.ts`: stores checkout-relative `into` paths in `.git/branch-mounts/*.json`, resolves existing relative or in-repo legacy absolute markers against `repo`, refuses any `into` that resolves outside `repo` (ignoring a copied marker that points at another checkout and replacing it with this checkout's own marker on mount), and rewrites legacy absolute markers to relative on `current` / `remounted` / `mounted`.
  - `state-mount.ts` & `state-push.ts`: detects mass deletions (`deleted > 0 && deleted * 2 > tipCount`), reporting `damaged? N of M tip file(s) missing locally — restore with bun run cat state:mount --force, or pass --allow-mass-delete to state:push` in `state:mount` instead of `unpushed work`, and refusing in `state:push` unless `--allow-mass-delete` is passed.
  - Tested in `scripts/tests/branch-mount.test.ts` (`cp -a` checkout test verifying original is byte-identical) and `scripts/tests/state-mount.test.ts` (mass-delete refusal and `--allow-mass-delete` override).

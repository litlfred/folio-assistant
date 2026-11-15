---
# folio-assistant-j3ls
$schema: bean/1.0.0
title: 'MOUNTED ROOT: harness tools run from a remote-mounted cat-harness take the MOUNT as their root, not the instance being worked on'
status: completed
type: bug
priority: high
created_at: 2026-10-09T18:20:00Z
updated_at: 2026-10-20T15:05:15Z
parent: folio-assistant-iirv
---

Measured 2026-10-09 working who-iris's beans from who-iris's OWN repository
(cat-harness, core, tools remote-mounted inside it per `index.lock.json`).
Every script below computes "this instance" as `import.meta.dir/..` (or
`instanceRootFor(import.meta.dir)`), which in a separated instance's checkout is
the MOUNT — somebody else's tree at a pin — not the instance being worked on.
The split plan's blocker 3 (≈204 such sites) names the cause for the tools/harness
split; this is the same cause seen from the other side, and it is live today.

| tool | what went wrong from who-iris's checkout | state |
|---|---|---|
| `ensure-landing-sticky` | wrote cards into gitignored mounts; never declared who-iris's folio | **fixed** (instance-dir argument; bean `1yd7`) |
| `ingest-document` | "this repository declares 3 libraries: library, ../folio-assistant-core/library, ../library" — who-iris's own library is `../library`, relative to the mount | worked around with `--library ../library` |
| `gen-library-jsonld` (run by `ingest --promote`) | `INSTANCE_ROOT = import.meta.dir/../..`; folio-assistant-core's contributions never register, so `typesForKind` drops every block's `@type` (`folio-assistant-core:Prose`, `doco:Section`) and the core namespace — **promoted output is a regression**, not committed | open |
| `skill-register` | reads `package.json` from the instance's PARENT and runs `bun run cat <step>` — neither exists in a separated repository (no `cat` runner anywhere; package scripts spell `cat-harness/scripts/...`) | open (70lx carries the package scripts) |
| `ingest-document` staging | writes `ingest-staging/` inside the mounted cat-harness | harmless, wrong place |

## Done when
- [ ] one resolver — the instance being worked on is the CHECKOUT's root
      instance (or an explicit argument), never the script's own location —
      used by every tool above; mounted layers are read as dependencies of it
- [ ] the closure's contributions (kinds, block types) are registered from the
      instance's `needs`, so `ingest --promote` from who-iris's repo writes the
      same JSON-LD as the aggregate checkout did (diff = 0 on the three entries)
- [ ] a test that runs each tool from a fixture checkout whose harness is a mount

## 2026-10-11 — the @type regression was bzwk, not the root (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)
- Measured on who-iris main.
  - With folio-assistant-sci unmounted, `gen-library-jsonld --check` is stale, and output has no `@type` and no core namespace.
  - With sci mounted, all 813 nodes are up to date (diff = 0 against the committed JSON-LD).
- `typesForKind` reads the discovered block kinds. Core's kinds need sci's `paper` adapter (bean bzwk), so nothing is discovered without it.
- who-iris#43 (merged, 6b50625) mounts sci at 5bc2c90.
- So done-when 2 holds for who-iris, through the mount rather than through `needs`. The real fix is still bzwk.
- New finding: the generator names the instance after the checkout DIRECTORY (`…/jsonld/<dir>/…` in every derivedFrom). In a clone not named `who-iris`, all 813 nodes change. That is the same resolver defect as done-when 1.

_2026-10-20T15:05:15Z_ — Claimed by claude/amazing-einstein-2v47a4 — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).
- New finding: the generator names the instance after the checkout DIRECTORY (`…/jsonld/<dir>/…` in every derivedFrom). In a clone not named `who-iris`, all 813 nodes change. That is the same resolver defect as done-when 1.

## 2026-10-20 — fix in review (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

litlfred/cat-harness-tools#463: `resolveWorkingInstanceRoot` in `scripts/lib/roots.ts` (flag → env → the checkout the harness is mounted in → harness); skill-register and ingest-document use it; fixture test with a mounted harness. Close when it merges.

## Summary of Changes

Merged 2026-10-20 as litlfred/cat-harness-tools#463 (4f33b67), on the owner's "merge green PRs, keep draining". `scripts/lib/roots.ts` gained `resolveWorkingInstanceRoot` (`--instance` → `$CAT_INSTANCE_ROOT` → the checkout the harness is MOUNTED in, when it declares an instance → the harness) and `runnerRootFor`; skill-register's instance root and `bun run cat` cwd, and ingest-document's default instance, use them. `roots.test.ts` covers a mounted harness and the three layouts that keep the harness. Index, harness-repo and standalone-tools behaviour unchanged. The `needs`-driven contribution registration stays with bean `bzwk`. The index re-pin of cat-harness-tools is not part of this bean.

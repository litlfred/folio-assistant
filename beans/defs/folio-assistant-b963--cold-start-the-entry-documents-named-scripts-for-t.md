---
# folio-assistant-b963
title: 'COLD START: the entry documents named scripts/ for the whole split, and nothing checks a command path'
status: in-progress
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T19:30:00Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`AGENTS.md` line 3 (the cold-start line every agent runs first), lines 192 and 351, `README.md` lines 4 and 371, and `cat-harness/docs/guides/agent-onboarding.md` lines 96–97 named `scripts/install-beans.sh`, `scripts/beans-fallback.ts`, `scripts/gen-schema-docs.ts` and `scripts/gen-skill-docs.ts`. There is no root `scripts/`; all four live under `cat-harness/scripts/` since the split. `bash scripts/install-beans.sh` fails with "No such file or directory", so a fresh container following the first instruction it reads gets no work-plan CLI. Nine occurrences, repointed on branch `claude/sharp-fermi-xvs06i`.

## The gap
`check:agents-claims` reads LOCATION claims of the shape `symbol` in `module.ts` and ABSENCE claims; `check:agent-entry-links` reads links. Neither reads a **command line**, so a path inside a fenced command can rot silently. AGENTS.md itself records the same defect for the two generator commands "until 2026-09-20" — it was fixed in one file and not in the other two.

## Done when
- [ ] A check reads every fenced command in the entry documents (AGENTS.md, README.md, the onboarding guide) and fails when a path in it does not resolve
- [ ] The nine occurrences are confirmed repointed on main

---

_2026-09-20T19:30Z_ — **Done-when 1 landed** (PR #589, issue #588).
`bun run check:command-paths` reads every fenced command in the entry documents
and every skill, and fails when a repository-relative path in one does not
resolve. Wired into `code-quality-gates.yml`.

**The nine were not all of them.** Sweeping with the check found **seven more**,
every one in text a link checker structurally cannot see:

| where | was |
|---|---|
| `session-start-coord-sweep.sh` ×4 | `scripts/install-beans.sh`, `scripts/beans-fallback.ts`, `scripts/harness-dirs.ts` — printed for an agent to copy, in the file every session runs first |
| `AGENTS.md` §Commands ×2 | `bun run src/index.ts --http`, `bun run src/index.ts --check-deps` |
| `README.md` | `bun run src/index.ts --stdio` |
| `agent-onboarding.md` ×2 | `scripts/session-start-coord-sweep.sh`, `bun run src/index.ts --check-deps` |

That is this bean's own argument, measured: *"it was fixed in one file and not
in the other two, because nothing swept."*

**Two corpora, different verdicts, and the distinction is the design.** An
entry document is about THIS repository by definition, so every
repository-relative path in it must resolve. A skill may be about a FOLIO —
`bun run content/pipeline/qa-sweep.ts` is correct in a folio and unresolvable
in a platform that carries no content, which is this repository's first banner.
So in a skill a path is judged only when it CLAIMS to be about this tree: its
first segment is a directory that exists at the root, or it is a bare
root-level markdown document (the `z9eb` case). The rest is **counted** as
folio-relative — 150 of them — rather than passing silently.

Exemptions carry a required reason (`<!-- command-path-ok: … -->`) and are
counted, same shape as `declared-path-literal:`. Four exist, all real: a probe
whose answer IS whether the directory is there, and three blocks that run
inside a folio.

**The falsifier was run.** Reintroducing `scripts/install-beans.sh` into
AGENTS.md line 353 fails the check with exit 1; removing it passes. 18 unit
tests, each one a false positive the first draft produced over this corpus.

- [x] A check reads every fenced command in the entry documents (AGENTS.md, README.md, the onboarding guide) and fails when a path in it does not resolve
- [ ] The nine occurrences are confirmed repointed on main — #579 is not merged yet

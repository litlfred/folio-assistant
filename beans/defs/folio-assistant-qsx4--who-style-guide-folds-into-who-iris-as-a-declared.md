---
# folio-assistant-qsx4
title: who-style-guide folds INTO who-iris as a declared subgraph, docs included
status: completed
type: task
priority: normal
created_at: 2026-10-01T00:02:14Z
updated_at: 2026-10-04T18:29:58Z
parent: folio-assistant-kupb
---

Owner ruling 2026-09-30, verbatim: "who voices style guide is derivative KG content from who-iris, merge content into subgraph. including docs." Issue #476.

Supersedes the separate-instance arrangement of `w095` (and the "own repo/dir" half of the 2026-09-20 decision recorded in `kupb`/`r1lz`). The `z7ev` cross-instance citation was the price of the split; with the voices and the library they are read from in ONE instance, every citation should become a same-instance one, and the boundary-crossing should disappear rather than be worked around.

Stacked on `claude/magical-archimedes-4qkfxp-who-iris-code` (draft PR #1728, bean `eayu`) so the two moves do not collide.

## Done when
- who-style-guide's content lives under `who-iris/` by `git mv` (history preserved), declared in `who-iris/who-iris.json` with graph kinds.
- The `who-style-guide` instance declaration is retired; no live reference to it remains outside history and beans.
- `check:voices`, `check:voice-skills`, `check:glossary`, `kg:audit:check` and `bun run gates` green.

_2026-10-01_ — ## Done on branch `claude/magical-archimedes-4qkfxp-who-style-into-iris` (stacked on #1728)

Layout, split BY GRAPH KIND into who-iris's existing conventions (directory-conventions; where-does-this-go row 6), all by `git mv` in a pure-rename commit:
- `who-style-guide/skills/voices/` + `skills/skills.json` -> `who-iris/skills/voices/` + `who-iris/skills/skills.json` (`voices` declared from within, bean cmsl — the same shape as agent-skills, folio-assistant-core, folio-assistant-sci, smart-base)
- `who-style-guide/glossary/` -> `who-iris/glossary/` (declared in who-iris.json as the conventional `glossary` id); `who-style-guide.glossary.json` -> `who-iris.glossary.json`; terms now minted in who-iris's namespace; the five locales' `.po`/`.pot` renamed to `who-iris--who-terms`
- `who-style-guide/README.md` -> `who-iris/docs/style-guide.md`; `AGENTS.md` -> `who-iris/docs/style-guide-agents.md` (the docs subgraph). AGENTS.md was first put beside the voices and had to move: any non-README `.md` in a skills tree is read as a skill, and `gen-skill-docs` demanded a category for a package called `voices`.
- the three voices' kg-qa sidecars -> `who-iris/test/results/kg-qa/skills/voices/`

z7ev's cross-instance citation is no longer used by these voices: `sources[].instance` removed from all three, and all 41 rules resolve bare against who-iris (`check:voices` green).

## NOT done — needs a person (deletion-requires-confirmation)
Three GENERATED files of the retired instance are left at `who-style-guide/test/results/` (README.md subgraph readme, kg-qa.manifest.json byte-identical to who-iris's, kg-qa/scenarios/kg.kg-qa.json — an audit of an instance that no longer exists). Nothing regenerates or moves them, and removing them is a deletion, so they are left for the owner. Until then `check:undeclared-files:check` and the two "this repository, as it stands" tests are red over exactly these 7 KB.

## Owner ruling 2026-10-01 late (recorded on `ga6u` in #1806; appended here as asked)

The who-iris prose that still described the retired `dependents` field is **reworded in this PR's merge of main**, consistent with Q-B's Q1 (REWORD). Done in the 2026-10-02 merge: the themes entry's comment (key renamed `_inheritance_comment`), the docs entry's `_comment` and the `qa` description now describe the current mechanism — the graph kind's `perInstance` setting and nested subgraphs declared with `"subgraph": true`. The same wording in other declarations stays out of scope.


## Holder 2026-10-02 22:40Z
Driven by https://claude.ai/code/session_01SmeBn6QZsDFaNQ4GtuC2sd (Parcel B, epic 7x5n): merging main into #1735 per the PR's merge plan, regenerating, gates, then ready.


## Closed on evidence, 2026-10-04 (bean-coordination §"Closing a bean whose work has already landed")

Its work merged in PR #1735 on 2026-10-03; the holder note of 2026-10-02 named that PR, so this is landed work, not mid-flight. Each Done-when re-derived on `main` @ `d174883`, not quoted:
- **content under `who-iris/` by `git mv`, declared in `who-iris.json`.** `git ls-tree origin/main` holds `who-iris/skills/voices/who-{editorial,guideline-development,publication-design}/`, `who-iris/glossary/who-iris.glossary.json`, `who-iris/docs/style-guide.md` and `style-guide-agents.md`; `who-iris.json` declares `who-iris-skills`, `glossary` and `who-iris-docs`.
- **instance retired, no live reference left.** 0 files under `who-style-guide/` on main; the remaining mentions outside beans are history comments plus one `.gitignore` guard for the old generated residue.
- **gates green.** `check:voices`, `check:voice-skills`, `check:glossary`, `kg:audit:check` and `check:undeclared-files:check` each exit 0 on `main`. The "NOT done — needs a person" residue (three generated files under `who-style-guide/test/results/`) is gone with the directory.

Session: https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi

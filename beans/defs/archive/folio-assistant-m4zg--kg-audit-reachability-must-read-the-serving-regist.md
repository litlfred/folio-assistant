---
# folio-assistant-m4zg
title: 'KG audit: reachability must read the serving registry — and skills/content-lifecycle is unservable'
status: completed
type: bug
priority: normal
created_at: 2026-09-18T19:42:20Z
updated_at: 2026-09-18T20:12:22Z
---


## Summary of Changes

Merged in #277 as `e25e10fc5`.

**The brief was "fix the 6 unreachable skills". Four were not skills.**
`.claude/skills/requirements/*.json` are Requirement objects — `id: "req:…"`,
SHALL statements, `satisfiedBy` pointing **at** a skill — and reading them as
skills is the same category error `actors/` and `capabilities/` had. The other
two, `corpus-grep` and `language-trap-agent-audit`, were always reachable; the
check read package manifests and never asked what could **serve** a skill.

**What that weakness was hiding:** `skills/content-lifecycle/` was absent from
`LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` while **52** `<folio:skill ref>`
activities named its eight skills. `workflow_next` handed an agent
`content-validate`; `skill_fetch` answered "package not found". Every step of
every content-lifecycle process. The table is now exported so `kg-audit` reads
it instead of holding a second copy.

**Closed every remaining dangling join in the graph:**

| join | criterion | severity |
|---|---|---|
| activity → servable package | `skill-servable` | major |
| manifest → skill (instance + remote pkgs) | `manifest-skill-exists` | critical |
| requirement → skill / capability | `requirement-satisfied-by-resolves` | critical |
| requirement → actor | `requirement-actors-resolve` | critical |
| requirement → requirement | `requirement-derived-from-resolves` | critical |
| statement carries a grade | `requirement-statements-graded` | major |
| actor → capability | `actor-capabilities-resolve` | major |

**Requirements moved to `skills/requirements/`** — KG content does not live in a
Claude-Code-only directory. NOT folded into the skills that satisfy them: the
grading, the `derivedFrom` lattice, the actor binding and the many-to-many
`satisfiedBy` are the only machine-checkable things a requirement has.

**Four real breakages found and fixed, not recorded:** `req:agent-workflow`
never existed though three requirements derived from it (written, reconstructed
strictly from what those three already assert); `capability:role-detection`
never existed (repointed at `role-model` — capabilities here are environment
probes, and role detection is the actor registry read against session identity);
`fhir-validator` was a genuinely missing probe (declared); and the
`agent-harness.json` `kg` summary had been silently reverted by `8e429d83d`,
which rewrote the whole entry so the merge took its version with no conflict.

**Two near-misses worth carrying forward — both caught by measuring first.**
`manifest-skill-exists` written naively demanded deleting three CORRECT
`authoring-math` entries supplied by `skills/remote-packages/`.
`actor-capabilities-resolve` written naively demanded writing 19 fake
environment probes for what are really permissions and skills in an overloaded
field. In both cases the naive check would have produced a wall of wrong fixes.

**Bean `nup0` corrected in its own body** — its "19 manifest entries name skills
that don't exist" was measured against each package's own folder; against the
instance the count is 0. **Four beans un-stranded** from `beans/` root into the
`defs` node, where the CLI can see them.

Audit on merged main: 245 pass / 15 fail / 45 n/a / **0 unknown**, no critical.
Remaining is 27 `skill-servable` (a content gap) and 27
`actor-capabilities-resolve` (bean `ind9`).

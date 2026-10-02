---
# folio-assistant-eu38
title: 'TOOL 2/13: Task_Formalize — Lean formalisation (33 files, 16 entry points)'
status: completed
type: task
priority: high
created_at: 2026-09-20T04:34:12Z
updated_at: 2026-09-20T07:41:19Z
parent: folio-assistant-d308
---

Group 2 of 13 in `d308`. **33 files, 16 entry points.**

`lean-*` (audit, build-all, build-bg, build-timed, cache-dump,
closure-orchestrator, compile-audit, coverage, witness), `lake-cache*`,
`setup-lean-toolchain`, `setup-elan-symlinks`, `reseed-lean-cache`,
`install-lean-atlas`, `extract-lean-blocks`, `lean_auto_discharge`,
`lean-triviality-probe`, `trivial-skeleton-audit`,
`check-self-discharging-instances`.

**BPMN:** `authoring-a-paper · Task_Formalize`, `serviceTask`, refs
`lean-formalization` — and the diagram refs `proof-verification` on the same
step, so this group may satisfy two skills.

**Target repo (#223):** `folio-asst-sci`.

**Caution, recorded before the work rather than after it:** 16 entry points
spanning build, cache, audit and probe is not one command with modes. This is the
group most likely to be a small FAMILY of Tools, and forcing it into one node
would produce exactly the invoke-a-string-and-hope node the schema refuses
elsewhere.

## Done when
- [ ] Tool node(s) covering build, cache and audit as distinct concerns if they are
- [ ] `satisfies` includes `lean-formalization`; `proof-verification` if it holds
- [ ] `requires.runtime` names `lean` / `elan` honestly
- [ ] `tool-coverage` reflects it

---

## 2026-09-20: three of four, and the caution on this bean was right

The inventory bore out what this bean warned about before the work. **Four
concerns, not one command**, and all eight candidate skills exist and are
uncovered:

| concern | scripts | skill |
|---|---|---|
| toolchain | `setup-lean-toolchain`, `setup-elan-symlinks`, `install-lean-atlas`, `lib/lean-env.sh` | `lean-environment-setup` ✅ |
| build | `lean-build-all`, `-bg`, `-timed`, `lean-closure-orchestrator` | `lean-build-fix` ✅ |
| cache | `lake-cache`, `lake-cache-fetch{,-multi}`, `lake-cache-produce`, `lean-cache-dump`, `reseed-lean-cache` | `lean-cache-restore` ✅ |
| audit | `lean-coverage` → completeness; `lean-audit` → vacuity | `lean-completeness-audit` ✅, `lean-proof-vacuity-audit` ✅, `proof-verification` — **see below** |

Three nodes: `lean-build`, `lean-cache`, `lean-toolchain-setup`. Coverage went 29
→ 32 skills with a Tool.

### One correction to this bean's own premise

It said these groups have "zero files this repo can run". **Wrong:** Lean has 16
**mode-755** entry points — executables in the repo. What is absent is a Lean
toolchain, which is what `requires.runtime` exists to state. The group was more
verifiable than the bean claimed.

### `check:tools` refused two edges, and both readings were plausible

- **`lean-formalization`** requires `sourceFile` and `targetModule`, because it
  formalises A CLAIM into A MODULE. Building the workspace is not that.
- **`proof-verification`** requires `projectRoot`. The script *discovers* the root
  — it is invocable from any directory and builds from the repo root so
  cross-package deps resolve against the root manifest — so declaring a
  `projectRoot` input would have made the node **lie about its interface to
  satisfy a check.**

`lean-build-fix` is the honest one, and not merely because it has no contract:
it says it works by "parsing lake build output", so a Tool producing that output
is one concrete way to exercise it. It is the build half of that skill's loop.

That is the second time today the contract check has caught a plausible edge —
`bpmn-render → bpmn-authoring` was the first. It is the most valuable gate here,
because it stops `satisfies` becoming decorative without relying on my discipline.

### What was verified, and what was not

**Contract, not mechanism.** No Lean toolchain is installed here and the platform
carries no folio, so what passed is: `satisfies` resolves and agrees with each
skill's contract, every io type is declared, every argv input is injection-safe,
3191 tests, 46 gates. **The falsifier this unit set — "if `tools:coverage` still
reports these skills uncovered, the node is decorative and I revert" — came back
clean: none of the three appears in the uncovered tiers.**

Exercising them needs a folio. `requires.runtime` says so, which is the posture
`h588` set for FHIR and which is the general case for six of thirteen groups.

### A type was added, guarded

`LakeCacheAction` — `lake-cache.sh` is subcommand-shaped and `check:tools` refuses
free text on a positional. Read from the script's own usage block rather than
guessed, which is why `contribute` and `doctor` are members: a list of the four
obvious verbs would have refused two real ones and looked complete doing it.

---

## The audit half: two nodes, and one skill that cannot be satisfied

`lean-coverage` counts what is proved; `lean-audit` asks whether a proof says
anything. Siblings, not alternatives — a sorry-free proof can still be vacuous,
which is precisely why both exist.

### `proof-verification` has a contract and NO mechanism

Not an omission. Its contract requires **`projectRoot`**, and nothing in this
corpus accepts one. The only root-shaped flag anywhere in the Lean scripts is
`--content-root`, which names where content BLOCKS live — not the Lean package.
Typing that as `projectRoot` would be exactly the lie `lean-build` already refused
to tell, one node earlier in the same file.

So this is the inverse of `covered-is-not-reachable`'s third case: there, a
mechanism with no skill. Here, **a skill with an I/O contract and no mechanism
that can meet it.** Closing it needs a Tool that takes a Lean project root, which
does not exist yet — a gap in the corpus, not in the graph.

### The near-miss worth recording

Both scripts **exit 1 in the platform repo, by design**:

> No paper found under …/cat-harness/content. folio-assistant is the PLATFORM;
> papers live in a folio. Run this from the content repo, or name a paper
> explicitly.

That is the script refusing rather than reporting a silent empty result, and it is
the behaviour to want. **I nearly discarded both nodes as broken on that reading**
— off a pipeline's exit code (`echo`'s 0) rather than the script's (1). Two
mistakes in one step: trusting a composed exit status, and reading a correct
refusal as a failure.

It is now written on the nodes, because the next agent who runs these here will
see an error and reach the same wrong conclusion.

### `eu38` is done

Three of four concerns noded plus the audit pair — five nodes: `lean-build`,
`lean-cache`, `lean-toolchain-setup`, `lean-coverage`, `lean-audit`. Coverage went
29 → 34 skills with a Tool across this bean. `proof-verification` stays open as a
corpus gap with its reason recorded above, not as unfinished work here.

---
# folio-assistant-zmdo
title: 'SPLIT: bootstrap agentic-harness + folio-assist-core as forks, then prove an empty-repo bootstrap'
status: in-progress
type: task
priority: normal
tags:
    - mvp
created_at: 2026-09-18T17:24:16Z
updated_at: 2026-10-04T12:12:34Z
parent: folio-assistant-vke6
blocked_by:
    - folio-assistant-mer2
---

## The ask

Owner, in chat 2026-09-18, verbatim intent:

> when we get to an MVP for agent-harness and folio-assist-core, create
> the two repo as forks of folio-asst. then delete/modify the new repos
> until we get to a state we can test under a new/empty repo "bootstrap a
> litlfred/folio-assistant here"

So: **fork twice, subtract, then prove the result bootstraps from nothing.**

## Why fork-and-subtract rather than build-up

Forking keeps history for every file that moves, which matters here more
than usual: the partition work (#223, #244, PR #251) has been classifying
modules as harness vs core for weeks, and a fresh repo would discard the
provenance of each decision. Subtracting from a fork means every deletion is
a reviewable diff against a known-good state, and `git log --follow` still
answers "why is this file shaped this way".

## The gate that makes this real

The end state is not "two repos exist". It is:

> a new, empty repository can say **"bootstrap a litlfred/folio-assistant
> here"** and get a working instance.

That is an executable acceptance test, and it should be written as one —
the same discipline as `scripts/tests/profile-scoping.test.ts` building its
own repositories rather than reaching into the ambient checkout. A bootstrap
that only works in a checkout that already has the platform is not a
bootstrap.

## Sequencing — blocked, and on what

**Blocked on MVP** of both layers. Do not start the forks before then: a
fork taken mid-partition inherits the unfinished classification and the
subtraction has to be redone.

Depends on:
- **#223** — separation of concerns (the parent)
- **PR #251** — `AgentHarness` / `agent-harness.json`, which defines what an
  instance declares and inherits. Its own "Not verified" section says the
  target layout (`tools/`, `kg/`, `folio/`) is declared by the schema but
  **not yet inhabited by any repo** — this bean is where it first is.
- `x4mt` — cross-agent skill installation. A bootstrap that cannot install
  skills into the host agent is not finished.
- `x3h9` — gettext + accessibility must be settled as harness-core concerns
  before the split hardens, or they land on the wrong side.

## Known hazards, from this repo's own history

- **`folio_init` is registered among the GENERIC tools, deliberately** —
  it runs before a folio has a content type, and a bare repo falls back to
  the paper adapter. Whatever bootstraps the new repos has the same
  constraint: it cannot live behind an adapter it is supposed to create.
- **The builder shim** exists so the path to folio-assistant is written down
  once. A two-repo split doubles the number of paths that could be written
  down more than once — check this before, not after.
- **"Could not determine" is a third state.** A bootstrap that cannot tell
  whether it is in a harness, a core or a folio must say so, not guess.

## Not yet established

Nothing here is measured. MVP is not defined for either layer, no fork has
been taken, and the acceptance test does not exist. This bean is the
placeholder that keeps the sequencing visible; it is not a plan yet.


## UNBLOCKED CONDITION 2026-09-30 — MVP is now defined, so this block is computable

`tndo` recorded that this bean was blocked on a term nothing defined, which made
`bean-blocking`'s expiry rule unsatisfiable. The owner ruled it:

> **MVP = `folio_init` creates a working folio against that layer ALONE, in an
> empty repository.**

So the block is no longer "wait for a judgement" but a condition a check can
evaluate, per layer:

- [ ] `bun run init-folio` against that layer alone, no sibling instance on
      disk, exits 0 in an empty repo
- [ ] the scaffolded folio's declared graphs all resolve — no declared-but-absent
      directory (`dh4f`)
- [ ] that folio's gate set passes in the fresh repository
- [ ] the layer's `needs:` closure is satisfied by what is present

**Still blocked, and correctly so** — the condition is defined, not met. What
changed is that "not met" is now measurable rather than asserted.

**First thing to measure, and it may be a finding rather than a wait:** whether
`folio_init` can target a single layer at all today. If it cannot, that is a
defect against `folio_init` — not a reason to weaken the definition.

Full comparison of the four candidate definitions, and why the other three were
rejected, is on `tndo`.

## MEASURED 2026-09-30 — the first thing this bean said to measure. It is a FINDING.

The section above named it: *"whether `folio_init` can target a single layer at
all today. If it cannot, that is a defect against `folio_init` — not a reason
to weaken the definition."* Measured, and it cannot.

### `folio_init` has no layer argument

From `cat-harness/scripts/init-folio.ts` — `InitFolioOptions` and `parseArgs`,
read on `claude/cool-fermi-htir5p`:

| | |
|---|---|
| CLI flags accepted | **11** |
| of those naming a layer | **0** |

`--dir --type --slug --title --author --link --assistant --force --dry-run
--skip-vcs --help`. `--assistant` is the near miss and is not one: its own
docblock reads *"Path to the folio-assistant checkout"* — the **whole stack**.
`instanceRoot` is `resolve(import.meta.dir, "..")`, hardcoded to the platform
checkout the script lives in.

So **none of the four checkboxes above can be run today**, for either layer.
Not "fails" — *not expressible*. The first box says "against that layer alone",
and there is no way to say that.

### For `agentic-harness` the condition is currently UNSATISFIABLE, not just unimplemented

`BUILTIN_ADAPTERS` (`cat-harness/src/builtin-adapters.ts`) already carries a
`layer` per adapter — so a layer notion exists, as a **label describing where a
module lives**, never as an input. Both rows sit *above* `cat-harness`:

| contentType | module | layer |
|---|---|---|
| `paper` | `../folio-assistant-sci/adapters/paper/index.ts` | `sci` |
| `document` | `../folio-assistant-core/adapters/document/index.ts` | `core` |

**Zero adapters at the `agentic-harness` layer.** A folio needs a content type
and every content type's adapter lives higher, so "a working folio against
agentic-harness ALONE" has nothing to scaffold. For `folio-assist-core` the
`document` adapter is in the right place, so that half becomes reachable the
moment the flag exists — which is the useful half of this finding: the two
layers are **not** symmetrically blocked, and the core fork can go first.

### The probe must assert the content type, or it scores a pass on the wrong folio

When the asked adapter is unavailable the resolver does not fail — it falls back
to another content type with a warning: *"contentType X declares the Y adapter,
which is unavailable … using Z instead — tools specific to Y are NOT
registered"*. A probe reading only "did `init-folio` exit 0 and write files"
would therefore report the first checkbox **met** while holding a folio of a
content type nobody asked for.

That is bean `1xhc` — a gate that does not fire looks like one that passed —
reached through a fallback rather than a skipped step. Checkbox 1 is amended
below to assert what it got.

### `x3bd` already carries the same test, one layer down

`x3bd` records: *"THE TEST OF BOOTSTRAP IS FALSIFIABLE: a checkout with ONLY
`bootstrap/` and `cat-harness.json` must let an agent claim a bean, read the
conventions and run `folio_init`. If it cannot, the list is wrong. Worth a CI
job."* That is the owner's MVP definition applied to `bootstrap/` — same shape,
same tool, written down eleven days earlier and independently. Whatever
single-layer switch `folio_init` grows should serve both, and neither should
grow its own.

### Condition, restated on the measurement

- [ ] **`folio_init` accepts a layer** and scaffolds against it alone — the
      prerequisite none of the boxes below can be evaluated without. Blocked on
      nothing; it is ordinary work.
- [ ] `bun run init-folio` against that layer alone, no sibling instance on
      disk, exits 0 in an empty repo **and the folio it wrote carries the
      content type that was asked for** — asserted, not inferred from exit 0
- [ ] the scaffolded folio's declared graphs all resolve — no
      declared-but-absent directory (`dh4f`)
- [ ] that folio's gate set passes in the fresh repository
- [ ] the layer's `needs:` closure is satisfied by what is present

**`core` before `agentic-harness`**, on the adapter measurement above: core's
content type is already in core, and the harness layer has no content type at
all until something is decided about that. Recorded, not decided — which
content type a bare harness should scaffold, if any, is a scope call.

## RESTATED 2026-10-04 — the forks already exist; the proof runs in throwaway repos

Owner, 2026-10-04 (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi): *"https://github.com/litlfred/folio-assistant-core exists — why do we need agentic-harness? isnt that just cat-harness?"*

Both points hold, checked against the store and GitHub that day:

- **`agentic-harness` IS `cat-harness`.** It is the partition's pre-rename name (`4wzf`: agent-harness → cat-harness; `yx9p`: `REPOS` target reconciled to `cat-harness`). Likewise `folio-assist-core` is `folio-assistant-core`.
- **The repositories already exist:** `litlfred/cat-harness` (last push 2026-09-29), `litlfred/cat-harness-tools`, `litlfred/folio-assistant-core` (2026-10-01), plus `bootstrap`, `bootstrap-tools`, `folio-assistant-sci`. They were created as plain repos, not forks, so the "fork to keep history" argument above no longer decides anything. **No repository is to be created by this bean.**

**What remains is the falsifier.** Choice made from three options: run it in the existing throwaway repos **`litlfred/cat-harness-test`** and **`litlfred/folio-test`** — instance-init (bean `mer2`) against `cat-harness` alone, and against `folio-assistant-core` alone, then evaluate the four per-layer conditions in `tndo`. The real layer repositories are not touched by the proof. Rejected: temp directories only (never exercises a real clone); reading the layer repos first (deferred, not needed to run the proof).

Still blocked on `mer2` (PR #2073) merging.

_2026-10-04T12:12:34Z_ — Claimed by claude/dazzling-sagan-xifirf — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## MEASURED 2026-10-04 — first rehearsal, each layer alone (local sibling layout)

Method: the TRACKED files of the layer and its `needs` closure copied into `platform/` as siblings (no aggregate declaration), the root `package.json`/`tsconfig.json`/`bunfig.toml` beside them, `node_modules` linked — the same layout `seed:ready --rehearse` uses. A fresh `git init` repository `probe/` beside it, then `init-folio --instance --link sibling --assistant ../platform` (and, for core, `--type document`).

| condition (`tndo`) | `cat-harness` (+ bootstrap, bootstrap-tools) | `folio-assistant-core` (+ cat-harness, cat-harness-tools, bootstrap, bootstrap-tools) |
|---|---|---|
| 1. init exits 0 in an empty repo | ✅ instance, 15 files | ✅ instance; ✅ document folio, renders to Markdown |
| 2. declared graphs resolve | ✅ declaration loads, every declared directory exists | ✅ |
| 3. working — conventions readable, next step runnable | ❌ **MCP server refuses to start**: *"no built-in content adapter is installed … A server with no adapter can serve no content, so it does not start."* `beans list` ✅, session hook path ✅, skills ✅ (after the fix below) | ✅ MCP serves **45 tools**; `beans list` ✅; skills ✅ |
| 4. `needs` closure satisfied by what is present | ✅ after the fix below — chain `bootstrap ← bootstrap-tools ← cat-harness ← (root)` | ✅ — `… ← cat-harness-tools ← folio-assistant-core ← (root)` for the folio |

### Found and fixed on this branch — a scaffold did not say what it stands on

Before the fix, BOTH scaffolds produced a config with no `dependencies`, so the new instance's declaration chain was **itself alone: 0 skill directories reachable** — for a contentless instance and for a document folio alike. That is every folio `folio_init` has scaffolded, not only the MVP probe. Hand-adding ONE `dependencies.folioAssistant` entry made the whole stack resolve, because the layers' own `needs` carry the rest. The scaffold now writes that entry, derived rather than asked for: a folio stands on its adapter's instance (`BUILTIN_ADAPTERS[].instance`), a contentless instance on `cat-harness`.

### Open — needs the owner

**`cat-harness` alone cannot start its MCP server**, by design of `resolveBuiltinAdapter`. Every adapter lives above the harness, so condition 3 cannot pass for that layer until the server is allowed to start with the generic tools only (`folio_init`, `skill_list`, `workflow_*`, …), or the MVP for that layer is restated without the server.

### Not yet run

- The real empty-repo run in `litlfred/cat-harness-test` / `litlfred/folio-test` (ruled 2026-10-04) — after the open question, since condition 3 would fail there for the same reason.
- `seed:ready --rehearse` (the layer's own test suite standalone; `ho66` measured 472 failing for `cat-harness`) — that is the layer's health, a separate question from whether a NEW instance can stand on it.

## RULED + DONE 2026-10-04 — the server serves what the KG declares

Owner, choosing from three options: **start with the generic tools** when no adapter is installed. Then, on seeing the first shape (a hand-written `registerGenericTools` list): *"isn't it just presence in the KG?"* — and chose, from three options, **the server reads the Tool nodes**.

Checked first: every in-process harness tool was ALREADY a Tool node in `cat-harness/tools/` (module + MCP name), and `ToolInvoke.inProcess.register` already existed for this purpose. The same fact was restated by hand twice — `SERVER_TOOL_GROUPS` in `server.ts` and the "generic tools" inline in `folio-assistant-core`'s document adapter — and the second copy was why `cat-harness` alone could not start: no adapter, no generic tools, refusal.

Now: `toolGroupsFromNodes(tools())` derives the server's groups; a module with no single `register…` export is REPORTED as failed. The document adapter registers content tools only; `NoContentAdapter` (harness) registers none. `registerSkillPrompts` stays a direct server call, because prompts are not Tool nodes (`j6t3`).

Measured:
- Aggregate checkout, `main` vs this branch: **identical** tool set (45) and prompts (44).
- `cat-harness` alone: MCP serves **23 tools** (was: refused to start). With that, all four `tndo` conditions hold locally for BOTH layers.
- `tool-groups.test.ts`: each module registers exactly the MCP names its Tool nodes declare — so a tool can be neither declared-and-unserved nor served-and-undeclared.

Next: the real empty-repo run in `litlfred/cat-harness-test` / `litlfred/folio-test`.

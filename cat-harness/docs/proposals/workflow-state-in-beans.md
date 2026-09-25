---
title: "Workflow state in beans"
kind: proposal
movedOn: 2026-09-19
movedFrom: "docs/folio-assistant/proposals/workflow-state-in-beans.md"
issue: 232
summary: >-
  Decided 2026-09-18: Option A, two stores with one link, both moved out from behind dotfiles.
---

# Options for executing DMN/BPMN with beans as state
{: .no_toc }

Asked on [#232](https://github.com/litlfred/folio-assistant/issues/232), and
bearing directly on [#203](https://github.com/litlfred/folio-assistant/issues/203)
(CRDM), whose requirements cycle is a long-running, multi-session, multi-actor
process — exactly the case where "where did that get to?" is expensive to answer
wrongly.

It sets out four options and what each costs. **§0 records the decision**: Option
A, with both stores moved out from behind dotfiles. Options B–D are kept because
they remain the honest alternatives if the question is reopened, and because the
reasoning for rejecting them is the part that goes missing otherwise.

1. TOC
{:toc}

---

## 0. Decided — Option A, co-located (2026-09-18)

The author chose **Option A**: two stores, one link. What changed is not the
architecture but the *address* — both stores are now at top level and adjacent:

| | was | is |
|---|---|---|
| work plan | `.beans/` | **`beans/`** |
| workflow state | `.harness/workflow/` | **`beans/workflow/`** |

The reasoning that made A right survives the move intact: the interpreter keeps
a file no human is invited to hand-edit, one file per instance means no write
contention, and the process engine still runs in a repo with no beans CLI
installed. What A was *criticised* for below — "two places to look" — was never
really about two stores. It was about two **hidden** stores. Putting them side
by side under one visible directory answers that without giving machine state to
a human-editable file.

Both paths are now declared in `harness.config.json` under `harness`
(`HarnessDirsSchema`), and `bun run check:harness-dirs` fails if that
declaration, `.beans.yml` and `workflow/store.ts` ever disagree.

The rest of this page is kept as written, because options B–D remain the honest
alternatives if the question is reopened — in particular for CRDM, per §5.

## 1. What exists today

Two stores, joined at one point.

| store | holds | committed |
|---|---|---|
| `beans/<id>--<slug>.md` | **what is being worked on** — title, status, type, body | yes |
| `beans/workflow/<id>.json` | **where it got to** — token marking, arrivals at joins, history | yes |

`src/workflow/store.ts` keeps one file per instance, deliberately, so two agents
advancing two instances do not collide on one file. Instance ids are derived
from the subject rather than random, so re-running a step for the same block
finds the instance that exists instead of minting a second one.

`src/workflow/bean-link.ts` is the join. Eleven activities across the diagrams
carry `<cat-harness.processes:bean op="claim|note|resolve"/>`, and completing such a step **is**
the work-plan operation rather than a note about it. `resolve` is the careful
one: a bean completes only when the instance it tracks has itself completed,
because `AGENTS.md` is explicit that whether work is done is a judgement and not
the caller's to assert. A still-running instance gets a note.

So the question is not "should beans know about workflow" — it already does. The
question is whether the **token marking** should live there too.

## 2. Why anyone would want it there

Four reasons, and they are not equally good.

1. **One place to look.** A human opening `beans tui` sees the plan; the position
   in the process is in a second directory they have to know about. Two answers
   to "what is happening" is one too many.
2. **The bean is already the unit of coordination.** Claiming is how sibling
   sessions avoid each other. If position were bean state, claiming a step and
   claiming the work would be the same act.
3. **Beans have a UI.** `beans tui`, `beans roadmap`, `beans show`, and a
   GraphQL endpoint. `beans/workflow/*.json` has none of that and would have to
   grow one.
4. **Fewer things to keep in sync.** Today a divergence between the two stores is
   possible in principle; with one store it is not expressible.

And the honest counterweight, before the options: **a token marking is not a
todo.** It is machine state with an invariant — the interpreter must be able to
say what is enabled *now*, and it must refuse a step that is not. Storing it in a
human-editable Markdown file with a free-text body means a person can put it in a
state the interpreter cannot read. That is not hypothetical; it is the ordinary
consequence of a file people are invited to edit.

## 3. The options

### Option A — two stores, one link *(built)*

Instance JSON for position; a bean for the work; `cat-harness.processes:bean` operations to keep
them agreeing at the eleven points where it matters.

**Costs:** two places to look. A human has to be told the second exists.
**Buys:** the interpreter owns a file no human is invited to edit by hand. One
file per instance means no write contention. `beans` is optional — the process
engine runs in a repo with no beans CLI installed.

### Option B — bean per instance, position in front matter

The instance's token marking moves into the bean's YAML front matter
(`workflow_process`, `workflow_tokens`, `workflow_history`); `beans/workflow/`
disappears.

**Costs:** the front matter becomes machine-owned, and `beans update` is not
aware of it — an unknown-key write, or a hand edit, can corrupt a marking. Every
`workflow_complete` is now a read-modify-write of a file a human may have open in
the TUI. And the engine acquires a hard dependency on the beans layout.
**Buys:** genuinely one place. `beans show <id>` answers both questions.
**Verdict:** the attractive option, and the one whose failure mode is worst — a
malformed marking is not visible until an agent is refused a step it should
have been allowed.

### Option C — child bean per enabled activity

The instance is a **milestone** bean; each activity the process reaches is
created as a child `task` bean, and its status *is* the token: `todo` = enabled,
`in-progress` = claimed, `completed` = the token has moved on. Position is
derived by folding the children.

**Costs:** bean volume. Six diagrams with 8–15 activities each means a process
run is a dozen beans, and `beans create` is not idempotent — the mechanism that
produced **14,688** duplicates in the `qou` folio in one afternoon is exactly a
loop that creates without checking. Parallel forks and joins do not map onto
child status cleanly: a join waiting on two of three siblings has no status that
says so. And a human closing a child bean out of sympathy would advance the
process.
**Buys:** the plan and the process become one artefact, visible in `beans tui`
and `beans roadmap` with no new UI. Claiming a step and claiming the work are
one act, which is reason 2 above, fully delivered.
**Verdict:** best fit for a **long, human-paced, mostly-sequential** process —
which is what CRDM's six phases are. Worst fit for the short mechanical ones.

### Option D — beans as an event log, state as a fold

Nothing stores a marking. Each `cat-harness.processes:bean op="note"` appends a structured line
to the bean body; the current position is recomputed by replaying the notes
through the process model.

**Costs:** every `workflow_next` is a replay, and a note a human edits or
reorders changes history rather than correcting it. Debugging "why is this step
not enabled" means reading a log rather than a state.
**Buys:** it is the option with no synchronisation problem *at all*, because
there is no second copy of anything. Complete provenance for free — the
`resolve` invariant becomes a property of the fold rather than a check in code.
And it is the only option under which a corrupted state is impossible, since
there is no state.
**Verdict:** the theoretically cleanest, and the one that asks most of the
implementation. Worth it only if provenance becomes a first-class requirement —
which, for CRDM sign-off, it might.

## 4. Comparison

| | A (built) | B front matter | C child beans | D event log |
|---|---|---|---|---|
| one place to look | ✗ | ✓ | ✓ | ✓ |
| human can corrupt the marking | ✗ | ✓ | ✓ | partly |
| parallel fork / join | ✓ | ✓ | ✗ | ✓ |
| write contention between agents | none | per bean | per child | append-only |
| works without the beans CLI | ✓ | ✗ | ✗ | ✗ |
| existing UI (`tui`, `roadmap`) | ✗ | ✓ | ✓ | ✓ |
| duplicate-creation risk | none | none | **high** | none |
| implementation cost from here | — | low | medium | high |

## 5. What this suggests

Not a single answer, because the processes are not one kind of thing:

- **Keep A for the mechanical processes.** `editing-hci-validation`,
  `draft-to-publication` and `content-lifecycle` are strict, short-lived and
  machine-driven. Their state is not something a person should be able to edit,
  and none of B–D improves on a file the interpreter owns.
- **Consider C for CRDM specifically.** Six phases, weeks apart, several human
  actors, and stakeholder sign-off — the case where a person needs to see the
  position *in the tool they already have open*, and where the sequential shape
  means the fork/join objection does not bite. The duplicate risk is real and
  mitigable by the existing derived-id discipline: `instanceId()` already
  derives an id from the subject rather than minting one, and a child bean would
  have to do the same.
- **Treat D as the destination if provenance becomes a requirement**, not as a
  refactor to do for tidiness.
- **Whatever is chosen, the reporting gap is worth closing on its own.**
  `work_plan_prime` already reports every instance's position next to its bean;
  surfacing that in the session-start sweep beside `beans roadmap` gives most of
  reason 1's benefit without moving any state at all. That is cheap, and it is
  the thing to do first.

## 6. What would decide it

Stated so this does not stay an opinion:

1. **Does a human ever need to see the process position without an agent?** If
   yes, A is insufficient and the argument for C or D is made.
2. **Does any long-running process need a real parallel fork?** If CRDM does,
   C is out for CRDM too.
3. **Is a corrupted marking recoverable?** Under B it means hand-repairing YAML.
   Under C a deleted child bean loses a token with no record that it existed.
   Under A and D the interpreter can always recompute. This is the question that
   should carry the most weight, and it is the one easiest to skip.

## See also

- [Publication workflow](../publication-workflow.html) — every process in the repo,
  and how `workflow_start` / `workflow_next` / `workflow_complete` run them
- [Getting started](../getting-started.html) — a computed gateway in use
- [Accessibility](../accessibility.html) §3 — DMN-driven question sets, the same
  machinery pointed at an interview
- [#203 — business requirements gathering (CRDM)](https://github.com/litlfred/folio-assistant/issues/203)

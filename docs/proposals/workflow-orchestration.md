# Proposal — making agentic workflow execution deterministic

**Status:** phase 1 landed · DMN gateways landed (§6) · phases 2–3 proposed
**Beans:** `fq0b` (interpreter), `sx4z` (DMN), `dv3w` / `bcnl` (open)

Agent workflows in this project are ad hoc. Skills are documents an agent
fetches with `skill_fetch` and is *trusted* to follow; beans record what
happened; the six BPMN diagrams under `docs/workflows/` describe what should
happen. Nothing connects them. An agent that skips the HCI validation gate is
not doing anything the system can detect, let alone refuse.

This proposal argues for a small BPMN interpreter behind MCP tools, and then
for the part that actually buys determinism: **gating the existing capability
tools on process state.** Phase 1 is built, so the numbers below are measured
rather than estimated.

---

## 1. What exists today

| Layer | Mechanism | Binding? |
|---|---|---|
| Capability | ~25 MCP tools — `lean_build`, `qa_sweep`, `content_validate`, `paper_render_pdf`, … | Callable in any order, at any time |
| Instruction | `skill_fetch` serves a skill's prose | Advisory |
| Work plan | `.beans/`, `work_plan_prime` | Advisory; records, does not gate |
| Process | `docs/workflows/*.bpmn` | Inert — nothing read them at runtime |

The tool surface is a **flat menu**. The process model is a **picture**. The
gap between them is where "we hope the agent follows the skill" lives.

One asset worth naming: the diagrams are in better shape than they look. All
20 `folio:skill ref` values resolve to real skills, and 93% of activities carry
one. The diagrams are already a valid index into the skill registry — they were
simply never read.

---

## 2. What phase 1 measured

Built and landed: `src/workflow/process-model.ts`, `instance.ts`, `store.ts`,
`src/tools/workflow.ts`, plus `scripts/tests/workflow-interpreter.test.ts`.

**Cost.** 547 non-comment lines. `bpmn-moddle` — the parser bpmn.io itself uses
— was already vendored as a transitive dependency of the `bpmn-js` we render
SVGs with; it is now a direct one. No new service, no broker, no second
datastore.

```
                            activities  gateways  lanes  w/ skill  bean  parse
authoring-a-paper                    9         2      6         9     1    32ms
content-lifecycle                    8         1      6         8     2    15ms
draft-to-publication                11         5      7        11     3    17ms
editing-hci-validation              14         6      7        10     3    12ms
l2-dak-authoring                    10         4      5        10     1    12ms
l3-fhir-pipeline                     8         2      5         8     1    11ms

60 activities · 56 carry a skill ref (93%) · 11 touch the work plan
10 real decision points · 3 call activities · 20 distinct skills
```

**Every diagram is sound.** Checked in both directions: no node is unreachable
from a start event, and no node is unable to reach an end event. The four
activities without a skill ref are exactly the ones that should not have one —
`Describe the intended change`, `Review the findings` (both human),
`Collate findings into a report` (pipeline plumbing) and
`Commit into the corpus` (governed by the `commit-hygiene` requirement).

**The gate holds.** Seventeen tests, run against the real `.bpmn` files rather
than fixtures. The one that matters:

```
workflow_complete { node: "Task_Commit" }
  → Task_Commit is not enabled in instance editing--def-carbon-valence.
    Enabled now: Task_DescribeChange.
```

There is no token on `Commit into the corpus` until the editor's decision has
been recorded, so it cannot be *reported* done before the HCI gate. Also
pinned: both validation branches must report before the join fires; `discard`
terminates without ever enabling the commit; `revise` re-enables the mechanical
checks rather than letting a second round skip them.

---

## 3. Why not a workflow engine

**Camunda 8 / Zeebe, Flowable, Activiti.** A JVM, a broker, and a second
datastore, for a repo whose entire runtime is `bun run src/index.ts`. The
[RAG ingestion proposal](rag-document-ingestion.html) already rejected RAGFlow
on this exact argument — a 16 GB minimum against a 2 vCPU / 4 GB host — and the
reasoning transfers without modification.

**The npm `bpmn-engine`.** Proportionate, pure JS, reads BPMN 2.0 directly. The
real objection is a fit one: it is built to *execute* service tasks. Here the
executor is an LLM that may take an hour over one activity and be interrupted
halfway, so you drive it through external tasks and signals — which is most of
the 547 lines you would otherwise have written, plus a dependency whose
semantics you now have to match rather than choose.

**What was actually needed** is small because BPMN is large and this repo uses
nine element types of it. The interpreter implements those nine and **throws on
anything else**, naming what it found. That refusal is deliberate: skipping an
unrecognised element yields a process that runs, reports progress, and is
silently not the process on the diagram. This repo has that failure on file
twice — a hand-written kind list that hid ~13% of a corpus from every QA tool,
and a walk that quietly dropped 27,390 words of prose.

---

## 4. The decision this proposal actually asks for

Phase 1 is **advisory**. An agent can ignore `workflow_next` entirely and call
`content_validate` directly, and nothing stops it.

That should worry us, because this repo has the failure recorded: bean `5rfy`,
*"29 of 32 workflows never fire on their own"*. An MCP tool an agent is
*supposed* to call is the same shape as a CI workflow nobody dispatches. Being
well-designed does not make it fire.

**Determinism comes from gating the capability tools, not from adding an
advisory one.** The difference between a map and a rail is whether the tool
that writes to the corpus refuses when the process says that step is not
enabled. Concretely, in phase 3:

- a capability tool declares which activity it satisfies;
- when an instance is open for the subject, the tool checks the token before
  acting, and refuses with the same message `workflow_complete` gives;
- completing the tool call advances the process, so the agent cannot both do
  the work and forget to record it.

**This is the part worth arguing before code exists**, because it has real
costs:

- **It can block legitimate work.** A one-line typo fix does not want a
  seven-step process. Either trivial edits get an escape hatch — and then the
  hatch is the new default — or they do not, and the gate becomes something
  people route around by not starting an instance at all.
- **Coverage is the whole game.** Gating one tool while fifteen others stay
  open buys the *appearance* of a gate. Gating all of them is a large change to
  a surface other repos depend on.
- **It needs an activity → tool mapping that does not drift.** `folio:skill`
  points at skill *documents*, not at MCP tools. That mapping is the real work,
  and the obvious place for it is the same extension element, with a
  `render:bpmn:check`-style validator that every ref resolves. Cheap, and it is
  the failure mode this repo keeps rediscovering.

A middle option worth considering instead of tool-level gating: **gate at the
commit boundary**. A pre-commit hook or CI check that refuses a corpus write
whose block has no instance recording that the findings were surfaced. Fewer
places to change, it bites where it matters, and it cannot be forgotten by an
agent because it is not the agent that runs it.

---

## 5. Phase 2 — beans and instances must not become two truths

`.beans/` answers "what is being worked on"; an instance answers "where did it
get to". Those must be one answer or they will diverge, and a work plan that
disagrees with itself is worse than one that is merely coarse.

The hooks already exist: `workflow_start` takes a `bean`, and 11 activities
carry `<folio:bean/>` marking where the plan is touched. What phase 2 adds is
the loop closing — completing a bean-marked activity updates the bean, and
`work_plan_prime` reports instance position alongside bean status.

Instance state lives in `.folio/workflow/<id>.json`, **committed**, for the
reason `.beans/` is: the container is ephemeral, and a work plan only one agent
can see is not a work plan. Instance ids are derived from the subject rather
than random, so re-entering a step finds the instance that exists — the
`beans create` non-idempotency that produced 14,688 duplicates in one afternoon
is not a mistake worth repeating.

The trade-off to accept openly: this is churn in the diff, on every step. Beans
already carry that cost and the repo tolerates it.

---

## 6. DMN — the genuinely deterministic part

The interpreter surfaces a **decision** when it reaches an exclusive gateway
with no outcome supplied, rather than guessing. Ten such points exist across
the six diagrams, and they are not all the same kind of question:

| Gateway | Inputs | Status |
|---|---|---|
| `Build green, no sorries?` | `lean_build`, `proof_status` | **Table shipped** |
| `Draft QA green?` | `qa_sweep` totals | **Table shipped** |
| `QC clean?` | IG Publisher QC | Mechanical, but no tool exists yet |
| `FHIR valid?` | validator output | Mechanical, but no tool exists yet |
| `Judgement call?` | is this clinical/scientific? | No — routing judgement |
| `Accept, revise or discard?` | the findings | No — the editor's call |
| `Approved?` | the draft as a whole | No — the review team's call |
| `Clinically accurate?` | ground truth | No — SME's call |

**Two corrections to an earlier draft of this section, both found by building
it.** It named `lean_status` as the source for the Lean gate; `lean_status`
checks whether the *toolchain* is installed, and the sorry counts come from
`proof_status` (`proof-axis-dashboard --json`). And it claimed four tables were
available: only two are. `QC clean?` and `FHIR valid?` are just as mechanical,
but this repo ships no WHO/FHIR adapter, so their input names would have been
invented — a table keyed to facts no tool emits is worse than no table, because
it looks authoritative. They land when the adapter does.

What shipped: a gateway carrying `<folio:decision ref="file.dmn#Decision_Id"/>`
has its outcome **computed**. The caller passes facts, the table returns the
branch, and `workflow_complete` **refuses a hand-supplied outcome** on such a
gateway — being able to assert the answer would defeat the mechanism. The rule
that fired is recorded in the instance history, so the audit trail says which
table decided and why.

Three things worth knowing about how the tables came out:

- **The Lean gate is not "no sorries".** `proof-axis-dashboard` separates a
  sorry standing in for an open conjecture — intentional — from a proof nobody
  closed. A gate counting both would block on the conjectures the paper is
  about, so the table reads `deferredSorries` only.
- **Authoring the table fixed the diagram.** The branch was labelled
  `sorries remain`, but a red build also routes there and is not a sorry.
  Renamed to `not yet`. The label was wrong before the table existed; making
  the decision explicit is what exposed it.
- **The draft QA gate deliberately ignores two totals.** `fail_minor` does not
  hold a draft, and `needs_agent` — criteria awaiting judgement — is the
  business of the non-mechanical review lane, not of a mechanical publication
  gate. Those are policy choices, and they now live in a table an editor can
  change without touching code, which is the argument for DMN in the first
  place.

A validator runs at process load: every outcome a table can return must name
one of the gateway's outgoing flows. A table that returns `"passed"` against a
gateway branching on `yes`/`no` parses fine and evaluates fine, and would fail
at the moment a decision is needed — the worst possible time to find out.

This remains the highest ratio of determinism to effort on offer, and it is
independent of the gating decision in §4.

---

## 7. What this does not buy

**Ordering is not quality.** A completed instance means the gates ran in order
and a person saw the findings. Whether the content is correct is what the QA
axes, the Lean build and the FHIR validator are for. A green process must never
be read as a reviewed paper, and any dashboard built on this should say so.

**Nor is it a substitute for the mechanical checks.** The process enforces that
`Build and QA gates` ran before the editor decided. It has no opinion on what
they found — that is the criterion's job, and the criterion's tests.

---

## 8. Recommendation

1. **Keep phase 1 as landed** — advisory, cheap, and immediately useful for
   orientation: `workflow_next` tells an agent what it may work on, which lane
   owns it, and which skill implements it, without anyone having read the
   diagram.
2. **Do phase 2 next** (beans ↔ instances). It is small, it removes a
   divergence risk that grows with use, and it does not require the §4
   decision.
3. ~~Do the DMN tables for the four mechanical gateways~~ — **done for the two
   whose tools exist** (§6). The remaining two wait on a WHO/FHIR adapter
   rather than on a decision.
4. **Decide §4 deliberately, and prefer the commit-boundary gate** to
   tool-by-tool gating. It bites where it matters, it is one place rather than
   twenty-five, and it is enforced by something other than an agent's
   intention to call it.

---

## See also

- [Publication workflow](../publication-workflow.html) — the six diagrams, their roles, and the skills each activity uses
- [Skills & roles](../skills.html) — the actor and capability model the lanes map onto
- [`rag-document-ingestion`](rag-document-ingestion.html) — the host-size argument reused in §3

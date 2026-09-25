---
title: "SDLC process audit"
kind: proposal
movedFrom: fsh-guts/proposals/
movedOn: 2026-09-23
issue: 363
bean: folio-assistant-haya
summary: >-
  Step 1 of bean haya: which of the 33 BPMN diagrams owns which phase of the software life cycle, and which phases nothing owns. Five phases are unowned and one is half-owned; the missing artefact has an exact template already in the repository.
---

# SDLC process audit — which diagram owns which phase
{: .no_toc }

Bean `folio-assistant-haya`, step 1, under
[#363](https://github.com/litlfred/folio-assistant/issues/363). The bean's
instruction is explicit: *"Audit which of the existing diagrams already cover a
phase of the SDLC, and where the seams are. **Do not draw over them.**"* This is
that audit. **Nothing is drawn here.**

1. TOC
{:toc}

---

## 0. Two corrections to the framing, before the table

Both were found by re-measuring rather than quoting, and both change what the
next step is.

**There are 33 BPMN files, not 31.** The count in
[deployment-topologies §5](deployment-topologies.html) was taken 2026-09-19 and
two diagrams landed after it. A count in prose is a claim; this one had already
decayed within the day. Re-measured with `ls processes/*.bpmn | wc -l`.

**MVP is already a subprocess, and it is `crdm-deliver.bpmn`.** The bean flagged
this as *probable* and said to check first. Checked: `crdm-deliver.bpmn`
carries activities bound to `prepare-merge`, `feature-staging` and
`delivery-summary`, an activity named *"Deploy the MVP to staging"*, and the
two acceptance gateways *"Meets criteria?"* and *"Accepted?"*. So the MVP
subprocess #363 asks for **exists**. Drawing a second one would have been the
exact failure the bean warned about, and the deliverable for that part of #363
is a *reference*, not a diagram.

---

## 1. The phase model this audits against

"Formal formal" needs a frame that is not invented here, or the audit grades
itself against its own vocabulary. The technical processes of
**ISO/IEC/IEEE 12207** are used below. The choice is not load-bearing — any
recognised life-cycle decomposition would expose the same holes — but it does
mean each row's name is defensible to somebody who has never read this
repository.

One scoping rule throughout: **the subject is a change to the *platform*.** A
diagram that covers the same phase for *content* does not own the platform row.
That distinction is the whole reason the holes below are holes: the repository
has drawn this lifecycle carefully, but for the folio rather than for itself.

---

## 2. The audit

`owned` — a diagram has activities for this phase, with bound skills.
`partial` — a diagram covers part of the phase and the remainder is undrawn.
`unowned` — no diagram covers it for the platform.

| # | 12207 technical process | owner | verdict |
|---|---|---|---|
| 1 | Stakeholder needs & requirements definition | `crdm-needs.bpmn` (Phase 1) | **owned** |
| 2 | System/software requirements definition | `crdm-requirements-definition.bpmn` (Phases 2–4), `crdm-signoff.bpmn` (Phase 5) | **owned** |
| 3 | Architecture definition & design | — | **partial** |
| 4 | Implementation | `crdm-deliver.bpmn` (Phase 6) | **partial** |
| 5 | Integration | — | **unowned** |
| 6 | Verification | — | **unowned** |
| 7 | Transition (deployment) | `crdm-deliver.bpmn` → `feature-staging` | **partial** |
| 8 | Validation (acceptance) | `crdm-deliver.bpmn`, `crdm-close.bpmn` | **owned** |
| 9 | Operation | — | **unowned** |
| 10 | Maintenance | `upstream-pin-watch.bpmn`, `upstream-version-adoption.bpmn` | **partial** |
| 11 | Disposal | — | **unowned** |

Cross-cutting, and owned: `bean-lifecycle.bpmn` (work planning),
`crdm-issue-linking.bpmn` (traceability), `activity-log.bpmn` (audit trail).

### Where each verdict comes from

**3 — design is `partial`, and deliberately so.** Design decisions here are
made in proposals: this directory holds five, each stating what would change
its mind. That is a real practice with a real artefact, and it is *not drawn*
— no activity anywhere says "write a proposal before building". The one
adjacent activity, `bpmn-authoring` in `crdm-requirements-definition.bpmn`,
models the *business* process under analysis, not the software's architecture.

**4 — implementation is `partial` because the inner loop is missing.** Phase 6
has one implementation activity and then moves to acceptance. Everything
between "start coding" and "it is merged" — branch, commit, open the PR at the
first commit, drive CI to green, answer review — is in `AGENTS.md`
§"Commit early, commit often, always PR", in `continual-progress`, in
`prepare-merge` and in `watch`. Those are the most frequently exercised rules
in the repository and they are the least formalised.

**5 and 6 are the sharpest holes, and §3 gives them a template.**

**7 — `feature-staging` is the only deployment target that is drawn.** There is
no activity for any other. This is the row that [deployment
topologies](deployment-topologies.html) directly bears on: its point is that
deployment activities *differ per topology*, so this row cannot be completed
until the axes are agreed. **This is a real ordering constraint, not a
preference** — `haya` is blocked behind `folio-assistant-g7vb` for row 7 only,
and for nothing else in this table.

**10 — maintenance is drawn for dependencies only.** The two `upstream-*`
diagrams cover *consuming* a version bump, thoroughly. Nothing covers
*producing* one: this platform has no drawn release, no version, no changelog
step. A folio pins the platform; the platform never cuts what is pinned.

**11 — `content-retire` exists, for content.** Nothing retires a platform
capability, a skill, a Tool node or a schema. Given the repository's rule that
[an agent never deletes a durable artefact on its own
initiative](../reference/skill-instructions/deletion-requires-confirmation.html),
an undrawn disposal phase is where that rule has no process to live in.

---

## 3. The strongest finding: the template already exists

`content-change-review.bpmn` has **22 activities** and models the change loop
end to end — `semantic-review-scoping`, `feature-staging` (four times),
`prepare-merge-auto`, `content-review`, `decision-audit`, `watch` (twice),
`content-publish`. Lanes: Content Author, Folio-Assistant Agent, Review
Committee, CI/CD Pipeline.

**There is no `code-change-review.bpmn`.**

That is the finding. The gap is not that the repository lacks the vocabulary,
the roles, the skills or the will to draw this — it has drawn precisely this
loop, at high fidelity, with a CI/CD lane, for *content*. Rows 5 and 6 above
are unowned not because integration and verification are unformalised concepts
here, but because the one diagram that formalises them takes a content change
as its subject.

So the second deliverable of `haya` is nearly scoped by inspection: the
platform sibling of that diagram, calling the subprocesses that already exist
(`prepare-merge`, `watch`, `review-code`, `upstream-version-adoption`) rather
than restating them. The skills it would bind are, with one exception, already
written — `continual-progress`, `prepare-merge`, `watch`, `ci-health`,
`code-node-review`, `bean-coordination`.

**The exception, and it is worth naming:** no skill covers *running the
platform's own gates*. The 13 commands a contributor runs before pushing
(`typecheck`, `lint`, `kg:audit:check`, `ns:check`, `check:harness-dirs`,
`check:workflow-refs`, `render:bpmn:check`, `avatars:css:check`,
`themes:css:check`, `gen:jsonld:check`, `check:schema-nodes`,
`check:declared-paths`, `check:bean-parents`) are enumerated in `package.json`
and in CI YAML, and nowhere that an agent is told to read. Verification being
`unowned` in the table above is not an abstraction: it is the reason an agent
discovers the gate list by grepping `package.json`.

---

## 4. A second finding the audit turned up on the way

**16 of the 33 diagrams declare no `<cat-harness.processes:policy enforcement>`.**
`process-model.ts:502` reads `declared === "advisory" ? "advisory" : "strict"`,
so each of those 16 is **strict by omission**.

The default is the safe direction, and this is not a bug report. But *every*
`crdm-*` diagram is in that set — the seven processes governing how a feature
reaches the codebase are strict because nobody wrote the attribute, not
because anybody decided they should be. The distinction matters the first time
somebody wants one of them advisory: there is no way to tell, from the file,
whether strictness was chosen.

Whatever `haya` draws should declare its own enforcement explicitly, and this
is a candidate bean of its own rather than scope for `haya`.

| declared | count |
|---|---|
| `strict`, explicitly | 6 |
| `advisory`, explicitly | 11 |
| `strict`, by omission | 16 |

---

## 5. What this audit does not settle

- **Whether the platform SDLC is one diagram or several.** `crdm-requirements.bpmn`
  is a parent calling six `crdm-*` children; the same shape may suit, or may
  be over-structure for a loop with fewer participants.
- **Whether row 7 waits.** Stated above as a constraint; it is the one place
  this audit asserts an ordering, and the one most likely to be wrong if the
  deployment activities turn out to be identical across topologies and to
  differ only in configuration.
- **Which of `AGENTS.md`'s prose rules move.** The
  [`AGENTS.md` migration survey](agents-md-migration.html) classifies all 19
  sections and found four subjects with no owning skill. Reconciling its list
  against row 4's inner loop is the alignment half of #363, and is not done
  here.

## 6. What would change my mind

1. **A phase I marked unowned turning out to be covered by a diagram I read as
   content-only.** The scoping rule in §1 does the most work in this audit and
   is the likeliest place it is wrong. If the CI/CD lane in
   `content-change-review.bpmn` is meant to be subject-agnostic, rows 5 and 6
   are `partial`, not `unowned`, and §3's finding weakens to "the existing
   diagram should be generalised" — a smaller and better outcome.
2. **Row 7 not actually depending on the axes.** If deployment activities are
   the same steps against a configured target, the ordering constraint
   dissolves and `haya` is unblocked entirely.
3. **The 12207 frame hiding a phase this project has that the standard does
   not name.** Content ingestion and the L1 completeness gate have five
   diagrams between them and fit no row above, because they are folio
   lifecycle rather than software lifecycle. If something similar exists on
   the platform side, the table has no row for it and would not show its
   absence.

---

## Related work

| item | what it holds |
|---|---|
| [#363](https://github.com/litlfred/folio-assistant/issues/363) | the request |
| `folio-assistant-haya` | this bean — step 1 of 4 |
| `folio-assistant-g7vb` | the axes row 7 waits on |
| [Deployment topologies](deployment-topologies.html) | §5 frames this audit; its count of 31 is superseded by 33 |
| [`AGENTS.md` migration](agents-md-migration.html) | which prose rules have a skill to move into |
| [`bpmn-processes`](../reference/skill-instructions/bpmn-processes.html) | how to author an activity, and the four steps no package may relax |

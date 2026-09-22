---
# folio-assistant-10s1
title: 'MATERIALIZED IS READ-ONLY: a copy of someone else''s artefact is not yours to edit — copy it into your own folio first, and that copy-out is step one of review'
status: todo
type: task
priority: normal
created_at: 2026-09-21T22:01:44Z
updated_at: 2026-09-22T06:55:01Z
parent: folio-assistant-p5wm
---

## What — owner, 2026-09-21, verbatim

> note:  if we have a mateiralized <stub>/<sub-graph>, the contents of it
> should be immutable (expect for publication worfklow purposes or so)... so if
> you browsw to it through whatever interface, it is functionally
> diabled/read only/greyed out.   you would need to copy/mateiralize it to
> your own folio/ in order to mess around with it.   docuemnt the full process
> and actors.  this is first/early step of review process, checking out local
> copy to edit,make comments/todos/stickies , etc on it.  these feed into the
> comment review pipeline.

## Why immutable — the reason is the catalogue's own claim

`MATERIALIZATION_STATES = ["unknown", "referenced", "materialized"]`
(`folio-assistant-core/schemas/materialization.ts`). A `materialized` node is a
**copy of somebody else's artefact**, held here because we fetched it.

Editing it in place forks the upstream **without saying so**. who-iris's
catalogue asserts *this is what IRIS holds* for 1,057,223 known files; the
moment one of the three materialized items is edited in place, that assertion
is false for that item and nothing in the graph records it. The state would
still read `materialized` — which is the failure this repository keeps naming
in other forms: a claim that survives the thing it described changing.

## TWO GREYS, and conflating them is the trap

`sjic` (#802) already renders a declared graph with no viewer as a non-link.
This bean introduces a SECOND reason an entry is not actable, and **they must
not look the same**:

| grey | means | what a person can do |
|---|---|---|
| **no viewer** | declared, nothing renders it — `harness-tiles`' "a gap, not a dead link" | nothing yet; a viewer is owed (bean `yunp`) |
| **read-only** | rendered and reachable, but NOT YOURS TO EDIT | **copy it into your own folio**, then edit the copy |

One says *"we have not built this"*; the other says *"this works, and the way
in is to take a copy."* Drawing both as the same dimmed row answers a person's
"why can't I click this?" with the wrong reason — and the second grey has an
ACTION behind it while the first does not.

## The exception is real and must be named

*"expect for publication worfklow purposes or so"*. The publication workflow
legitimately writes to materialized content — signing, versioning, stamping.
So immutability is not "nothing may write"; it is **"nothing may write except
a named step of a declared process"**, which is checkable in a way that "be
careful" is not.

## Copy-out IS step one of review

The owner's framing, and it is the part that makes this a PROCESS rather than
a permission bit:

1. a reviewer browses to a materialized sub-graph — read-only;
2. they **copy/materialize it into their own `folio/`** — that copy is theirs,
   mutable, and must carry provenance back to the original;
3. they annotate the copy: comments, todos, stickies;
4. those feed the **comment review pipeline** — `todo-review`, whose feedback
   lives under `feedback/<paper>/` and surfaces on the `/todos` dashboard,
   and then `content-review`'s phase gates.

So this is not a new pipeline. It is the missing FIRST STEP of the one that
exists, and the reason the existing one starts mid-air: `todo-review` triages
feedback on content, and never says how a reviewer came to have an editable
copy to leave feedback ON.

## Document the process and the actors — what that requires here

`role-model`: *"An actor performs a task in a process as a role, using that
role's skills."* All four objects are declared separately, so "document the
actors" means naming, not prose:

- which **role** may copy-out (any reader? a declared reviewer?);
- which **role** may write to materialized content under the publication
  exception, and in which **task** of which **process**;
- the **permission** that distinguishes them — permissions live on the ACTOR,
  not the role, because they cross-cut lanes;
- and the **process** itself as BPMN under `skills/workflows/`, because every
  process here is an executable diagram and a prose-only one would be the
  `vlhk` defect (a rule that reads as followed because nobody recorded an
  instance).

## Open questions — the owner's, not mine

- **Where does the copy go?** `folio/` in the reviewer's own instance, or a
  scratch area? This decides whether a copy is publishable by accident.
- **What carries provenance?** A copy with no link back to its original is
  indistinguishable from original work one rename later.
- **Is read-only enforced or advised?** The owner's standing posture on the
  neighbouring case was *"reminder now, gate later"* (`decision-request`,
  2026-09-20). The same question arises here and should be answered
  deliberately rather than inherited.

## Done when

- [ ] The two greys are visually and semantically distinct wherever a graph is
      listed, and the read-only one offers the copy-out
- [ ] The publication-workflow exception is a NAMED step in a declared
      process, not a carve-out in prose
- [ ] The copy-out process exists as BPMN with its lanes bound to roles, and a
      committed instance under `beans/workflows/` when it runs
- [ ] `todo-review` links BACK to this step, so the feedback pipeline no
      longer starts mid-air



---

## OWNER, 2026-09-22 — two corrections to the model

> Maternalized may have provenance/digital signature later that can be checked
> ... (see trusted data objects)
>
> Materialized assets not a flag true, but mid winter to asset in folio/ or
> elsewhere and a reference to the library/ original reference

Reading *"mid winter"* as **a pointer** — flagged because it is the one word
not clear from context; everything else below follows from the rest.

### 1. Fixity is the FLOOR, not the answer

`check:materialized-fixity` (#858) answers *"unchanged since we recorded it"*.
A **trusted data object** answers *"signed by whom, and verifiable against
their key"* — strictly stronger, and it survives the recorder being wrong or
dishonest, which a self-recorded digest does not.

**Measured: "trusted data object" appears NOWHERE in this checkout** — zero
hits across `.md`, `.ts` and `.json`. So it is a concept to bring in rather
than one already modelled, and nothing here should be written as though it
exists.

The order is right, though, and worth stating so the floor is not mistaken for
the ceiling: a digest is checkable today with no key infrastructure, and it is
what makes an edit-in-place detectable at all. A signature replaces the
*basis* of the claim without changing the shape of the check.

### 2. Materialized is a POINTER PAIR, not a flag

This is the substantive correction and it lands before the copy-out is built,
which is the useful moment for it.

Today `MaterializationSchema` carries:

| field | what it points at |
|---|---|
| `of` | the **remote** thing — a URI, upstream |
| `localPath` | where the bytes landed in **this** instance |
| — | **nothing for the local original** |

So a materialized asset is modelled as *a state plus where its bytes are*. The
owner's model is different: a materialized asset is

- **a pointer to the asset** — in `folio/`, or elsewhere; and
- **a reference to the `library/` original**.

**There is no field for the second, and that is the gap the copy-out needs.**
When a reviewer copies a materialized item into their own `folio/`, `of` still
points upstream, so the copy records where the bytes ultimately came FROM and
not which local original it was taken from. One rename later a copy is
indistinguishable from original work — which is this bean's own "what carries
provenance?" question, answered: not `of`.

### What this changes about the remaining work

- The copy-out edge is **local provenance** and needs its own field. It is not
  `of` with a different value: `of` means upstream, and overloading it would
  make "copied from IRIS" and "copied from our library" the same statement.
- `state: "materialized"` as an enum value stays useful as a CENSUS, but it is
  not what identifies the asset — the pointer pair is. A consumer asking
  "where is this and what is it a copy of" should not have to read a state to
  find out.
- Whatever field is added should be shaped so a **signature** can hang off it
  later without a second migration, since the owner has named that as coming.

NOT designed here. Recorded so the copy-out is built against this model rather
than against the flag, and so #858's fixity work is read as the floor it is.

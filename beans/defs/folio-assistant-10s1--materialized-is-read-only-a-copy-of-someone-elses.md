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

## The backfill's caveat lives in `verifiedAt`, and that is a correction

The first backfill wrote a prose `note` onto each `fixity` explaining that a
digest computed today is a **baseline, not proof of pristineness**.
`FixitySchema` is `.strict()` — `algorithm`, `digest`, `verifiedAt` only — so
219 records were written that failed `folio-fhir-artifact-index/v1` on **both**
artefact indexes.

CI was still reporting only a lint error when `bun run gates` caught this, which
is the argument for the local sweep in one line. It is also the third push this
session that went out before the sweep finished.

The fix is not a new schema field. `verifiedAt` already means *"when the digest
was last RE-COMPUTED against the bytes, not when it was recorded"*, so a record
whose ingestion never wrote a digest, dated at the backfill, **is** the
statement that this digest was observed rather than original. Adding a
distinguishing flag would also have taken back the owner's choice of a plain
backfill over the flagged option.

The prose caveat is not copied onto 219 records. It is in the backfill module's
header, this bean, the commit and the PR.

### What the digests do and do not prove

They establish a baseline **from now on**: an edit in place is caught from here.
They do not prove the bytes are pristine — an artefact already edited before the
backfill ran is now blessed, and nothing here can tell. Egress is blocked in
this environment, so re-fetching upstream to compare was not available; a later
run with network access could verify against `materialization.of` and upgrade
the claim from *observed* to *confirmed*.

### Two guards, replacing one

`materialized-fixity.test.ts` asserted the `note`'s wording; it now asserts
`verifiedAt` parses as a date, and — separately — that what the backfill writes
**validates against `FixitySchema` itself**. The second is the one that would
have caught this. Asserted against the schema rather than a hardcoded list of
three field names, because a list here goes stale the moment the schema gains a
field and then fails on a legitimate addition.

### Root cause, not just the data

`ingest-ig-artifacts.ts` never wrote fixity at all, so every future ingest would
re-open the gap the backfill just closed. It now hashes the source bytes at
ingestion, which is the point where *original* is still true — a digest recorded
there proves what a backfilled one cannot.

## OWNER DECISIONS, 2026-09-22 — both corrections implemented

Two questions put with options; both answered with the recommendation.

### 1. Local provenance → `provenance: { upstream, local, signature? }`

`of` is gone. `MaterializationSchema` now carries a **pointer pair**, which is
the owner's own model: *"a pointer to the asset in `folio/` or elsewhere and a
reference to the `library/` original reference"*.

**The conflation was already live, which was not expected.** `of` was documented
as *"the remote thing. A URI, always — never a path, never a bare name"*, and
**5 of the 9 who-iris item records violated that documentation**, in three
shapes, two of them inside one file:

| record | old `of` | what it actually was |
|---|---|---|
| the item | `local:9789241548960-eng` | its own id — a bare name, not provenance at all |
| its PDF | `https://iris.who.int/handle/10665/145714` | genuine upstream |
| its cover PNG | `local:who-iris/uploads/…/foo.pdf#page=1` | a **local** original — a path |

So this is a correction to the corpus as much as to the model. The count is
5 rather than the 6 in the note that prompted it, because it was **re-counted
after the migration** instead of quoted from prose.

**Migrated: 1442 records across 16 files** — 1437 upstream, 5 local, 0 empty.
The `local:` scheme is dropped; it existed only to tell the two apart inside one
field.

Two consumers got simpler rather than longer. `gen-iris-pages.ts`'s `sourceOf()`
asked `of?.startsWith("http")` because the SCHEME was the only discriminator —
a proxy that worked by luck, since a local reference under an `http` URL would
have rendered as an IRIS source. And `upstreamCell()`'s "local" fallback read
the same field `sourceOf` had just rejected, so it showed leftovers rather than
the local reference it claims to show.

**Both pointers may be absent**, and then `note` is REQUIRED. The who-iris item
above knows it came from IRIS and does not know the handle; that is a state, not
an unfilled field — the same discipline as `GateSchema.basis`.

**`SignatureSchema` exists from day one** so the owner's *"digital signature
later that can be checked"* needs no second migration. What is NOT there is a
trusted-data-object format: the term appears nowhere else in this checkout, so
inventing one would model something this repository has not adopted. And a
recorded signature is never a verified one — nothing verifies today, and the
field says so rather than reading as coverage.

### 2. Read-only → declared, with `check:read-only-graphs` gating it

Declaration + gate, over derivation. The declaration is what a listing reads
without scanning a corpus; the gate is what stops it drifting from the nodes.

**Absent is not `false`.** It is *not declared* — a directory that has not
answered has not asserted it is writable.

**The corpus falsified the first version within minutes.** The gate compared two
booleans, so "declared writable over materialized nodes" was flatly a
contradiction, and it fired on `who-iris/uploads/` — the ingestion DROP ZONE
that `adapters/document/paths.ts` creates on a first ingest precisely so
somebody can write there. The declaration was right and the gate was wrong: the
bytes are materialized, the directory is a write target, and a boolean
comparison cannot ask the second question.

So `readOnlyBasis` is required on BOTH values, and a stated exception is a
fourth verdict rather than a failure — exactly as `GateSchema.basis` is required
on `permitted` and not only on `refused`. Current corpus: 3 agree, 0 contradict,
1 stated exception, 0 undeclared.

### 3. The two greys reach the data

`readOnly` flows declaration → `HarnessVisualisation` → `_data/harness.json`,
resolved **per KIND** and not per instance — who-iris proves why, carrying
`catalogue: true` and `uploads: false` at once. Kinds whose directories disagree
resolve to `undefined` and are reported, never settled by a rule nobody chose.

A read-only tile is **dashed, not dimmed**: dimming spells it the same way as
"nothing to open", which is the collapse being prevented, and it would read as
"less important" about content that is frozen precisely because it matters. The
state also reaches a screen reader through `aria-label`, never colour alone.

**MEASURED AND NOT YET OBSERVABLE.** All 3 frozen kinds currently also lack a
`path`, so in this corpus the two greys are perfectly correlated. The cause is
not derivation — it is `harness-tiles.ts` discovering viewers only at
conventional paths, the same `withRoutes` gap `viewer-undiscovered.test.ts`
measures from the other side. `two-greys.test.ts` asserts the weaker true thing
and names the stronger one, so the eventual fix will not look like a regression.

### Still open on this bean

The copy-out BPMN with lanes bound to roles, its committed instance under
`beans/workflows/`, and `todo-review` linking back. Those were waiting on the
provenance field; they are not waiting on it any more.

## A MARK WITH NOTHING TO STYLE — caught by reading the deploy, not the diff

The first two-greys implementation put the read-only mark on the **graph-tile**
surface: `docs-ui.js` reading `t.readOnly`, CSS dashing the tile, both shipped
and both correct in isolation. A staging-preview notice prompted a check of the
deployed branch, and `readOnly` appeared **0 times on 3 of 3 sampled pages**.

The reason is a surface split that no test covered: `fa-tiles` is built from
`graphTiles(decl.directories)` where `decl` is the **root** instance, and no
`cat-harness` directory is read-only. The `readOnly` data lives in
`_data/harness.json`'s `harnesses[].visualisations` — a different surface,
rendered by Liquid, not by that tile loop. Live CSS, live JS, nothing to act on.

`continual-progress` already measures this on PR #178: *a human cannot assess a
rendered artefact from a description of it.* The deploy said so; the diff did
not, and the gates were green across it.

### The second attempt nearly repeated it

The obvious fix — mark the read-only entries in the harness viewer list — would
also have rendered zero times, because that list holds only kinds **with** a
`path` and **no kind here is both published and read-only**: all three frozen
ones lack a viewer.

So the fact is carried as a **finding**, where a missing viewer cannot hide it.
It renders for all three today. The viewer-list mark is kept anyway, correct
from the moment a frozen kind gains a viewer, with its own comment saying it is
currently unexercised — because adding it later is precisely how the first
attempt happened.

A reader told only *"catalogue: no published viewer"* learns that nothing opens,
and not that what is behind it is frozen and needs a copy-out. The finding says
both, and says what to do: *"copy one out to your own `folio/` to work on it."*

### What could NOT be verified here

`bun run preview:site` has no working Jekyll in this container, so the rendered
page was not inspected — only the data reaching it and the template that reads
that data. Four assertions in `two-greys.test.ts` pin the finding's presence,
the kinds it names, the action it offers, and its ABSENCE on instances holding
nothing frozen.

## The copy-out process exists — `copy-out-materialized.bpmn`

Four lanes, every one bound to a declared role, and the point of drawing it is
that **a copy-out is two writes and a refusal**, where the common bug is to make
it one write.

| lane | role | what it does |
|---|---|---|
| Reader | `user` | wants to EDIT; the one gate asks about the target, not the actor |
| Source graph | `corpus` | one task, and it **writes nothing** |
| Copier's own `folio/` | `author` | lands the bytes, then records `provenance.local` |
| Verification | `validation-pipeline` | the **source** still hashes to its digest |

**The source lane holds one read-only task on purpose.** A lane that is only
ever read from is the visible form of the rule: the arrow runs out of it and
never back. Its emptiness is load-bearing, not incidental — it is where the
process would go wrong if anybody added a step.

**It starts at an intent to EDIT, not at a request to copy.** A reader does not
set out to make a copy; they set out to change something, and the rule is what
turns that into a copy. A diagram starting at "copy this" would never be reached
by the person who needs it. The writable branch is drawn too, so the process
does not read as though every edit needs a copy.

**STRICT, for a narrow reason.** Only `Gateway_Frozen` is a gate; everything
after it is mechanical. What earns strict is that *skipping the process does not
fail loudly* — an edit in place succeeds, and is caught only later by
`check:materialized-fixity`. A process whose omission looks exactly like
compliance is the `vlhk` shape, and advisory would not hold it.

**The copy-out re-opens none of the five materialisation gates.** Those were
answered when this repository decided it may hold the bytes at all; copying
something already held is not a second acquisition. The copy does inherit the
`restrictions` and `copyright` verdicts, and publishing it is the copier's
folio's decision.

**The copy is NOT read-only.** It is the copier's own content, makes no claim
about anybody else's bytes, and freezing it would mean the next person needs a
copy of the copy.

Skill: `large-datasets/skills/copy-out-materialized.md`, registered in that
package's manifest. All 5 activity skill refs resolve; the kg-qa sidecar is
clean.

### What a new process owes, learned by failing 8 gates

Not guessed — the gate set named each one. Recorded because the next person
adding a diagram will otherwise rediscover it the same way:

1. `render:bpmn` — the SVG is generated, never hand-edited
2. `translate-bpmn --extract` — a `.pot` per gating locale (5)
3. `gen-skill-docs` — the skill's instruction body is published
4. `gen-docs-pages` — the process hierarchy and the workflow page
5. `kg:detangle` — pinned measurements move when a process is added
6. `translation:status` — the coverage page counts templates
7. **indexed in the SOURCE chapter**, `content/docs/publication-workflow/every-workflow-in-the-repo.md` — not the generated `docs/publication-workflow.md`, which is where I put it first and which `gen-docs-pages --check` then reported stale
8. a partition rule for any new script

`check:workflow-refs` states the reason for #7 exactly: *"a diagram no reader of
the workflow page can find"* — its own history is a page that opened "Nineteen
BPMN 2.0 files" and listed eight.

## The publication exception — a RULE, because it has no instance to be a step of

The done-when said *"a NAMED step in a declared process, not a carve-out in
prose"*. Implemented differently from how it was written, and the measurement
is why.

**Measured: no publication process in this repository writes to materialized
content.** `kg-to-portal.bpmn`'s `S_Sign` signs a subgraph cut from the KG —
derived content, not held upstream bytes — and nothing else comes close. So
drawing a publication step that writes to materialized content would model
something that does not happen, which is the `dh4f` defect: a consumer scans a
declared-but-absent thing and reports a clean run over nothing.

**And one step in the declared corpus DOES rewrite held bytes** —
`refresh-materialized.bpmn`'s `Task_Apply`. Until 2026-09-22 it named no fixity
write at all, so a **correct** run of that process would have failed
`check:materialized-fixity` as a mismatch: the gate saying *"somebody edited
held content without saying so"* about the one process whose job is to replace
it. That is a live defect this bean's own gate created, found by asking where
the exception actually applies rather than by assuming it applies to
publication.

So the exception is stated as a rule, which is **stronger** than a named step:

> A step that rewrites a materialized artefact records the new fixity in the
> same change.

An allowlist of permitted writers goes stale the first time somebody adds a
sixth one, and needs every writer to announce itself — passing silently for
anyone who forgets. The rule is checkable, asks about BYTES rather than about
who wrote them, and needs no attribution of a commit to a process step.
`check-materialized-fixity.ts`'s own header already argued this; what was
missing was applying it to the one step that needed it.

## `todo-review` no longer starts mid-air

The owner, 2026-09-21: *"this is first/early step of review process, checking
out local copy to edit, make comments/todos/stickies, etc on it. these feed into
the comment review pipeline."*

`todo-review` triages feedback and never said how a reviewer came to have an
editable copy to leave feedback ON. For materialized content the answer is not
"they opened it" — browsing gives a read-only view with nothing to annotate.

It now opens with the sequence and two consequences that change how an item is
triaged:

- **feedback is on the COPY**, so resolving an item edits the copy and the
  original still hashes to its digest — if it does not, somebody annotated held
  content in place;
- **`provenance.local` is what keeps a resolved item traceable** to what it was
  really about; without it a reviewer's comment loses its subject one rename
  later.

Nothing else in that skill changed. It is not a second pipeline — it is why the
existing one has somewhere to start.

## A correction to this session's own reporting

I told the owner that `cat-harness/skills/` was gone in the #822 reorg. **It is
not** — an `ls | head -20` truncated before it. Workflows did move to
`processes/` and roles to `scenarios/roles.json`; skills did not move. Recorded
because the claim would have sent somebody looking in the wrong place.

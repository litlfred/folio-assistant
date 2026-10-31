---
# folio-assistant-rwmf
$schema: bean/1.0.0
title: 'GOAL 4 / PLATFORM: the harness''s own reliability — gates, process, QA, merge pipeline, deployment — which every GOAL stands on'
status: in-progress
type: milestone
priority: high
created_at: 2026-10-03T08:26:45Z
updated_at: 2026-10-31T17:05:00Z
---

## There is no owner's quote on this bean, and that is deliberate

`vuip`, `p5wm` and `yg29` each open with the owner's words kept verbatim.
**This one has none.** The owner chose *"a fourth milestone: PLATFORM"* from a
set of options put to them on 2026-10-03, and the title and scope below were
**derived from the measurement in the next section** by
`session_01SjvqTkDQsqa6SLLFjBwoD3` rather than dictated. Nothing here is
quoted, because inventing a quote for a milestone is how a paraphrase becomes
the owner's belief — the same failure the three `scrapped` PARAPHRASE
milestones (`6e7b`, `uadc`, `a46u`) were scrapped for. If the owner's own
framing differs, **the framing wins and this text is wrong**.

## Why a fourth milestone — the measurement

Re-measured 2026-10-03 on `main` @ `5dcee5b0baf`, from
`beans query '{ beans { id title status type parent { id } } }'` over the
committed store, computing each open bean's ancestor chain to an open
`type: milestone` root:

| | measured |
|---|---|
| open beans (`todo` + `in-progress`) | **390** |
| open beans with **no** open-milestone ancestor | **242 — 62 %** |
| epics, all statuses | 33 |
| epics with no open-milestone ancestor | 21 (**17** of them open) |
| open descendants carried by those orphan epics | **229** |

Current placement of the 390: `vuip` 93, `p5wm` 51, `yg29` 1, **unplaced 242**,
plus the three milestones themselves.

**The missing milestone is not a gap in the goals; it is a category the goals
do not have.** Every one of the three states an *outcome a reader can see* — a
separated repo that instantiates, a navbar with folios and stickies, who-iris
on its own theme. The largest orphan epics are none of those: `1xhc` CI
RELIABILITY (47 open), `ahvw` PROCESS (28), `5a3l` DEPLOYMENT (18), `1swy` QA
(17), `hfag` Merge pipeline (9). They are the machinery all three outcomes are
*produced by*. Hanging them off any single GOAL would be false — a CI gate that
does not fire costs GOAL 2 and GOAL 3 exactly as much as GOAL 1 — and leaving
them unplaced is what the 62 % is.

### What this milestone is, in one sentence

> **The harness's own reliability: that a gate fires and says so, that an agent
> knows which process it is in, that a verdict is recorded rather than
> impressed, that a branch merges through a pipeline, and that the result
> deploys — for all three GOALs at once.**

### What it is NOT

Not the content model, and not the authoring surface. A block kind, an adapter,
an ingest arm and a vocabulary are **folio content work**; they are orphaned
too, and this milestone deliberately does **not** absorb them — see the two
rows marked *(no fit)* below and §"The residual" after the table.

### Reconciliation with the earlier count, including the part that does not reconcile

The brief this bean was commissioned from gave **241 of 389 (62 %)** and **229**
open descendants under the orphans, and **18 of 30** epics with no milestone
ancestor.

- **229 reproduces exactly.** 241/389 and 242/390 are the same figure one bean
  later. Neither needs explaining.
- **30 → 33 epics and 18 → 17 open orphans do NOT reconcile**, and this bean
  does not pretend otherwise. The three most recently created epics are `iirv`
  (2026-10-01), `fs43` and `whlc` (both 2026-10-02), so 33 − 3 = 30 *fits* if
  the earlier count predates them — but the brief is dated 2026-10-03, so that
  is a coincidence that fits, not a cause that was checked. Four orphan epics
  are `completed` (21 orphans in all, 17 open), so a count that included or
  excluded closed ones lands at a different number again.

**The basis of the count above is stated so the next one can be compared rather
than guessed:** an epic is `type: epic` in `beans/defs/` (non-recursive, so the
631-bean archive is excluded); an *orphan* epic has no `type: milestone`
ancestor whose status is `todo` or `in-progress`, following `parent` upward; and
*open* is `todo` or `in-progress`. On that basis: 33 epics, 21 orphans, 17 of
them open, 229 open descendants. The finding — most of the work plan is under no
goal, because most of the big epics are — is unaffected either way.

---

## PROPOSAL — a parent for each of the 17 open orphan epics

**Nothing below has been applied.** No `parent:` field was edited by this
session, in this bean's commit or anywhere else. The proposal **is** the
deliverable.

An epic's placement is a claim about which goal pays for it, and a milestone is
a statement of what its owner believes that goal needs next.
[`role-model.md`](../../cat-harness/skills/process/process-core/role-model.md)
§`judgementOnly` is the rule: the `stakeholder` role *"carries no skills
deliberately: sign-off is a judgement, not a procedure, and a skill here would
suggest an agent could supply it."* **Approving 17 re-parents is exactly that
sign-off.** This session acted in the measuring lane — it can derive the table
and argue each row, and that is what a skill can supply; it cannot supply the
approval. `k59d` already settled the same question one level down and declined
to edit `p5wm` and `yg29` for the matching reason — *"rewriting somebody else's
belief is not a checker's to do."*

Column 3 is one of **PLATFORM** (this bean), `vuip` (GOAL 1 — separation and
instantiation), `p5wm` (GOAL 2 — navbar, folios, stickies), `yg29` (GOAL 3 —
who-iris themed), or **(no fit)**.

| epic | title | open desc. | proposed parent | reason |
|---|---|---|---|---|
| `1xhc` | CI RELIABILITY: a gate that does not fire is indistinguishable from one that passed | 47 | **PLATFORM** | The largest orphan in the store, and its subject is the gate set itself. No GOAL names CI; all three are judged by it. |
| `ahvw` | PROCESS: how an agent decides what it is doing, and what governs each step | 28 | **PLATFORM** | Process state, lanes, roles, opening briefs. Governs every lane in every GOAL and is the content of none. |
| `5a3l` | DEPLOYMENT: topologies and operating modes are two axes, not one list of modes | 18 | **PLATFORM** | How a harness instance is *run*, independent of which folio it carries. (Also the one `closed-container-open-subtree` finding `check:bean-rollup` baselines — a milestone gives that subtree somewhere to be judged from.) |
| `1swy` | QA: verdicts, sidecars and the audited review record | 17 | **PLATFORM** | The verdict machinery — sidecars, axes, the audited record. A folio supplies subjects; the apparatus is the harness's. |
| `slw1` | INGEST: one pipeline from uploads/ to a complete L1 library | 17 | **(no fit)** | `uploads/` → `library/` with nine per-format arms. This is **content production**, not platform reliability; the navbar and who-iris do not pay for it either. Needs a fifth milestone — see §"The residual". |
| `zzmr` | KG: the knowledge graph's own structure, declaration and publication | 15 | `vuip` | Its own body: declaration, the half-declared node kinds, and two stores moving into declared graphs. GOAL 1's *"each harness instantiation with config"* is exactly a declaration contract, so the graph's self-declaration is that goal's substrate. Competing reading: PLATFORM, since a declaration nobody can parse is a reliability defect — named here rather than hidden. |
| `bzyu` | TRANSLATION: the gettext pipeline, translated renders, and their QA | 15 | **PLATFORM** | Conditional, and the epic says on what: *"`x3h9` is the one that decides the others' home: if the gettext pipeline is HARNESS CORE rather than folio-only, every instance inherits it."* Platform is the reading that follows if `x3h9` lands harness-core; if it lands folio-only this row is content work, with `slw1` and `0lmb`. |
| `q4jm` | LARGE-DOCUMENT REVIEW: a review/ visualiser for a folio's diff from main | 15 | `p5wm` | A rendered surface a human navigates — heat maps, navigation, review comments on a page. The same stream as `o3xy` and `4ccr`, which already hang from `p5wm`. Its *process* half (roles, review workflow) is PLATFORM-shaped; see §"Two epics that want splitting". |
| `fs43` | ARC: state graphs on a declared 'state' branch — beans, workflow instances, todos, issue-marks off main | 12 | **PLATFORM** | *Which ref holds a graph* is harness storage, driven by clone cost and `gh-pages` weight. Generalises the `qa-reports` arc. No folio's content changes either way. |
| `0lmb` | CONTENT MODEL: block kinds, adapters and the authoring surface | 10 | **(no fit)** | Block kinds, adapters, the `recommendation` kind, the DAK type, the lexer implemented six times. **The authoring surface an author writes against** — the clearest content-model epic in the store, and the one that must not be swept into PLATFORM. |
| `hfag` | Merge pipeline: train process, queue state, reprioritisation, gates | 9 | **PLATFORM** | The harness's own SDLC. A merge train serves whatever is in flight. |
| `8jt6` | MEMORY & TODOS: notes an agent or a person carries, attached to the graph | 7 | `p5wm` | `h32d` is *"stickies in the rendered folio"* and GOAL 2 names stickies in its own title — the strongest title-level match in the table. But two children (`4kiw`, `0j8h`) are agent-memory injection-budget defects and are PLATFORM-shaped; see §"Two epics that want splitting". |
| `whlc` | KG PUBLICATION: named subgraphs (referenced + hydrated), skeleton/payload split, late client-side materialization | 6 | `vuip` | The owner's own words in it decide this: *"this will be a common problem on separation, referencing and managing content on subgraphs."* Separation is GOAL 1. |
| `2upx` | DOCUMENTATION: one SDO voice, RFC 2119 requirement levels, and the pages the knowledge graph is missing | 5 | **PLATFORM** | Its stated scope is *"bootstrap and cat-harness first"* — the platform's own documentation and voice, not a folio's prose. |
| `nok9` | MERGE GATE: agentic adversarial review + content-type compile gates, and per-content-block QA backfill | 4 | **PLATFORM** | Same subject as `hfag` and `1swy`. Candidate to hang from one of those two rather than beside them — a three-way overlap worth resolving, not a third opinion to keep. |
| `9v5a` | QA BACKFILL: per-content-block adversarial QA over the existing corpus, plus the methodology research it rests on | 1 | `1swy` → PLATFORM | One open descendant and the same subject as the QA epic. Proposed one level down rather than directly off a milestone, so the QA area has a single root. |
| `d308` | CODE DISPENSATION: 868 code files → 13 Tool nodes, each bound to a BPMN task | 3 | *(inherits `zzmr`)* | **No decision needed on its milestone.** It already carries `parent: zzmr`; it is counted among the orphans only because `zzmr` is one, and it reaches a milestone the moment `zzmr` does. Separately, it is `check:bean-parents`' one baselined defect — an epic whose parent is an epic — which is its owner's to resolve and is not this table's subject. |

Four further orphan epics are **`completed`** (`qsf5`, `2sns`, `tr05`, `3x2n`)
and carry zero open descendants. `check:bean-parents` ignores closed beans on
the stated ground that back-filling history changes no plan, so no assignment
is proposed for them.

### Three epics the earlier framing listed as orphans that are NOT

The measurement this bean was commissioned from named `6lb8` FOLIO BOARD,
`o3xy` UI & ACCESSIBILITY and `4ccr` WIREFRAME FINDINGS as examples of epics
that *"look like GOAL 2 and must not be swept in"*. Re-measured on
`5dcee5b0baf`: **all three already carry `parent: p5wm`** and are placed.
`4ccr`'s was the `tlj9` repair. Recorded because an agent handed the older list
would propose a re-parent that is already done.

### Two epics that want splitting, and why no split is proposed

`q4jm` and `8jt6` each span the line this milestone draws: a rendered surface a
person looks at (GOAL 2) and the apparatus behind it (PLATFORM). The honest
move would be to cut each in two. **This bean does not propose that**, because
splitting an epic reassigns its children's subjects as well as their parent,
and that is further into somebody else's judgement than a parent field is. The
rows above pick the reading each epic's own body leans to and name the other
out loud.

### The residual — what a fourth milestone still does not place

If every row above is approved, the closure (computed, not estimated):

| | open beans |
|---|---|
| PLATFORM | 166 |
| `vuip` | 116 |
| `p5wm` | 75 |
| `yg29` | 1 |
| **still unplaced** | **29 — 7 %** |

And the 29 are not scattered: they are **exactly** `slw1` (18 incl. itself) and
`0lmb` (11). That is the arithmetic check on this whole table — the residual
falls out as the two rows marked *(no fit)* and nothing else, which it would not
if a row had been fudged.

**So PLATFORM takes 62 % down to 7 %, and the 7 % is one coherent subject:
the content model and the pipeline that feeds it.** Whether that is a fifth
milestone (CONTENT), or belongs under one of the four, is the owner's call and
is **not** decided here. It is raised rather than left as a silent remainder,
because a 7 % residual with no name is how the 62 % accumulated.

---

## Done when

- [x] the owner has ruled on the 17 rows above — approved as proposed, or amended
- [x] the approved re-parents are applied by each epic's owner, or by this lane on the owner's explicit go
- [x] `bun run cat check:bean-parents` and `check:bean-rollup` are green after the re-parents
- [x] the residual (`slw1`, `0lmb`) has a stated home — a fifth milestone, or a row in the table above
- [x] this milestone's own scope sentence is replaced by the owner's words, or the derivation note above is confirmed as the record — **confirmed by the owner 2026-10-04** ("Keep derived title")

- **waits on:** the owner — approval of the 17-row table; nothing else in this bean can proceed without it
- **since:** 2026-10-03
- **expires:** 2026-10-17 — a REVIEW date, not a takeover date
- **handoff:** on expiry, re-raise the table unchanged. Do **not** apply it unapproved: the measurement keeps, and an unapproved re-parent of 17 epics is harder to undo than to wait for.

## The decision being asked for

Everything needed to answer is above: the measurement, the 17 rows with a
reason each, the resulting closure, and the residual. The question is one
question in three parts, in order of how much it matters:

1. **Is PLATFORM the right fourth milestone at all** — the machinery category,
   as scoped in the sentence above?
2. **Of the 17 rows, which are wrong?** The three worth a second look before the
   rest, named here rather than left to be found: `zzmr` (GOAL 1 or PLATFORM — a
   declaration nobody can parse is arguably a reliability defect), `bzyu`
   (PLATFORM only if `x3h9` lands harness-core), `8jt6` (GOAL 2 for the stickies,
   while two of its children are platform).
3. **Does the 7 % residual get a fifth milestone?**

If the answer to (1) is no, this bean is `scrapped` with the reasons and the
measurement is kept — the 62 % is a real finding whatever the remedy.

_2026-10-04T15:11:51Z_ — Claimed by claude/goal4-reparent — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Owner ruling, 2026-10-04

In session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi, after the
table was re-checked against `main` (all 16 open orphan epics still had no
parent; `d308` still under `zzmr`), the owner chose from options put to them:

- the table: **"Approve all as proposed"** — every row, the four judgement
  calls (`bzyu`, `zzmr`, `q4jm`, `8jt6`) included, applied by this lane;
- the residual: **"New GOAL 5: CONTENT"** — created as `npuo`, holding `slw1`
  and `0lmb`.

Applied on branch `claude/goal4-reparent`. **One deviation, forced:** `9v5a`
was proposed as `1swy` → PLATFORM, but the `beans` CLI refuses an epic whose
parent is an epic (*"epic beans can only have milestone as parent"*), the same
shape `d308` is baselined for. It hangs from PLATFORM directly; its subject
still points at `1swy`.

Box 5 (the scope sentence in the owner's words) was not asked and stays open.


**Two further epics, same day.** Re-measuring after the 17 rows found 36 open
beans still unplaced (8 %), under two epics the 2026-10-03 table did not
list: `3fva` (QA & test evidence off main, 25 open — the qa-reports arc `fs43`
generalises) and `0ipy` (agentic SE literature, 11 open — the research behind
`nok9` and `9v5a`). Put to the owner; **"Both to PLATFORM"**. Measured after:
0 open beans without an open milestone ancestor.



## Owner ruling on scope, 2026-10-04

In session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi the owner was shown this milestone's derived title next to three alternative outcome sentences and chose **"Keep derived title"**. The title above is therefore the owner's record of this milestone's outcome, not only a derivation; the rule that the owner's framing wins still holds if they reword it later.


## 2026-10-05 — GOAL 2's open UI work re-parented here, on the owner's ruling

GOAL 2 (`p5wm`) closed with all three of its boxes met. Its 10 open direct children (76 open beans in total) were the UI work that grew around it, not part of its outcome. Asked where they go, the owner chose **"Move to GOAL 4 PLATFORM"** (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi): `10uc`, `6lb8` (FOLIO BOARD), `8jt6` (MEMORY & TODOS), `o3xy` (UI & ACCESSIBILITY), `l4c5`, `gp2f`, `q4jm` (LARGE-DOCUMENT REVIEW), `yj32` (HARNESS AS INTERFACE), `4ccr` (WIREFRAME FINDINGS) and `68op`. PLATFORM's scope now reads to include the rendered surface.


## 2026-10-31 — Progress rollup across GOAL 4 / PLATFORM descendants

- **Direct children**: 9 of 10 direct children are now `completed` (`10uc`, `4ccr`, `68op`, `6lb8`, `8jt6`, `gp2f`, `l4c5`, `o3xy`, `q4jm`); only `folio-assistant-yj32` (`HARNESS AS INTERFACE`) remains open (`todo`).
- **Deploy-cone & writer-records pipeline (`folio-assistant-fwtz`, `cat-harness-tools#400`)**:
  - Merged on `main`: [`litlfred/cat-harness-tools#1147`](https://github.com/litlfred/cat-harness-tools/pull/1147) (`8cad4dd`), [`#1149`](https://github.com/litlfred/cat-harness-tools/pull/1149) (`0644c19`), and [`litlfred/folio-assistant#2841`](https://github.com/litlfred/folio-assistant/pull/2841)–[`#2854`](https://github.com/litlfred/folio-assistant/pull/2854) & [`#2858`](https://github.com/litlfred/folio-assistant/pull/2858) (`6aa82ae`, re-pinning [`cat-harness-tools#1156`](https://github.com/litlfred/cat-harness-tools/pull/1156) `10ebb8b`) (recording 27+ publish-time writers in `writer-records.yml`, carrying `writerVerdicts` and `writerVerifyLog` in `build.json`, skipping unchanged `derive:publish` writers in `staging-preview.yml`, and sharing unchanged preview files with `main` via `#2843`/`#2845`).
  - Open PRs: [`litlfred/cat-harness-tools#1129`](https://github.com/litlfred/cat-harness-tools/pull/1129) (`629cc8c`, blanking remaining per-deploy stamps in `docs-cone-dryrun.ts` and making all remaining 22 `derive:publish` writers recordable under `writer-cone`) and [`litlfred/fhir-harness#250`](https://github.com/litlfred/fhir-harness/pull/250) (`12548af`, byte-for-byte deterministic `packFromAst` `package.tgz` archives).
- **Post-merge regen & `main` QA gates (`folio-assistant-ksek`, `folio-assistant-p7mb`)**:
  - Merged on `main`: [`litlfred/cat-harness#857`](https://github.com/litlfred/cat-harness/pull/857) (`eef8750`) + [`litlfred/cat-harness-tools#1143`](https://github.com/litlfred/cat-harness-tools/pull/1143) (`1517ad4`) removing committed `test/results/` (`tfqf`/`7mwa`, re-pinned in open [`litlfred/folio-assistant#2855`](https://github.com/litlfred/folio-assistant/pull/2855) `b1fce77`); `.github/main-qa-gates.json` merged in `folio-assistant-sci#150` (`11b78e9`), `smart-immunizations#102` (`ab75774`), and `smart-trust#96` (`bb77502`).
  - Open PRs: [`litlfred/cat-harness-tools#1152`](https://github.com/litlfred/cat-harness-tools/pull/1152) (`fa36384`, target-repo scoping and off-checkout `storage` handling in `post-merge-regen.ts` + IG/Java inputs in `layer-post-merge-regen.yml`), [`litlfred/folio-assistant#2857`](https://github.com/litlfred/folio-assistant/pull/2857) (`6edcaed`, pre-gate inputs in `post-merge-regen.yml`), [`litlfred/cat-harness-tools#1146`](https://github.com/litlfred/cat-harness-tools/pull/1146) (`89abe02`, empty baseline in `layer-pr-checks.yml` when `main` has no harness, `#1139`), [`litlfred/cat-harness-tools#1142`](https://github.com/litlfred/cat-harness-tools/pull/1142) (`c6c20ac`, repairing `cat-tools-g7ls` `status: done` → `completed` and skipping generated `README.md` in bean readers), [`litlfred/cat-harness-tools#1150`](https://github.com/litlfred/cat-harness-tools/pull/1150) (`4ac9907`, `schemeOwner` prose `dcterms:source` fix), and `.github/main-qa-gates.json` PRs [`litlfred/folio-assistant-core#432`](https://github.com/litlfred/folio-assistant-core/pull/432) (`c212ddd`), [`litlfred/smart-base#257`](https://github.com/litlfred/smart-base/pull/257) (`3017d04`), and [`litlfred/who-iris#145`](https://github.com/litlfred/who-iris/pull/145) (`3728eb0`).
- **Fixes for remaining [`litlfred/folio-assistant#2781`](https://github.com/litlfred/folio-assistant/issues/2781) (`main` QA gates) failures**:
  - **`check:harness-state:check` (`health-result-is-from-the-current-producer`)**: **FIXED on state branches** (`cat/cat-harness-tools/health`, `cat/folio-assistant-core/health`, `cat/who-iris/health` updated to `4c5c53c99d94`; `bun run cat check:harness-state:check` passes with `4 examined, 0 findings`).
  - **`End-to-end + accessibility, shard 3/3` (`sidebar-rail.e2e.ts` & `who-iris-search.e2e.ts`)**: Fixed in [`litlfred/cat-harness-tools#1159`](https://github.com/litlfred/cat-harness-tools/pull/1159) (`dedcc0d`, all PR checks green).
  - **`gates-workflows.test.ts:295` (`staging-share.ts apply`)**: Fixed in open [`litlfred/cat-harness-tools#1157`](https://github.com/litlfred/cat-harness-tools/pull/1157) (`68c5559`).
  - **`tools.test.ts:300` (`diig-phases-svg ~ smart-approach-svg`)**: **FIXED and Merged on `main`** in [`litlfred/folio-assistant-core@8ee87e2`](https://github.com/litlfred/folio-assistant-core/commit/8ee87e239dad83b7ad7e4a3669282184ee913c5c) (`#435` closed as superseded).
  - **`cat-harness` stale derived files & cross-instance `builtAtPublish` (`fa#2781`)**: Fixed in open [`litlfred/cat-harness#865`](https://github.com/litlfred/cat-harness/pull/865) (`b3fde5e`); adversarial-review attestation regression from `#857` fixed and **Merged on `main`** in [`litlfred/cat-harness#863`](https://github.com/litlfred/cat-harness/pull/863) (`920dce8`) and [`litlfred/cat-harness-tools#1158`](https://github.com/litlfred/cat-harness-tools/pull/1158) (`7465b33`).
  - **`subgraphs-checkout.test.ts:66` (`public-comment.md → review-sheet-agent-columns.md`)**: Ready in [`litlfred/folio-assistant-core#315`](https://github.com/litlfred/folio-assistant-core/pull/315) (`4ee7219`).
  - **`glossary-mapping-block.test.ts:170`**: Fixed in [`litlfred/cat-harness-tools#1150`](https://github.com/litlfred/cat-harness-tools/pull/1150) (`4ac9907`).
  - **`ingest-and-l1.test.ts:429`**: Fixed in [`litlfred/cat-harness-tools#1095`](https://github.com/litlfred/cat-harness-tools/pull/1095) (`8bb24b4`).

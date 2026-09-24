---
# folio-assistant-uiw6
title: 'KG AUDIT: 12 STALE sidecars whose subjects are no longer subjects — my discovery diagnosis was wrong'
status: completed
type: task
priority: high
created_at: 2026-09-20T10:58:07Z
updated_at: 2026-09-20T12:42:53Z
parent: folio-assistant-d308
---


Found 2026-09-20 on PR #494, after merging main. **Not caused by that PR** — four
arrived with main's rename of skills into `skills/workflow/`, eight pre-date it.
`kg:audit` prints the finding and **exits 0**, so `bun run gates --all` reports
53 gates passing with this on screen.

## What the check says, and which branch this is

`kg-audit.ts:1394` reports sidecars auditing a subject no report covers, and names
two possible causes:

> Either the subject moved and the sidecar should go, or it is no longer
> discovered from this root and the DECLARATION is what is wrong.

**It is the second.** All twelve subjects still exist on disk — checked one by
one, not inferred:

| sidecar's subject | file present? |
|---|---|
| `skills/workflow/bpmn-authoring.md` | yes |
| `skills/workflow/dmn-authoring.md` | yes |
| `skills/workflow/bpmn-processes.md` | yes |
| `skills/workflow/process-state.md` | yes |
| `skills/folio-core/bib-qa/qa-tags.md` | yes |
| `skills/folio-core/coordinate/protocol.md` | yes |
| `skills/folio-core/integration-watcher/idle-backlog.md` | yes |
| `skills/folio-core/integration-watcher/lifecycle.md` | yes |
| `skills/folio-paper-adapter/formalizer/{conventions,integration,patterns}.md` | yes (3) |
| `skills/folio-paper-adapter/lean-environment-setup/mathlib-cache-fallback.md` | yes |

Two shapes, and they may be one cause or two:

1. **Four moved**, by main's rename into `cat-harness/skills/workflow/`. Their
   sidecars still sit at the old paths (`authoring-who-smart-guidelines/`,
   `folio-core/`), so discovery misses them at the new location.
2. **Eight are NESTED** — a skill in a subdirectory of a package
   (`bib-qa/qa-tags.md`, `formalizer/patterns.md`). The audit reports 274
   subjects and reaches none of these, which suggests subject discovery walks one
   level rather than recursing.

## Why this is worse than an unaudited skill

An unaudited skill is a gap. **A skill with a stale sidecar and no audit is a gap
wearing a verdict.** The sidecar is committed, it is the artefact `kg:audit:check`
compares against, and `AGENTS.md` gives the reason sidecars exist at all: *"a
printed verdict is gone, which makes 'unbound since it was drawn' and 'broken in
the commit under review' indistinguishable."* A sidecar whose subject is no longer
audited inverts that — it preserves a verdict nothing is re-deriving.

So twelve skills are currently outside the audit while appearing to be inside it.

## NOT deleting the sidecars, and that is the whole point

`deletion-requires-confirmation`: an agent never removes a durable artefact on its
own initiative. Here the rule is not merely procedural — **deleting them would be
the wrong fix even if it were permitted.** The subjects exist, so the verdicts are
about live skills; removing them would take the only evidence that discovery has a
hole and turn a reported finding into a silent one. Exactly the `plj1` shape the
deletion skill uses as its worked example.

## What wants checking first

- Does subject discovery recurse into package subdirectories? If not, the eight
  nested ones are one fix and the four renamed ones are a second.
- Is `skills/workflow/` discovered at all? It is a directory main created by moving
  files; if the audit keys on a package list rather than a walk, a new directory
  would be invisible.
- Whether `kg:audit` should EXIT NON-ZERO on this. It prints `✗` and exits 0, so
  the gate set passes with twelve unaudited skills on screen — and a finding that
  cannot fail is the shape this repository keeps paying for (`xom7`, `d2kp`, the
  folded YAML `--check` that had never run).

## Done when

- [ ] subject discovery reaches nested skill files, or the layout is declared not to nest
- [ ] `skills/workflow/` is covered
- [ ] each of the twelve either has a current sidecar or a recorded reason it has none
- [ ] a decision on whether this finding should fail the gate rather than print
- [ ] no sidecar deleted without the owner saying so



---

## DECIDED 2026-09-20 — fix discovery, THEN make it fail

Owner chose **"Fix discovery, then fail"**, and the order is the decision: make
subject discovery reach the nested files and `skills/workflow/` so the twelve
become audited, and only then make the finding exit non-zero. Failing first would
turn the gate red until discovery was fixed, blocking every PR for a defect nobody
had the fix for yet.

Once both land, a future orphaned sidecar fails CI instead of printing `✗` beside
an exit code of 0.


---

## CORRECTED 2026-09-20 — this bean's diagnosis was WRONG. Discovery is not broken.

**Retracting the claim above that "12 skills are unaudited while wearing
verdicts". It is false.** Every subject is audited. The twelve files are stale
sidecars whose subjects stopped being subjects, which is the check's FIRST branch —
*"the subject moved and the sidecar should go"* — the one this bean ruled out.

### How the wrong conclusion was reached

The check names two causes and I chose the second on one piece of evidence: I ran
`test -f <subject>.md` for all twelve, found every file present, and concluded the
subjects existed so discovery must be at fault.

**Existence was never the relevant property. Subjecthood was.** `skillFiles()`
already recurses — it walks with a `walk()` closure — so "nested files are not
reached" was wrong about the code as well as about the conclusion. What excludes a
file is `isPartOfASkill()`, and it excludes deliberately.

### What is actually true, measured

**The eight nested files all declare `part-of:`** — every one:

| fragment | declares |
|---|---|
| `bib-qa/qa-tags.md` | `part-of: bib-qa` |
| `coordinate/protocol.md` | `part-of: coordinate` |
| `integration-watcher/idle-backlog.md` | `part-of: integration-watcher` |
| `integration-watcher/lifecycle.md` | `part-of: integration-watcher` |
| `formalizer/{conventions,integration,patterns}.md` | `part-of: formalizer` |
| `lean-environment-setup/mathlib-cache-fallback.md` | `part-of: lean-environment-setup` |

They are fragments of longer skills, split for length, and `isPartOfASkill`'s own
comment says why excluding them is correct: *"splitting five over-length skills
turned 5 findings into 4 new ones on their own fragments"* — each fragment would
otherwise be measured against thresholds meant for a whole skill.

**And all five parents ARE audited**: `bib-qa`, `coordinate`,
`integration-watcher`, `formalizer`, `lean-environment-setup` each have a current
sidecar. So no skill lost coverage when the split happened; only the fragments'
old sidecars were left behind.

**The four moved skills ARE audited at their new paths** —
`test/results/kg-qa/skills/workflow/{bpmn-authoring,dmn-authoring,bpmn-processes,process-state}.kg-qa.json`
all exist. The old-path sidecars are duplicates of live verdicts, not the only
copy of anything.

### So the correct disposition is deletion, and it needs authorising

Twelve sidecars whose subjects are not subjects. Nothing is lost: the fragments'
coverage lives in their parents' sidecars, and the moved skills' verdicts exist at
the new paths. `deletion-requires-confirmation` applies, so this is reported
rather than done — twelve files, ~1–3 KB each, dated before today's moves.

### The owner's decision was made on my wrong premise

Asked to choose, the owner said **"Fix discovery, then fail"**. The second half
still stands and is still worth doing — once the stale sidecars are gone, making
the finding exit non-zero would catch the NEXT leftover instead of printing beside
an exit code of 0. **The first half has nothing to fix.** That has been put back to
them rather than quietly reinterpreted.

### The pattern, because this is not the first time

*"I confirmed presence without checking whether presence was the relevant
property."* Earlier in the same session: reading `echo`'s exit code as a script's;
declaring a gate absent after running a similarly-named one; calling a directory
declaration unchecked without enumerating what would have shown it checked. The
common move is stopping at the first measurement that agrees with the hypothesis.

Here the second measurement was two commands away — `grep "^part-of:"` on the
eight, and `ls` for a sidecar at the new path — and it reversed the finding.

## Done when — REVISED

- [x] which branch of the check's diagnosis applies: the FIRST, not the second
- [ ] the twelve stale sidecars removed, on the owner's authorisation
- [ ] `kg:audit` exits non-zero on this finding, AFTER they are gone
- [ ] ~~subject discovery reaches nested files~~ — it already does; there was nothing wrong


---

## DONE 2026-09-20 — deleted on authorisation, and the finding now fails the check

Owner authorised **"Delete, then make it fail"**, on the corrected premise (there
was no discovery to fix).

### Main had already improved the diagnosis, independently

By the time this was actioned, `kg:audit` split the finding into three labelled
groups with distinct advice — and reached the same conclusion this bean's
correction did, in its own words:

> **SUBJECT PRESENT, NOT AUDITED** … *"Either discovery is wrong, or it is excluded
> on purpose — `isPartOfASkill` excludes a fragment that declares `part-of:`, and a
> sidecar predating that exclusion is stale, not evidence."*

Plus a **SUBJECT UNREADABLE** group for the case where which branch applies cannot
be determined: *"That is not a pass for it."* Somebody else worked the same ground
and got there without the wrong turn.

### Deleted: 12 files, 9,734 bytes

Four under SUBJECT GONE (the `skills/workflow/` moves, whose sidecars named the old
paths) and eight under SUBJECT PRESENT, NOT AUDITED (the `part-of:` fragments).

**The list was extracted twice.** The first attempt used `grep -A 14` and returned
**9 of 12** — the same truncation that once made "13 stale library outputs" out of
22. A partial delete would have left three behind and looked finished. Re-extracted
by pattern over the whole output, cross-checked to 12, sized, then removed.

### The gate: orphans now fail `kg:audit:check`

They were computed OUTSIDE `reports`, so the severity gate structurally could not
see them — which is why twelve accumulated while `gates --all` announced 53 passing.
Now `process.exit(stale.length || orphans.length || tripped ? 1 : 0)`.

Three decisions inside that one line, each recorded at the call site:

- **Beside `stale`, because the parallel is exact.** Both say the committed sidecars
  disagree with what this run produced — one is a verdict that has not caught up,
  the other a verdict about something this run did not judge.
- **All three groups count, the unreadable one included.** `AGENTS.md` on this
  repository's own sweeps: could-not-determine "is never rendered as clean" and it
  "outranks a finding". Excluding it would put the third state back on the pass side.
- **Only `--check` gates.** Bare `kg:audit` is the WRITER and still exits 0 —
  otherwise regenerating after a rename would fail the very command you run to fix
  it.

And the report now says so, because a gate that fails without saying why sends a
reader to the wrong remedy: *"It fails `kg:audit:check`; removing a dead sidecar is
still yours to authorise."* Failing does not delete; the confirmation rule still
holds. What changed is that the remedy can no longer be deferred in silence.

### Falsifier, both directions

Replanted one orphan → **exit 1**, with the finding and the remedy printed. Removed
it → **exit 0**. Also checked that the first exit 1 was not mine: it was one
genuinely stale sidecar, cleared by regenerating.

## Done when

- [x] which branch of the diagnosis applies — the first, not the second
- [x] the twelve stale sidecars removed, on the owner's authorisation
- [x] `kg:audit` exits non-zero on this finding, AFTER they were gone
- [x] ~~subject discovery reaches nested files~~ — it already did

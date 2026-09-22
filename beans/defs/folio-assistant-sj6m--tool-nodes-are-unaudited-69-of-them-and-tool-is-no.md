---
# folio-assistant-sj6m
title: 'TOOL NODES ARE UNAUDITED: 69 of them, and `tool` is not a QA subject kind — plus assets, a pre-execution security gate, and subprocess dispatch'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T06:48:03Z
updated_at: 2026-09-22T07:17:42Z
parent: folio-assistant-vke6
---

## The ask, owner 2026-09-22 — verbatim

Quoted rather than paraphrased, because it carries four requirements in three
sentences and a paraphrase would be a second answer free to drift:

| Each tool node needs a QA check and all referenced assets.  Need to check
| before execution if security gates passed.
|
| Note skill.update In general subprocess can be run w/ same agent or
| dispatch one or more

## Measured 2026-09-22 before anything was written

**`tool` is not a QA subject kind at all**, so the gap is structural rather
than a coverage shortfall:

    KG_SUBJECT_KINDS = ["process", "decision", "role", "requirement",
                        "skill", "graph"]        schemas/kg-qa.ts:289

...while `kg-export` mints **69 Tool nodes**. `criteriaFor("tool")` cannot be
written, because the enum has no such member. So `kg:audit` does not report
tools as `n/a` — it never considers them, and reports a clean run over
sixty-nine nodes it structurally cannot judge. That is the `dh4f` shape inside
the audit whose job is catching it.

## The four requirements, and which are one thing

They arrived together and are NOT one piece of work. Recorded separately so a
later reader does not have to re-derive the split:

1. **A QA check per Tool node.** Needs `tool` added to `KG_SUBJECT_KINDS` and
   at least one criterion, or the criterion has nowhere to live. Neighbours:
   `2krx` (QA AXIS), `py74` (QA PROJECTION), `btuv` (qa-criteria registry and
   the platform boundary).
2. **All referenced assets.** A Tool node's assets must be declared and must
   RESOLVE. This is the `blv9` family — a link-shaped value that dereferences
   to nothing — and `check-declared-assets` already exists; whether it reaches
   Tool nodes is **unmeasured** and is the first thing to check. Neighbours:
   `6tkl` (its hardcoded list), `8325` (rendered-asset URLs), `o7eq` (URL
   space).
3. **A pre-execution security gate.** *"Check before execution if security
   gates passed"* — a precondition on RUNNING a tool, not on publishing one.
   Distinct from 1 and 2, which are about the node; this is about the call.
   Nearest existing work is `a58y`, and it is instructive rather than
   duplicate: it measured that the declared `qa-reporting` permission has
   **zero non-test consumers**, so a declaration that reads as a control
   enforces nothing. A security gate nothing consults would be the same
   defect with higher stakes.
4. **Subprocess dispatch — same agent or one or more.** *"In general
   subprocess can be run w/ same agent or dispatch one or more."* This is the
   BPMN subprocess execution model, and it overlaps `0grh` (the
   untainted-dispatch spine, in-progress under `3x2n`) and
   `swarm-management`. **Do not open this as new work before reading `0grh`**
   — its table of producer / checker / adjudicator may already be the answer,
   or may need only the "same agent" case added.

## Open question, not assumed

*"Note skill.update"* is ambiguous and has NOT been guessed at. It may name a
`skill_update` tool that does not yet exist, an existing MCP tool, or the
`skills/` update path as the worked example for 1–3. Left as the owner's to
disambiguate rather than resolved by picking the reading that suits the rest.

## Done when

- [ ] `skill.update` is disambiguated, because 1–3 may be scoped by it
- [ ] `tool` is a QA subject kind, with at least one criterion, and the 69
      nodes are reported rather than skipped — including a third state for a
      tool the criterion cannot judge
- [ ] Whether `check-declared-assets` reaches Tool nodes is MEASURED, before
      anything new is built for requirement 2
- [ ] The pre-execution security gate has a consumer, and a test that fails
      when the consumer stops consulting it — `a58y`'s lesson applied ahead of
      time rather than after
- [ ] `0grh` is read against requirement 4, and this bean either defers to it
      or records what it does not cover

## Do not

Do not add `tool` to `KG_SUBJECT_KINDS` with no criterion. An enum member with
nothing behind it makes `kg:audit` report tools as considered-and-clean, which
is worse than today: right now the silence is at least visible as absence.

## Requirement 2 measured 2026-09-22 — and it lands on a documented gap

The Done-when said to measure whether `check-declared-assets` reaches Tool
nodes **before** building anything for requirement 2. It does not, and the
answer reframes the requirement.

**`check-declared-assets` is not about Tool nodes at all.** It reads
`declaredAssets(root)`, which returns `decl.assets` — the INSTANCE
declaration's asset array, the `AGENTS.md` case from bean `v8gh`. So this is a
gap in the MECHANISM, not in that check's coverage, and widening it would be
the wrong repair.

**A Tool node's asset reference is `maintains`** — *"the artefacts this Tool is
authoritative for, as the URLs they are actually served at"* (`collectTools`,
`kg-export.ts`), with `maintainsFrom` carrying the repo-relative source.

**And the gap is already documented, by a COMPLETED bean.** `6f1x` narrowed
`kg:schema:check`'s `unproduced` reconciliation to artefacts whose declaring
Tool invokes `bun run kg:schema`, and stated the cost outright:

> *"Coverage of every other producer's artefacts is now ABSENT, not narrower.
> An artefact maintained by a Tool that some other command produces can rot to
> a 404 and nothing notices. Today that is two artefacts; it will be more as
> `d308` proceeds."*

### The count, and `6f1x`'s prediction held

| | |
|---|---|
| Tool nodes | 69 |
| ...declaring `maintains` | 7 (7 artefacts claimed) |
| ...covered by `kg:schema:check` | 3 |
| **...covered by nothing** | **4** |

`6f1x` said two. It is **four**, so the prediction was right and the gap has
doubled. The uncovered claims:

    assets/css/themes.css        assets/css/avatars.css
    ns/vocabulary.jsonld         ns/content/v1.jsonld

### All four currently resolve — so this is unchecked, not broken

Checked rather than assumed, because "uncovered" and "already a 404" are
different findings and only one is urgent:

- `ns/vocabulary.jsonld` and `ns/content/v1.jsonld` are written by
  `docs-site.yml` (`ns-export --out`, and a `cp` of the content context).
- `themes.css` and `avatars.css` appear NOWHERE in that workflow — not even
  by basename — but both are committed under `cat-harness/docs/assets/css/`
  and Jekyll copies `docs/` wholesale, so they publish.

No live `blv9`. What is missing is that nothing would notice if a generator
stopped writing one.

### The mechanism `6f1x` said it lacked now exists

`6f1x`'s blocker was that the script *"cannot see whether the site build wrote
a file into `_site/`"*. Bean `dyd3` built exactly that reader:
`siteOutputs()` in `scripts/tests/bootstrap-graph.test.ts` extracts every
`--out` path from a workflow and expands its `print-stub` captures.

**Coverage needs BOTH halves**, which the measurement above is what shows:

1. artefacts written by a workflow `--out` — `siteOutputs` reads these today
2. artefacts committed under `docs/` and copied verbatim by Jekyll — the two
   CSS files, invisible to a workflow scan

A check built on (1) alone would report the two CSS claims as unproduced and
be wrong about both, which is the same over-narrow reading `6f1x` was opened
to correct, in the opposite direction.

## Done when — updated

- [ ] `skill.update` is disambiguated, because 1–3 may be scoped by it
- [ ] `tool` is a QA subject kind, with at least one criterion, and the 69
      nodes are reported rather than skipped — including a third state for a
      tool the criterion cannot judge
- [x] Whether `check-declared-assets` reaches Tool nodes is MEASURED — it does
      not, the relation is `maintains`, and the gap is `6f1x`'s, now doubled
      from 2 uncovered artefacts to 4
- [ ] The pre-execution security gate has a consumer, and a test that fails
      when the consumer stops consulting it
- [ ] `0grh` is read against requirement 4


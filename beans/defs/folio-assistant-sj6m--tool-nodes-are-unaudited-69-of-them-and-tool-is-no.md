---
# folio-assistant-sj6m
title: 'TOOL NODES ARE UNAUDITED: 69 of them, and `tool` is not a QA subject kind — plus assets, a pre-execution security gate, and subprocess dispatch'
status: todo
type: task
priority: normal
created_at: 2026-09-22T06:48:03Z
updated_at: 2026-09-22T06:48:27Z
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

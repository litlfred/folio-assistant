---
# folio-assistant-w8jq
title: 'MERGE GATE (a): adversarial agentic code review is a required check on any agent-touched PR, with a committed verdict'
status: todo
type: task
priority: normal
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-03T08:11:58Z
parent: folio-assistant-nok9
---

Child (a) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §5.1–5.3.

The gate: any PR whose commits carry agent provenance (a `Co-Authored-By: Claude …` or `Claude-Session:` trailer, a `claude/` head branch, or a bot author) gets a **full adversarial code review by an agent that did not author it**. That review writes a committed verdict, and a required status check reads the verdict.

It replaces the dispatch-only, post-merge `.github/workflows/agent-review.yml`. That workflow truncates the diff at 50,000 characters, and its prompt still points at the QOU PDF.

## Done when
- [ ] provenance detection is specified and tested, including the negative case: a human-only PR must not be required to carry a review
- [ ] the reviewer is independent of the author, recorded by session id and model, and the review runs on the PR **head SHA**; a new push invalidates it
- [ ] the review covers the whole diff, with no silent truncation; a diff too large to review is `unknown` and blocks, it is not `pass`
- [ ] the verdict is a sidecar (schema extends `kg-qa` / `qa-review`, see child (c)), and a required check reads it
- [ ] it composes with merge trains: the review is per-PR on the head; the train re-checks only the compile gates on the combined result
- [ ] `code-change-review.bpmn` Task_Review names the adversarial review skill, and `prepare-merge` checks the verdict

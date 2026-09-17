The diagram above shows the full CRDM workflow as a BPMN 2.0 collaboration
with three swim lanes:

- **Requestor / stakeholder** — submits the request, reviews the synthesised
  needs and requirements, signs off, reviews PRs, and does final feature
  sign-off on the issue.

- **Agent** — detects the feature request, scans for matching issues, runs
  through the six CRDM phases, creates beans, implements on feature branches,
  posts summaries to the issue.

- **Platform** — automated CI gates (`content_validate`, `qa_sweep`,
  code-quality gates) that verify each PR.

Two feedback loops are visible:

1. **Needs loop** (Phases 1–2) — the agent synthesises needs and the
   requestor reviews; if revisions are needed, the agent re-synthesises.

2. **Requirements loop** (Phases 3–4) — the agent defines requirements and
   impact analysis; the requestor reviews; iterate until approved.

3. **Implementation loop** (Phase 6) — the agent implements, posts a summary
   to the issue, the requestor reviews the PR; iterate until all beans are
   resolved.

Each loop's review happens **on the GitHub issue**, making the process
transparent, persistent, and accessible to stakeholders who join later.

See the [agentic harness](../agentic-harness.html) page for how this
workflow fits into the broader agent–user interaction model.

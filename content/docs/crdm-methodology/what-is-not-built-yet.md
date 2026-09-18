This page documents the methodology; the skills and tooling that implement it
are in various stages of development. What follows is checked against the
repository rather than against intent — a gap list that goes stale is worse
than none, because it sends a reader looking for something that is already
there, or lets them assume something exists because nobody updated the list.

**Built since this page was first written:**

- **CRDM detection skill** — [`skills/folio-core/crdm-detect.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/crdm-detect.md)
  gives the agent five categories of detection phrasing, an explicit "what is
  *not* a feature request" list, and the session-state rules (new session,
  existing session already in the process, existing session doing content
  work). The judgement is written down; it is not yet *measured*, so see the
  caveat below.
- **BPMN diagram of the process itself** —
  [`docs/workflows/crdm-requirements.bpmn`](https://github.com/litlfred/folio-assistant/blob/main/docs/workflows/crdm-requirements.bpmn),
  with lanes for the BA / feature requestor, the agent, and stakeholders.
- **The six-phase workflow as a skill** —
  [`skills/folio-core/crdm-requirements-workflow.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/crdm-requirements-workflow.md),
  including the actors table and the issue-association rules.

**Not yet implemented:**

- **Structured requirements templates** — no MCP tool scaffolds the CRDM
  phases into a GitHub issue. The structure described above is written by
  hand each time.
- **`crdm_start` / `crdm_status` MCP tools** — there is no way to ask the
  platform which phase a cycle is in. `grep -ri crdm src/` returns nothing:
  the process is documented and skilled, but it is not *instrumented*, so
  "where are we" is answered by reading the issue.
- **Automated impact analysis** — the agent can read the content graph and
  the schema files, but no dedicated tool produces an impact report for a
  proposed change.
- **Stakeholder mapping** — no automated discovery of affected roles or
  folios from a change description.
- **Review triage tooling** — ingesting a Word document with comments and
  presenting them for structured triage is tracked in
  [#197](https://github.com/litlfred/folio-assistant/issues/197).

**Built but unverified**, which is a third state and not a milder form of
"built": the detection skill has never been measured against real requests.
Nobody has taken a sample of issues and chat openings and checked how often
it fires when it should, or fires when it should not. Until that happens the
honest claim is that the guidance exists, not that detection works.

**Tracked in:** [#203](https://github.com/litlfred/folio-assistant/issues/203)

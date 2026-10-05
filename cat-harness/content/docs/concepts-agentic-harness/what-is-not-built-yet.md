- **Workflow state persistence** — the harness describes workflow suspension
  and resumption, but there is no mechanism to persist the agent's workflow
  state across sessions. Today this relies on beans and issue comments as
  proxies.

- **Automated request classification** — the classification table is a
  reference for agents to read; there is no classifier tool that routes
  automatically.

- **BPMN for beans lifecycle** — the beans work-plan has a lifecycle (create →
  claim → in-progress → resolve) that is discussed in `AGENTS.md` and the
  todo-manager skill but has no BPMN diagram.

- **BPMN for the agentic harness itself** — a top-level BPMN diagram showing
  the idle/workflow state machine and the classification routing is not yet
  authored.

- **Session handoff protocol** — the rules for what to commit before a session
  ends are in `AGENTS.md`, but there is no structured handoff artefact that a
  new session can read to resume exactly where the previous one left off.

**Tracked in:** [#203](https://github.com/litlfred/folio-assistant/issues/203)

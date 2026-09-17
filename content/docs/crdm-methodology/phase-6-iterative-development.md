Once the requirements are signed off and beans are created, the agent enters
the normal development cycle — but with the CRDM artefacts as guardrails.

**How the development cycle uses CRDM artefacts:**

1. **Bean-driven work** — each bean references the parent issue and its
   specific requirement. The agent claims a bean, implements it, opens a PR,
   and links both.

2. **PR review against requirements** — reviewers check not just "does the code
   work?" but "does it satisfy the requirement stated in the issue?" The
   acceptance criteria from Phase 3 are the review checklist.

3. **Testing against the workflow** — the redesigned workflow from Phase 2
   should be testable after implementation. Does the ingestion pipeline now
   handle Word documents? Can a reviewer triage 200 comments through the new
   tool?

4. **Feedback loops** — after initial testing, users provide feedback. If the
   feedback reveals new requirements or missed cases, a new iteration of the
   CRDM phases is triggered — but scoped: only the affected requirement is
   re-assessed, not the entire feature.

5. **Documentation update** — when the feature lands, the documentation pages
   (these structured `.ts`/`.md` pages under `content/docs/`) are updated to
   reflect the new capability. Workflow BPMN diagrams are updated if the
   pipeline changed.

6. **Close the loop** — when all beans for the feature are resolved, the agent
   closes the parent issue with a summary of what was delivered and any
   deferred items. Deferred items become new issues for future CRDM cycles.

This is the process that the discussion around issue
[#197](https://github.com/litlfred/folio-assistant/issues/197) proposed to
generalise: create MVP tooling → test → refine → deploy. CRDM gives that
process a name and a structure so it can be repeated for any feature request —
whether it is Word document import, Harvard document engine workflows, HRH
handbook adaptation, or country-level review SOPs.

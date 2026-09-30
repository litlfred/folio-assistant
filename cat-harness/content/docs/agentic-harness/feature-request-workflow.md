When a request is classified as a feature request, the agent enters the
**CRDM requirements workflow**
([full documentation](https://litlfred.github.io/folio-assistant/crdm-methodology.html),
[BPMN](../processes/crdm-requirements.bpmn)).

The feature-request workflow is where this harness document adds the most
value, because it describes a behaviour that was previously implicit. The
authoring and review workflows have been documented for months; the
requirements workflow existed only as ad-hoc conversation.

### How the agent enters CRDM

The detection logic is in [`skills/crdm/crdm-detect.md`](../skills/crdm/crdm-detect.md).
Three scenarios:

**New session, first request is a feature:**
→ Acknowledge, explain you will help work through requirements first, enter
Phase 1.

**Existing session, already in CRDM:**
→ Incorporate the new request into the current requirements document, continue.

**Existing session, doing content work:**
→ Synthesise the feature need, ask user whether to pause content work and
address it now or bean it for later.

### What the user sees

The agent does **not** say "entering CRDM mode" or use methodology jargon.
Instead:

> "This sounds like a platform change — something we'd need to add to
> folio-assistant itself. Before I build anything, let me help you work through
> exactly what's needed so we get it right. I'll document the requirements on
> the issue so others can weigh in."

### How the agent exits CRDM

The CRDM workflow exits when:
- All beans from the signed-off requirements are resolved, OR
- The user explicitly defers the remaining work

On exit, if a content workflow was suspended, the agent resumes it.

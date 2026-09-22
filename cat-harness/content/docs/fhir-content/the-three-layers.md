WHO SMART Guidelines names three layers, and they are the clearest available
vocabulary for FHIR content generally:

| layer | what it holds | form |
|---|---|---|
| **L1** | narrative guidance — the publication a recommendation comes from | prose, figures, tables |
| **L2** | the Digital Adaptation Kit — personas, business processes, decision logic, data elements | BPMN, DMN, structured tables |
| **L3** | the FHIR Implementation Guide | FSH → FHIR resources |

**They are layers, not stages, and the difference is load-bearing.** A stage
model says each is produced from the one before and then left behind. In
practice all three are live at once: an L2 decision table and the L3
`PlanDefinition` derived from it both exist, both are published, and both can
change. Treating L2 as scaffolding that L3 replaces is how a decision table
and its FHIR representation drift apart with nothing to notice.

It is also why an instance may hold any one of the three without the others.
An L1 corpus with no DAK behind it is a real thing; so is an IG with no L1.

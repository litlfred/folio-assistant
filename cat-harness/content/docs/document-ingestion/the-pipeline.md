Four things in that diagram are worth reading closely.

**The Ingestion Engine is an actor, not a script.** It runs unattended. A drop
during an editing session triggers ingestion in the background — the
contributor does not wait for it, and nothing about the editing flow blocks on
it.

**The failure edge is a bean, not a log line.** When the completeness gate finds
a missing derived artefact, the engine opens a bean and the document **stays in
`uploads/`**. It does not land half-ingested in `library/` looking finished.

**Each subprocess is its own file**, called with `bpmn:callActivity` and
declared with `bpmn:import`. Open any of them on its own in bpmn.io; the parent
stays readable because it does not inline them.

**The end is where authoring begins.** "Available to cite as an L1 source" is
the hand-off into [the publication workflow](publication-workflow.html) — the
same corpus an author edits and a reviewer reviews.

| Artifact | Skill | Format |
|----------|-------|--------|
| Business processes | [`bpmn-authoring`](../reference/skills/bpmn-authoring.html) | BPMN 2.0 XML |
| Decision logic | [`dmn-authoring`](../reference/skills/dmn-authoring.html) | DMN tables |
| Data dictionary | [`l2-dak-authoring`](../reference/skills/l2-dak-authoring.html) | Excel / structured |
| Terminology | [`terminology-management`](../reference/skills/terminology-management.html) | code systems / value sets |
| Review | [`content-review`](../reference/skills/content-review.html) | criteria-based |

The table is the authoring skills, not the DAK. A DAK has **nine components**,
per the SMART Base 1.0.0 logical model `DAK` (*"a complete Digital Adaptation
Kit with metadata and all 9 DAK components"*). They were eight until
scheduling logic was split out of decision-support logic. Against the skills
above:

| # | DAK component | covered above by |
|---|---|---|
| 1 | Health interventions and recommendations | — (cites L1) |
| 2 | Generic personas | — |
| 3 | User scenarios | — |
| 4 | Business processes and workflows | `bpmn-authoring` |
| 5 | Core data elements | `l2-dak-authoring`, `terminology-management` |
| 6 | Decision-support logic | `dmn-authoring` |
| 7 | Scheduling logic | `dmn-authoring` (decision tables) |
| 8 | Indicators and monitoring | — |
| 9 | Functional and non-functional requirements | — |

A dash means *no skill in this table*. It does not mean no skill anywhere. It
is where to look before starting a component. Source: slide 3 of
`cat-harness/library/kg-folio-asst-2026-09-30`, which reproduces WHO's
nine-card figure. The speaker notes on that slide still say "8 components".
Trust the figure and the logical model over the notes.

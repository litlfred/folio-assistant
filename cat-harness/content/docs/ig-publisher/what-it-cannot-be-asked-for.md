The Publisher exports metadata about what it built, and those exports have a
measured ceiling. Using them as a stand-in for a syntax tree, across two real
WHO IGs:

| export | smart-trust | smart-immunizations |
|---|---|---|
| `valueset-ref-list.json` ValueSet→CodeSystem edges | 17 over 14 | 431 over 252 |
| `codesystem-ref-list.json` `uses` populated | 0 of 15 | 0 of 14 |
| `usage-stats.json` extension→path | 6 | 35 (+5 profiles) |

Two findings, and the second is the one that constrains everything built on
top:

**`uses` is declared and never populated**, in both IGs. A declared-and-empty
field is worse than an absent one, because a consumer cannot tell "no
dependencies" from "not computed".

**Nothing exports dependencies among `Library`, `PlanDefinition` or
`Measure`.** In `smart-immunizations` that is 279 + 138 + 41 artefacts —
around **61 %** of the IG, and precisely the CQL and decision-logic core —
with no dependency edges at all.

So the metadata reaches **terminology** dependencies and structurally cannot
reach the **logic** layer. Anything that needs to know what a decision depends
on has to get it from somewhere else. That is the case for an AST emitted by
the tool itself, and the reason a fork of the publisher alone would not be
enough: dependency loading happens in `org.hl7.fhir.core`.

Re-derive these numbers rather than quoting them. They are properties of two
IGs at two versions, and a Publisher release can close either gap.

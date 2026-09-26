# smart-dak

The **L2** layer — the Digital Adaptation Kit, and the harness every WHO
`smart-*` DAK instantiates.

| in | out |
|---|---|
| DAK components: personas, processes, decision logic, data elements | the guideline narrative they derive from → `smart-l1` |
| BPMN and DMN authoring, and the transforms over them | FHIR profiles and the IG build → `smart-ig` |
| the DAK-shaped pre-processing | the SMART rules and the DAK logical model → `smart-base` |

`dak.config.json` at a repository root is what declares a repository a DAK —
ours since bean `cz17`, renamed from `dak.json` on 2026-09-22. WHO's
`smart-base` still writes the old spelling, and that divergence is deliberate
pre-work rather than a bug.

## Open

The nine DAK Tool nodes are in `smart-base/tools/`, placed there on a direct
instruction given before this layer existed. Whether they move is
[#975](https://github.com/litlfred/folio-assistant/issues/975)'s question, not
this README's answer.

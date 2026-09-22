Ten exclusive gateways sit across the six diagrams, and they are not all the
same kind of question. `Accept, revise or discard?` is the editor's call.
`Build green, no sorries?` is arithmetic over `lean_build` and `proof_status`.

A gateway carrying `<folio:decision ref="decisions/x.dmn#Decision_Id"/>` has its
outcome computed from a **DMN decision table** under
[`processes/decisions/`](https://github.com/litlfred/folio-assistant/tree/main/processes/decisions).
The agent supplies facts — `{ failCritical: 0, failMajor: 2 }` — and the table
returns the branch; `workflow_complete` refuses a hand-supplied outcome there,
and records which rule fired.

| Gateway | Table | Reads |
|---|---|---|
| `Build green, no sorries?` | `lean-build-gate.dmn` | `buildOk`, `deferredSorries` |
| `Draft QA green?` | `draft-qa-gate.dmn` | `failCritical`, `failMajor` |

`QC clean?` and `FHIR valid?` are equally mechanical and equally deserve
tables — they wait on a WHO/FHIR adapter, because a table keyed to facts no
tool emits looks authoritative and is not.

<!-- kg:subgraph:begin -->
# folio-assistant-sci-skill-definitions

The mathematical-paper workflow-skill definitions this layer owns (latex-authoring, lean-formalization, proof-verification): JSON SkillDefinitions.

Part of [folio-assistant-sci](../../README.md). Not declared on its own: readers find a `skill-definitions/` directory inside the declared `skills` directory by convention.

| file | what it is | used by |
|---|---|---|
| [`latex-authoring.json`](latex-authoring.json) | Author and compile LaTeX documents including papers, reports, and presentations. |  |
| [`lean-formalization.json`](lean-formalization.json) | Formalize mathematical content in Lean 4, creating verified proofs from source material. |  |
| [`proof-verification.json`](proof-verification.json) | Verify Lean 4 proofs, track sorry obligations, and report build diagnostics. |  |
<!-- kg:subgraph:end -->

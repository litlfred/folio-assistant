---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s502-16-8-2-3-relationship-between-digitalsourcetype-
section_title: "16.8.2.3. Relationship Between `digitalSourceType` and `humanOversightLevel`"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9935-9948
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.8.2.3. Relationship Between `digitalSourceType` and `humanOversightLevel`

The `c2pa.ai-disclosure` assertion is designed to complement existing C2PA signals rather than replace them. In particular, `c2pa.actions` and `digitalSourceType` already provide a strong foundation for recording how an asset was created or modified. What this assertion introduces are three critical provenance primitives not previously captured in the ecosystem: model provenance — full disclosure of the AI models used for maximum transparency; scientific routing metadata — surfacing the discipline and sensitivity of the content domain; and human oversight level — a structured signal of the degree of human involvement practised during the generation pipeline.

Since there may be a perceived overlap between `digitalSourceType` and `humanOversightLevel`, the table below is intended to disambiguate the two — both serve different but complementary purposes.

| `digitalSourceType` | `humanOversightLevel` | Interpretation |
| --- | --- | --- |
| `trainedAlgorithmicMedia` | `fully_autonomous` | Pure AI generation, no human review |
| `trainedAlgorithmicMedia` | `prompt_guided` | AI generation guided by human prompts — moderate human involvement |
| `compositeWithTrainedAlgorithmicMedia` | `human_validated` | AI edits applied and reviewed/approved by a human editor prior to release |
| `digitalCreation` | **not applicable** | No trained model invoked; AI Model Disclosure assertion is not attached |

<a id="_schema_and_example_22"></a>

---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s503-16-8-2-4-schema-and-example
section_title: "16.8.2.4. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9949-10029
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.8.2.4. Schema and Example

The schema for this type is defined by the `ai-model-disclosure-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.14, “AI Disclosure”](#cddl_annex_ai_disclosure) for the complete normative schema):

```cddl
; CDDL Schema for AI Model Disclosure Metadata
ai-model-disclosure-map = {
  "modelType": $model-type-choice, ; this is an enumeration of AI model types
  ? "modelName": tstr, ; human-readable name of the AI model used

  ; unique identifier of the AI model used (e.g., a URI, PURL, etc.)
  ? "modelIdentifier": tstr,

  ; this is a structured object that describes the content profile of the AI
  ; model used, including human oversight level and other relevant information
  ? "contentProfile": content-profile-map,
  ? "scientificDomain": [+ $scientific-domain-string], ; list of domain values

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map
}

$model-type-choice /= tstr

; Values from the arXiv taxonomy, e.g., ["cs.AI", "physics.optics"]
$scientific-domain-string /= tstr .regexp "^[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$"

; Content Profile Definition
content-profile-map = {
  ? "humanOversightLevel": human-oversight-enum
}

; Human oversight level: used by claim generators to declare the degree of human
; involvement in the generation pipeline. Consumed by validators for automated
; routing and risk decisions.
; "fully_autonomous" -> no human review after model output (highest scrutiny)
; "prompt_guided" -> human provided prompts/config but no final approval
; (moderate scrutiny)
; "human_validated" -> human reviewed/approved final output prior to release
; (reduced automated scrutiny when attested)
human-oversight-enum =
  "fully_autonomous" /
  "prompt_guided" /
  "human_validated"

; The remaining fields for the AI model disclosure metadata are pending
; further specification and will be added once descriptions and requirements are
; provided.

; Pending fields for ai-model-disclosure-map (uncomment when descriptions are
; provided):
; modelFrontier: bool
; trainingCleared: bool

; Pending fields for content-profile-map (uncomment when descriptions are
; provided):
; category: tstr
; harmEvaluation: harm-evaluation-object
; evaluationMethod: tstr
; evaluationDate: tdate

; Harm Evaluation (structured object)
; harm-evaluation-object = {
; * tstr => any
; }
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below. In this example, the asset is a TensorFlow model file of version 2.11.0 which is stored in the SavedModel format.

```none
{
	"modelType": "c2pa.types.model.huggingface.transformers",
	"modelIdentifier": "pkg:huggingface/meta-llama/Llama-2-70b-chat-hf@main",
	"contentProfile": {
		"humanOversightLevel": "fully_autonomous"
	},
	"scientificDomain": ["astro-ph.CO"]
}
```

<a id="_assertion_supporting_structures"></a>

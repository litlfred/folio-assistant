---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s246-sampling-parameters
section_title: "Sampling Parameters"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 629-643
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
### Sampling Parameters

LLM sampling can be fine-tuned with the following parameters:

- `temperature`: Controls randomness in model responses. Higher values produce higher randomness, and lower values produce more stable output. Valid range depends upon the model provider.
- `maxTokens`: Maximum tokens to generate; required.
- `stopSequences`: Array of sequences that stop generation.
- `metadata`: Additional provider-specific parameters.

The client **MUST** respect the `maxTokens` parameter.

The client **MAY** modify or ignore `temperature`, `stopSequences` and `metadata`. For
example, a client could use a model that does not support one or more of these parameters,
and would therefore be unable to leverage them.

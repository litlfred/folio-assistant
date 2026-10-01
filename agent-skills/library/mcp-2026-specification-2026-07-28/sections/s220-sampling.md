---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s220-sampling
section_title: "Sampling"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 1-25
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
---
title: Sampling
---

<div id="enable-section-numbers" />

<Warning>
  **Deprecated**: The Sampling feature is deprecated as of protocol version
  `2026-07-28`
  ([SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)).
  Under the [feature lifecycle policy](/community/feature-lifecycle), it remains
  in the specification for at least twelve months after this revision's release
  before it becomes eligible for removal. New implementations **SHOULD NOT**
  adopt it; existing implementations **SHOULD** migrate to integrating directly
  with LLM provider APIs. See the [deprecated features
  registry](/specification/2026-07-28/deprecated).
</Warning>

The Model Context Protocol (MCP) provides a standardized way for servers to request LLM
sampling ("completions" or "generations") from language models via clients. This flow
allows clients to maintain control over model access, selection, and permissions while
enabling servers to leverage AI capabilities&mdash;with no server API keys necessary.
Servers can request text, audio, or image-based interactions and optionally include
context from MCP servers in their prompts.

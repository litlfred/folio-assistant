---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s390-16-4-1-4-4-softwareagent
section_title: "16.4.1.4.4. SoftwareAgent"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6752-6762
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.4.4. SoftwareAgent

The software or hardware used to perform the action can be identified via the `softwareAgent` field. In a v1 action, this is a simple text string. However, for v2, `softwareAgent` uses the richer `generator-info-map` structure as described in [Section 10.2.3.2, “Generator Info Map”](#_generator_info_map). When multiple softwareAgents are used, as described in [Section 16.4.1.6.2, “SoftwareAgents”](#_softwareagents), then the `softwareAgentIndex` field shall be used to reference the softwareAgent by its 0-based index in the `softwareAgents` array. A given action shall only have one `softwareAgent` or `softwareAgentIndex` field.

> **NOTE:**
> These fields are useful for when the `softwareAgent` is not the same program as the claim generator.

> **NOTE:**
> An earlier version of this specification also included an `actors` field, however this was removed in version 2.0.

<a id="_digital_source_type"></a>

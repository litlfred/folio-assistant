---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s377-16-3-7-3-1-bindingmetadata
section_title: "16.3.7.3.1. bindingMetadata"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6342-6351
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.7.3.1. bindingMetadata

A soft binding assertion may include a `bindingMetadata` key that provides for the specification of some algorithm or workflow-specific information via some pre-defined as well as custom fields (and their associated values). Custom fields shall conform to the same syntax as [entity-specific namespacing](#_namespacing), e.g. `com.litware.someFieldName`.

> **NOTE:**
> This is useful for providing extra information that would be useful to a specific workflow or C2PA Manifest Consumer.

A C2PA Validator should not use this information when validating the soft binding, but may use it for logging or informational purposes. The normative information for validating the soft binding is contained in the other fields of the soft binding assertion as well as the entry for the algorithm in the [Soft Binding Algorithm List](#_soft_binding_algorithm_list).

<a id="_soft_binding_algorithm_list"></a>

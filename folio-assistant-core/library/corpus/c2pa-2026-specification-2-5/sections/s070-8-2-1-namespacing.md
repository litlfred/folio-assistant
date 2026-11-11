---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s070-8-2-1-namespacing
section_title: "8.2.1. Namespacing"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 823-843
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 8.2.1. Namespacing

String values in C2PA data structures may be organized into namespaces using a period (`.`) as a separator. The C2PA namespace, `c2pa`, shall be the beginning of any string value defined in this specification. In addition to the `c2pa` namespace, the [C2PA namespace registry](https://github.com/c2pa-org/reserved-namespaces/blob/main/namespaces.yml) lists other top-level namespaces.

Entity-specific namespaces, meaning any namespace other than `c2pa` or those on the registry, shall begin with the Internet domain name for the entity, beginning with a valid [IANA top-level domain](https://data.iana.org/TLD/tlds-alpha-by-domain.txt), similar to how Java packages are defined (e.g., `com.litware`, `net.fineartschool`).

> **NOTE:**
> The purpose of the entity-specific namespace is to avoid collisions between labels defined by different entities. For example, if two different entities define a label called `metadata`, the use of that format for entity-specific namespaces allows them to be easily distinguished as `com.litware.metadata` and `net.fineartschool.metadata`.

The period-separated components of an entity-specific namespace shall follow the variable naming convention (`[a-zA-Z0-9][a-zA-Z0-9_-]*`) specified in the POSIX or C locale, as defined in the ABNF below ([ABNF for Namespaces](#abnf_for_namespaces)).

ABNF for Namespaces

```abnf
qualified-namespace = "c2pa" / registered-namespace / entity
registered-namespace = <a namespace listed in the C2PA namespace registry>
entity = entity-component *( "." entity-component )
entity-component = 1( DIGIT / ALPHA ) *( DIGIT / ALPHA / "-" / "_" )
```

<a id="_label_naming"></a>

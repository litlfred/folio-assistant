---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s415-16-4-3-1-description
section_title: "16.4.3.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7742-7756
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.3.1. Description

Many container formats embed URI references to external resources (for example, scripts and stylesheets in HTML, or texture files in MaterialX scenes) but provide no native mechanism to hash-bind those dependencies. A linked resource integrity assertion provides cryptographic hash coverage for such externally referenced resources, supplying the equivalent of W3C Subresource Integrity ([Subresource Integrity Level 2](https://www.w3.org/TR/2026/WD-sri-2-20260320/)) for formats that do not natively support that concept.

The `resources` field is an object containing either an `externalResources` array or a `relativeResources` array. Each entry in `externalResources` is a `hashed-ext-uri-map` identifying an external resource by absolute URL, with its own `alg` field. Each entry in `relativeResources` is a `uri-hashed-data-map` identifying a resource by a URI relative to the asset; a single `alg` field alongside the `relativeResources` array applies to all of its entries. In either case, a hash (computed using the applicable `alg`) of the resource’s content at the time of signing is present, and the `url` or `uri` field (respectively) in each entry identifies the resource as it is referenced by the container format. The optional `dc:format` and `data_types` fields on each entry may be used to describe the media type and kind of the referenced resource.

A relative URI in the `relativeResources` array shall be resolved according to the resolution rules of the container format in which the asset is embedded, using the location of the asset itself as the base URI. If a validator cannot determine the location of the asset (and therefore the base URI), it shall treat every entry in the `relativeResources` array as unresolvable; it shall not substitute a working directory or any other implementation-specific default as the base URI.

A linked resource integrity assertion shall have a label of `c2pa.linked-resource-integrity`. When present, a linked resource integrity assertion shall only appear in `created_assertions` (see [Section 10.3.2.1, “Adding Assertions and Redactions”](#_adding_assertions_and_redactions)).

The optional `allURIsIncluded` field, when set to `true`, indicates that every URI reference directly encoded in the container format whose processing model causes the referenced resource to be fetched or embedded (for example, a `<script src>` or `<img src>` reference in HTML) is covered by an entry in the `externalResources` or `relativeResources` array. A purely navigational reference (for example, an HTML `<a href>` hyperlink) and a reference to the C2PA manifest itself are not counted for this purpose. `allURIsIncluded` describes only references the signer can enumerate at signing time: it does not extend to resources that are only discoverable transitively (for example, a URI referenced from within a fetched CSS file, the contents of an `<iframe>` document, or a request generated at runtime by script), even if those resources are themselves fetched or embedded when the asset is processed. When `allURIsIncluded` is `false` or absent, the signer is indicating that additional unrecorded URI references may exist in the asset. Manifest consumers should interpret an absent `allURIsIncluded` field as indicating that additional URI references may exist.

The C2PA specification does not require validators to perform network retrieval. Validation of the hashes in this assertion is therefore optional. See [Section 14.10.4.2.3, “`c2pa.linked-resource-integrity` validation”](#_c2pa_linked_resource_integrity_validation).

<a id="_schema_and_example_11"></a>

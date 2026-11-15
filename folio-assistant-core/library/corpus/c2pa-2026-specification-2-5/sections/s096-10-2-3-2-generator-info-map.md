---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s096-10-2-3-2-generator-info-map
section_title: "10.2.3.2. Generator Info Map"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1362-1389
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 10.2.3.2. Generator Info Map

When adding a `claim_generator_info` field, its value is a `generator-info-map` object which shall contain a `name` field. It may also contain either a `version` field or an `icon` field or both. In addition, any other field is permitted, using the standard entity-specific namespacing described in [Section 8.2.1, “Namespacing”](#_namespacing). The data in this object shall represent the non-human (hardware or software) actor that actually generated the claim (aka the claim generator itself).

A claim generator may desire to provide a graphical representation of itself, referred here as an `icon`, to a Manifest Consumer that is presenting a user experience. The value of the `icon` field, if present, shall be a [hashed URI](#_hashed_uris). This hashed URI shall be to an [embedded data assertion](#_embedded_data) whose label is `c2pa.icon` and follows the [rules of assertion labels](#_multiple_instances) with respect to multiple instances. Manifest Consumers should also support the [data box](#_data_boxes) approach recommended by earlier versions of this specification.

> **NOTE:**
> As with the assertions array, the hash algorithm used for a [hashed URI](#_hashed_uris) is determined by the `alg` field present in the hashed URI, or when absent, by an `alg` field in the claim.

A `specVersion` field should be present, and if so, shall contain a SemVer formatted `specVersion` field representing the version of this specification used as the normative reference by the Claim Generator to create this C2PA Manifest (e.g., "2.4.0" for version 2.4). Validators should treat this field as purely informational and should not change their validation logic based on this value.

Example using claim generator info

```json
{
	"claim_generator_info" : {
		"name": "Acme C2PA SDK",
		"version": "2.0",
		"icon": {
			"url": "http://cdn.examplephotoagency.com/logo.svg",
			"hash": "5bdec8169b4e4484b79aba44cee5c6bd"
		},
		"specVersion": "2.4.0"
	}
}
```

<a id="_creating_a_claim"></a>

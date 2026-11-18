---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s114-11-1-overview
section_title: "11.1. Overview"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1539-1550
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.1. Overview

Within C2PA, individual statements about an asset are declared as [assertions](#_assertions). A C2PA Manifest is a container that bundles together an [assertion store](#assertion-store-arch) holding those assertions, a [claim](#_claims) that hashes the assertions and provides information about the [claim generator](#claim-generator-definition), and a [claim signature](#_digital_signatures) over that claim. The C2PA Manifest that describes the asset is called the [active manifest](#_active_manifest). Because assets can be built from [ingredients](#_adding_ingredients) that have their own manifests, there may be multiple manifests associated with the asset. These C2PA Manifests are collected into a single container called the [C2PA Manifest Store](#_manifest_store).

A [standard C2PA Manifest](#_standard_manifests) includes a [hard binding](#_binding_to_content) that cryptographically associates the C2PA Manifest with the asset.

> **NOTE:**
> This means that copying or linking a C2PA Manifest to a different asset is detectable and will fail validation.

The technical details of how the various parts of a C2PA Manifest are serialized can be seen in [Section 11.5, “Serialization”](#_serialization).

<a id="_manifest_store"></a>

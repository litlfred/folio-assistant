---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s403-16-4-1-9-asset-renditions
section_title: "16.4.1.9. Asset Renditions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7048-7056
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.9. Asset Renditions

Asset renditions are a common occurrence when distributing media on the internet. These renditions are often created for the purpose of delivering media to consumers in differing connectivity, screen resolution, and other environments. We can use the `actions` assertion to help consuming actors understand the intention of certain claim creators to create asset renditions.

The presence of only `c2pa.published`, `c2pa.transcoded` and `c2pa.repackaged` actions in a `c2pa.actions` assertion provides a signal to the Manifest Consumer that the signer is asserting that no [editorial changes](#editorial-transformation-definition) to the [digital content](#_digital_content) have happened between the ingredient asset(s) and this one.

The additional presence of a single "parentOf" ingredient provides a further signal to the Manifest Consumer that the signer is asserting that the asset has been derived directly from that parent.

<a id="_soft_binding_lookup"></a>

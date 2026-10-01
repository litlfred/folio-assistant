---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-019-222-part-of-property
section_title: "Part Of Property"
section_number: 2.2.2
pages: 9-9
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The partOf property is used to identify an AssetCollection that an Asset resource is a member of. The purpose is to explicitly
express membership relationships between Assets and AssetCollections. This enables a Rule that is related to an AssetCollection
to understand which individual Assets the Rule may apply to. In addition, the Asset/AssetCollection membership relationships
may potentially detect conflicts in Rules.
Example Use Case: The below snippet shows some Dublin Core metadata describing a document. The odrl:partOf
property asserts that the Asset http://example.com/asset:111.doc is a member of the
http://example.com/archive1011 AssetCollection which is used in the Policy in the example above. This means
that http://example.com/asset:111.doc is one of the target Assets in the Policy and can my indexed.

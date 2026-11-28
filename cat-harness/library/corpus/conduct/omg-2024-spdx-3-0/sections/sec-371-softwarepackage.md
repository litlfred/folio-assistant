---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-371-softwarepackage
section_title: "/Software/Package"
section_number: null
pages: 195-196
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
3. rootElement (may be multiple), SHOULD be objects of type /Software/Package
4. spdxId
• Recommended
1. sbomType (may be multiple)
D.2.3
/Software/Package
• Mandatory
1. copyrightText
2. creationInfo
3. name
4. packageVersion
System Package Data Exchange (SPDX©) v3.0
183
5. spdxId
6. suppliedBy, SHOULD be an object of type /Core/Agent
• Recommended
1. attributionText (may be multiple)
2. builtTime
3. comment
4. downloadLocation
5. homepage
6. originatedBy (may be multiple), SHOULD be objects of type /Core/Agent
7. packageUrl
8. releaseTime
9. supportLevel (may be multiple)
10. validUntilTime
11. verifiedUsing (may be multiple), SHOULD be objects of type /Core/Hash
However, there MUST be at least a “downloadLocation” or “packageUrl” property.
Additionally:

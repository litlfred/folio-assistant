---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
The PROV-
JSONLD
Serialization
A JSON-LD Representation for the PROV Data Model
W3C Member Submission 25 August 2024
More details about this document
This version:
https://www.w3.org/submissions/2024/SUBM-prov-jsonld-20240825/
Latest published version:
https://www.w3.org/submissions/prov-jsonld/
Latest editor's draft:
https://www.w3.org/submissions/2024/SUBM-prov-jsonld-20240825/
History:
https://github.com/openprov/prov-jsonld/commits/
Editors:
Luc Moreau (King's College London)
Dong Huynh (King's College London)
Feedback:
GitHub openprov/prov-jsonld (pull requests, new issue, open issues)
Copyright © 2016-2024 World Wide Web Consortium. W3C® liability, trademark and W3C Document License rules apply.
Abstract
Provenance is information about entities, activities, and people involved in producing a piece of data
or thing, which can be used to form assessments about the data or thing's quality, reliability or
trustworthiness. PROV-DM is the conceptual data model that forms a basis for the W3C provenance
(PROV) family of specifications. This document specifies PROV-JSONLD, a serialization of PROV in
JSON, which exploits JSON-LD to define a semantic mapping so it can also be processed as Linked
Data. Overall, PROV-JSONLD is designed to be suitable for interchanging provenance in Web and
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
1/71

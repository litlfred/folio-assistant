---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
Ontology [PROV-O]. The latter is most suitable for Linked Data [LINKED-DATA], given that it can
readily be consumed by existing Semantic Web tools and comes with the semantic grounding provided
by PROV-O [PROV-O].
Subsequently, the PROV-JSON [PROV-JSON] serialization has gained traction, despite simply being
a member submission, and not having gone through the various stages of a standardization activity.
We conjecture that the primary reason for this is that many web applications are built to be light-
weight, working mainly with simple data formats such as JSON [RFC8259].
The very existence of all these serializations is a testament to the approach to standardization taken by
the Provenance Working Group, by which a conceptual data model for PROV was defined, the PROV
data model [PROV-DM], alongside its mapping to different technologies, to suit users and developers.
However, the family of PROV specifications lacks a serialization capable of simultaneously
addressing all of the following requirements.
1. [Lightweight] A serialization MUST support lightweight Web applications.
2. [Natural] A serialization MUST look natural to its targeted community of users.
3. [Semantic] A serialization MUST allow for semantic markup and integration with linked data
applications.
4. [Efficient] A serialization MUST be efficiently processable.
In our view, none of the existing PROV serializations supports all these requirements simultaneously.
While PROV-JSON is the only serialization to support lightweight web applications, it does not have
any semantic markup, its internal structure does not exhibit the natural structure of the PROV data
structures, and its grouping of expressions per categories (e.g. all entities, all activities, ...) is not
conducive to incremental processing. The RDF serialization compatible with PROV-O has been
architected to be natural to the Semantic Web community: all influence relations have been given the
same directionality, consistently aligned with their time ordering, but the decomposition of data
structures (essentially n-ary relations) into individual triples, which can occur anywhere in the
serialization, is not conducive to efficient parsing. It is reasonable to say that the world has moved on
from XML, while the PROV-N notation was aimed at humans rather than efficient processing.
JSON-LD [JSON-LD] allows a semantic structure to be overlaid over a JSON structure [RFC8259],
thereby enabling the conversion of JSON serializations into linked data. This was exploited in an early
version of this work [IPAW-POSTER], which applied the JSON-LD approach to a JSON serialization
of PROV. The solution did not lead to a natural encoding of the PROV data structure because a
property occurring in different types of JSON objects had to be named differently so that it could be
mapped to the appropriate RDF property; we see here that what is natural in JSON is not necessarily
natural in RDF, and vice-versa. The ability to define contextual mappings was introduced in JSON-LD
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
5/71

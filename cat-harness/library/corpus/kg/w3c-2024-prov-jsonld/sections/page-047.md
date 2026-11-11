---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-047
section_title: "Page 47"
pages: 47-47
pdf_page: 47
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
three relations are encoded using the same pattern as for other relations. Therefore, their mapping
to RDF via the JSON-LD context relies on a PROV extension namespace (denoted by the prefix
provext) in which classes for Specialization, Alternate and Membership are defined. The PROV-
JSONLD serialization also allows for identifier and properties to be encoded for these relations.
IC3:
The notion of a PROV document is not present in PROV-DM or PROV-O, but is introduced in
PROV-N as a housekeeping construct, and is defined in PROV-XML as the root of a PROV-XML
document. A document in PROV-JSONLD is also a JSON object, allowing for a JSON-LD
@context property to be specified.
IC4:
The PROV-JSONLD specification does not introduce constructs for some PROV subtypes and
subrelations, such as prov:Person, prov:Organization, prov:SoftwareAgent, prov:Collection, or
prov:Quotation, prov:PrimarySource, prov:Revision. Instead, the example of Section 3 illustrates
how they can be accommodated within the existing structures. We copy below an agent
expression of type prov:Person and a derivation of type prov:Revision. These subtypes and
subrelations are specified inside the prov:type property. PROV-XML offers a similar way of
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
47/71

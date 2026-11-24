---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-007
section_title: "Page 7"
pages: 7-7
pdf_page: 7
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
This section is non-normative.
We assume the reader to be familiar with PROV, JSON, and JSON-LD.
To illustrate the PROV-JSONLD serialization, we consider a subset of the example of [PROV-
PRIMER], depicted below. It can be paraphrased as follows: agent Derek was responsible for
composing an article based on an existing dataset.
compose
dataSet1
use
derek
assoc
article1
gen
der
title: Crime rises in cities@EN
type:
prov:Person
mbox:
<mailto:derek@example.org>
givenName: Derek
Figure 1: Provenance expressing that Derek was responsible for composing an article based on a data
set.
The PROV-JSONLD representation of this example can be seen in Example 1. At the top level, a
PROV-JSONLD document is a JSON object with two properties @context and @graph, as per JSON-
LD. A context contains mappings of prefixes to namespaces, and also an explicit reference to
https://openprovenance.org/prov-jsonld/context.jsonld — the JSON-LD 1.1 context defining the
semantic mapping for PROV-JSONLD. (This context is fully described in section 5.) The @graph
property has an array of PROV expressions as value. Each PROV expression is itself a JSON object
with at least a @type property (for instance, Entity, Agent or Derivation). Each of these PROV
expressions provides a description of a resource. Some of these resources have an identity provided by
the @id property (for instance, ex:article1 or ex:derek). Other resources are anonymous and, therefore,
do not have a property @id, for instance, the Derivation between the dataset and the article.
§ 3. Example
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
7/71

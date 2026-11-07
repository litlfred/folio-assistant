---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-146-b3-microdata
section_title: "B.3 Microdata"
section_number: null
pages: 88-89
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 164: HTML that describes a book using microdata
<dl itemscope
    itemtype="http://purl.org/vocab/frbr/core#Work"
    itemid="http://purl.oreilly.com/works/45U8QJGZSQKDH8N">
 <dt>Title</dt>
 <dd><cite itemprop="http://purl.org/dc/elements/1.1/title">Just a Geek</cite></dd>
 <dt>By</dt>
 <dd><span itemprop="http://purl.org/dc/elements/1.1/creator">Wil Wheaton</span></dd>
 <dt>Format</dt>
 <dd itemprop="http://purl.org/vocab/frbr/core#realization"
Note that the JSON-LD representation of the Microdata information stays true to the desires of the Microdata community to avoid contexts and
instead refer to items by their full IRI.
This section has been submitted to the Internet Engineering Steering Group (IESG) for review, approval, and registration with IANA.
Type name:
application
Subtype name:
ld+json
Required parameters:
N/A
Optional parameters:
profile
A non-empty list of space-separated URIs identifying specific constraints or conventions that apply to a JSON-LD document according to
[RFC6906]. A profile does not change the semantics of the resource representation when processed without profile knowledge, so that clients both
with and without knowledge of a profiled resource can safely use the same representation. The profile parameter MAY be used by clients to express
their preferences in the content negotiation process. If the profile parameter is given, a server SHOULD return a document that honors the profiles in
the list which it recognizes, and MUST ignore the profiles in the list which it does not recognize. It is RECOMMENDED that profile URIs are
dereferenceable and provide useful documentation at that URI. For more information and background please refer to [RFC6906].
This specification defines six values for the profile parameter.
http://www.w3.org/ns/json-ld#expanded
To request or specify expanded JSON-LD document form.
http://www.w3.org/ns/json-ld#compacted
To request or specify compacted JSON-LD document form.
http://www.w3.org/ns/json-ld#context
To request or specify a JSON-LD context document.
     itemscope
     itemtype="http://purl.org/vocab/frbr/core#Expression"
     itemid="http://purl.oreilly.com/products/9780596007683.BOOK">
  <link itemprop="http://purl.org/dc/elements/1.1/type" href="http://purl.oreilly.com/product-types/BOOK">
  Print
 </dd>
 <dd itemprop="http://purl.org/vocab/frbr/core#realization"
     itemscope
     itemtype="http://purl.org/vocab/frbr/core#Expression"
     itemid="http://purl.oreilly.com/products/9780596802189.EBOOK">
  <link itemprop="http://purl.org/dc/elements/1.1/type" href="http://purl.oreilly.com/product-types/EBOOK">
  Ebook
 </dd>
</dl>
Example 165: Same book description in JSON-LD (avoiding contexts)
[
  {
    "@id": "http://purl.oreilly.com/works/45U8QJGZSQKDH8N",
    "@type": "http://purl.org/vocab/frbr/core#Work",
    "http://purl.org/dc/elements/1.1/title": "Just a Geek",
    "http://purl.org/dc/elements/1.1/creator": "Wil Wheaton",
    "http://purl.org/vocab/frbr/core#realization":
    [
      {"@id": "http://purl.oreilly.com/products/9780596007683.BOOK"},
      {"@id": "http://purl.oreilly.com/products/9780596802189.EBOOK"}
    ]
  }, {
    "@id": "http://purl.oreilly.com/products/9780596007683.BOOK",
    "@type": "http://purl.org/vocab/frbr/core#Expression",
    "http://purl.org/dc/elements/1.1/type": {"@id": "http://purl.oreilly.com/product-types/BOOK"}
  }, {
    "@id": "http://purl.oreilly.com/products/9780596802189.EBOOK",
    "@type": "http://purl.org/vocab/frbr/core#Expression",
    "http://purl.org/dc/elements/1.1/type": {"@id": "http://purl.oreilly.com/product-types/EBOOK"}
  }
]

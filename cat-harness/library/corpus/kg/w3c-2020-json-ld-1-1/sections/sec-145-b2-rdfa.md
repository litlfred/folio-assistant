---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-145-b2-rdfa
section_title: "B.2 RDFa"
section_number: null
pages: 88-88
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 162: RDFa fragment that describes three people
<div prefix="foaf: http://xmlns.com/foaf/0.1/">
   <ul>
      <li typeof="foaf:Person">
        <a property="foaf:homepage" href="http://example.com/bob/">
          <span property="foaf:name">Bob</span>
        </a>
      </li>
      <li typeof="foaf:Person">
        <a property="foaf:homepage" href="http://example.com/eve/">
         <span property="foaf:name">Eve</span>
        </a>
      </li>
      <li typeof="foaf:Person">
        <a property="foaf:homepage" href="http://example.com/manu/">
          <span property="foaf:name">Manu</span>
        </a>
      </li>
   </ul>
</div>
Example 163: Same description in JSON-LD (context shared among node objects)
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/",
    "foaf:homepage": {"@type": "@id"}
  },
  "@graph": [
    {
      "@type": "foaf:Person",
      "foaf:homepage": "http://example.com/bob/",
      "foaf:name": "Bob"
    }, {
      "@type": "foaf:Person",
      "foaf:homepage": "http://example.com/eve/",
      "foaf:name": "Eve"
    }, {
      "@type": "foaf:Person",
      "foaf:homepage": "http://example.com/manu/",
      "foaf:name": "Manu"
    }
  ]
}

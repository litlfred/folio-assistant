---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-103-72-restrictions-for-contents-of-json-ld-script-e
section_title: "Restrictions for contents of JSON-LD script elements"
section_number: 7.2
pages: 72-72
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 147: Embedding JSON-LD containing HTML in HTML
Compacted (Input) 
Expanded (Result) 
Turtle
<script type="application/ld+json">
{
  "@context": "http://schema.org/",
  "@type": "WebPageElement",
  "name": "Encoding Issues",
  "description": "Issues list such as unescaped &lt;/script&gt; or --&gt;"
}
</script>

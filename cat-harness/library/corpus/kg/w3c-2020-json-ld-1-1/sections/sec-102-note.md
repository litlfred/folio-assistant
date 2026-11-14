---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-102-note
section_title: "Note"
section_number: null
pages: 72-72
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Such content should be escaped as indicated below, however the content will remain escaped after processing through the JSON-LD API [JSON-
LD11-API].
&amp; → & (ampersand, U+0026)
&lt; → < (less-than sign, U+003C)
&gt; → > (greater-than sign, U+003E)
&quot; → " (quotation mark, U+0022)
&apos; → ' (apostrophe, U+0027)
A specific script element within an HTML document may be located using a fragment identifier matching the unique identifier of the script element
within the HTML document located by a URL (see [DOM]). A JSON-LD processor MUST extract only the specified data block's contents parsing it
as a standalone JSON-LD document and MUST NOT merge the result with any other markup from the same HTML document.
For example, given an HTML document located at http://example.com/document, a script element identified by "dave" can be targeted using the
URL http://example.com/document#dave.
    }
    </script>
  </head>
</html>

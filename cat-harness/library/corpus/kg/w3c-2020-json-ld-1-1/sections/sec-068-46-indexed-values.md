---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-068-46-indexed-values
section_title: "Indexed Values"
section_number: 4.6
pages: 46-47
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
4.6.1 Data Indexing §
Input
Example 97: Indexing data in JSON-LD
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "schema": "http://schema.org/",
    "name": "schema:name",
    "body": "schema:articleBody",
    "athletes": {
      "@id": "schema:athlete",
      "@container": "@index"
⚠
In the example above, the athletes term has been marked as an index map. The catcher and pitcher keys will be ignored semantically, but preserved
syntactically, by the JSON-LD Processor. If used in JavaScript, this can allow a developer to access a particular athlete using the following code
snippet: obj.athletes.pitcher.
The interpretation of the data is expressed in the statements table. Note how the index keys do not appear in the statements, but would continue to
exist if the document were compacted or expanded (see § 5.2 Compacted Document Form and § 5.1 Expanded Document Form) using a JSON-LD
processor.

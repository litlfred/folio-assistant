---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-000-json-ld-11
section_title: "JSON-LD 1.1"
section_number: null
pages: 1-1
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
This version:
https://www.w3.org/TR/2020/REC-json-ld11-20200716/
Latest published version:
https://www.w3.org/TR/json-ld11/
Latest editor's draft:
https://w3c.github.io/json-ld-syntax/
Test suite:
https://w3c.github.io/json-ld-api/tests/
Implementation report:
https://w3c.github.io/json-ld-api/reports/
Previous version:
https://www.w3.org/TR/2020/PR-json-ld11-20200507/
Previous Recommendation:
https://www.w3.org/TR/2014/REC-json-ld-20140116/
Editors:
Gregg Kellogg (v1.0 and v1.1)
Pierre-Antoine Champin (LIRIS - Université de Lyon) (v1.1)
Dave Longley (Digital Bazaar) (v1.1)
Former editors:
Manu Sporny (Digital Bazaar) (v1.0)
Markus Lanthaler (Google) (v1.0)
Authors:
Manu Sporny (Digital Bazaar) (v1.0)
Dave Longley (Digital Bazaar) (v1.0 and v1.1)
Gregg Kellogg (v1.0 and v1.1)
Markus Lanthaler (Google) (v1.0)
Pierre-Antoine Champin (LIRIS - Université de Lyon) (v1.1)
Niklas Lindström (v1.0)
Participate:
GitHub w3c/json-ld-syntax
File a bug
Commit history
Pull requests
Please check the errata for any errors or issues reported since publication.
See also translations.
This document is also available in this non-normative format: EPUB
Copyright © 2010-2020 W3C® (MIT, ERCIM, Keio, Beihang). W3C liability, trademark and permissive document license rules apply.
JSON is a useful data serialization and messaging format. This specification defines JSON-LD 1.1, a JSON-based format to serialize Linked Data.
The syntax is designed to easily integrate into deployed systems that already use JSON, and provides a smooth upgrade path from JSON to JSON-
LD. It is primarily intended to be a way to use Linked Data in Web-based programming environments, to build interoperable Web services, and to
store Linked Data in JSON-based storage engines.
This specification describes a superset of the features defined in JSON-LD 1.0 [JSON-LD10] and, except where noted, documents created using the
1.0 version of this specification remain compatible with JSON-LD 1.1.
This section describes the status of this document at the time of its publication. Other documents may supersede this document. A list of current W3C
publications and the latest revision of this technical report can be found in the W3C technical reports index at https://www.w3.org/TR/.
This document has been developed by the JSON-LD Working Group and was derived from the JSON-LD Community Group's Final Report.

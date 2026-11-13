---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-327-overview
section_title: "Overview"
section_number: null
pages: 185-186
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Often a single license can be used to represent the licensing terms of a source code or binary file, but there are situations where a
single license identifier is not sufficient. A common example is when software is offered under a choice of one or more licenses
(e.g., GPL-2.0-only OR BSD-3-Clause). Another example is when a set of licenses is needed to represent a binary program
constructed by compiling and linking two (or more) different source files each governed by different licenses (e.g., LGPL-2.1-only
AND BSD-3-Clause).
SPDX License Expressions provide a way for one to construct expressions that more accurately represent the licensing terms
typically found in open source software source code. A license expression could be a single license identifier found on the SPDX
License List; a user defined license reference denoted by the LicenseRef-[idString]; a license identifier combined with an
SPDX exception; or some combination of license identifiers, license references and exceptions constructed using a small set of
defined operators (e.g., AND, OR, WITH and +). We provide the definition of what constitutes a valid SPDX License Expression
in this section.
The exact syntax of license expressions is described below in ABNF, as defined in RFC 52341 and expanded in RFC 74052.
idstring = 1*(ALPHA / DIGIT / "-" / "." )
license-id = <short form license identifier from SPDX License List>
license-exception-id = <short form license exception identifier from SPDX License List>
license-ref = [%s"DocumentRef-"(idstring)":"]%s"LicenseRef-"(idstring)
addition-ref = [%s"DocumentRef-"(idstring)":"]%s"AdditionRef-"(idstring)
simple-expression = license-id / license-id"+" / license-ref
addition-expression = license-exception-id / addition-ref
compound-expression = (simple-expression /
simple-expression ( %s"WITH" / %s"with" ) addition-expression /
compound-expression ( %s"AND" / %s"and" ) compound-expression /
compound-expression ( %s"OR" / %s"or" ) compound-expression /
"(" compound-expression ")" )
license-expression = (simple-expression / compound-expression)
In the following sections we describe in more detail <license-expression> construct, a licensing expression string that
enables a more accurate representation of the licensing terms of modern-day software.
A valid <license-expression> string consists of either:
(i) a simple license expression, such as a single license identifier; or
(ii) a more complex expression constructed by combining smaller valid expressions using Boolean license operators.
1https://datatracker.ietf.org/doc/rfc5234/
2https://datatracker.ietf.org/doc/rfc7405/
System Package Data Exchange (SPDX©) v3.0
173
There MUST NOT be white space between a license-id and any following +. This supports easy parsing and backwards compat-
ibility. There MUST be white space on either side of the operator “WITH”. There MUST be white space and/or parentheses on
either side of the operators AND and OR.
In the tag:value format, a license expression MUST be on a single line, and MUST NOT include a line break in the middle of
the expression.
B.2

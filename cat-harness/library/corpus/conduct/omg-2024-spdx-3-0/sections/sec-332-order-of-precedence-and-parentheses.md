---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-332-order-of-precedence-and-parentheses
section_title: "Order of precedence and parentheses"
section_number: null
pages: 188-188
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
The order of application of the operators in an expression matters (similar to mathematical operators). The default operator order
of precedence of a <license-expression> a is:
+
WITH
AND
OR
where a lower order operator is applied before a higher order operator.
For example, the following expression:
LGPL-2.1-only OR BSD-3-Clause AND MIT
represents a license choice between either LGPL-2.1-only and the expression BSD-3-Clause AND MIT because the AND operator
takes precedence over (is applied before) the OR operator.
When required to express an order of precedence that is different from the default order a <license-expression> can be
encapsulated in pairs of parentheses: ( ), to indicate that the operators found inside the parentheses takes precedence over operators
outside. This is also similar to the use of parentheses in an algebraic expression e.g., (5+7)/2.
For instance, the following expression:
MIT AND (LGPL-2.1-or-later OR BSD-3-Clause)
states the OR operator should be applied before the AND operator. That is, one should first select between the LGPL-2.1-or-later
or the BSD-3-Clause license before applying the MIT license.
B.4.6

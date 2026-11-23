---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-331-introduction
section_title: "Introduction"
section_number: null
pages: 186-188
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
More expressive composite license expressions can be constructed using “OR”, “AND”, and “WITH” operators similar to con-
structing mathematical expressions using arithmetic operators.
For the tag:value format, any license expression that consists of more than one license identifier and/or LicenseRef, may
optionally be encapsulated by parentheses: “( )”.
Nested parentheses can also be used to specify an order of precedence which is discussed in more detail in Order of precedence
and parentheses.
3https://spdx.org/licenses
4https://spdx.org/licenses
174
System Package Data Exchange (SPDX©) v3.0
B.4.2
Disjunctive “OR” operator
If presented with a choice between two or more licenses, use the disjunctive binary “OR” operator to construct a new license
expression, where both the left and right operands are valid license expression values.
For example, when given a choice between the LGPL-2.1-only or MIT licenses, a valid expression would be:
LGPL-2.1-only OR MIT
The “OR” operator is commutative, meaning that the above expression should be considered equivalent to:
MIT OR LGPL-2.1-only
An example representing a choice between three different licenses would be:
LGPL-2.1-only OR MIT OR BSD-3-Clause
It is allowed to use the operator in lower case form or.
B.4.3
Conjunctive “AND” operator
If required to simultaneously comply with two or more licenses, use the conjunctive binary “AND” operator to construct a new
license expression, where both the left and right operands are a valid license expression values.
For example, when one is required to comply with both the LGPL-2.1-only or MIT licenses, a valid expression would be:
LGPL-2.1-only AND MIT
The “AND” operator is commutative, meaning that the above expression should be considered equivalent to:
MIT AND LGPL-2.1-only
An example where all three different licenses apply would be:
LGPL-2.1-only AND MIT AND BSD-2-Clause
It is allowed to use the operator in lower case form and.
B.4.4
Additive “WITH” operator
Sometimes license texts are found with additional text, which might or might not modify the original license terms.
In this case, use the binary “WITH” operator to construct a new license expression to represent the special situation. A valid
<license-expression> is where the left operand is a <simple-expression> value and the right operand is a
<addition-expression> that represents the additional text.
The <addition-expression> can be either a <license-exception-id> from the SPDX License List, or a user defined
addition reference in the form [“DocumentRef-”(idstring)“:”]“AdditionRef-”(idstring)
For example, when the Bison exception is to be applied to GPL-2.0-or-later, the expression would be:
GPL-2.0-or-later WITH Bison-exception-2.2
The current set of valid license exceptions identifiers can be found in spdx.org/licenses5.
It is allowed to use the operator in lower case form with.
5https://spdx.org/licenses
System Package Data Exchange (SPDX©) v3.0
175
B.4.5

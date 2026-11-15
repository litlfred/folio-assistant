---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-029-canonical-serialization
section_title: "Canonical serialization"
section_number: null
pages: 19-20
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Canonical serialization is a single, consistent, normalized, deterministic, and reproducible form.
Such a canonical form normalizes things like ordering and formatting.
The content of the canonical serialization is exactly the same as the JSON-LD serialization of RDF data (see 4.2), just represented
in a consistent way.
Canonical serialization is in JSON format, as defined in RFC 8259 (IETF STD 90), with the following additional characteristics:
• No line breaks
• Key names MUST be wrapped in double quotes
• No whitespace outside of strings
• true, false and null: the literal names must be lowercase; no other literal names are allowed
System Package Data Exchange (SPDX©) v3.0
7
• Integers: represented in base 10 using decimal digits. This designates an integer component that may be prefixed with an
optional minus sign. Leading zeros are not allowed.
• Strings: UTF-8 representation without specific canonicalisation. A string begins and ends with quotation marks (%x22).
Any Unicode characters may be placed within the quotation marks, except for the two characters that MUST be escaped by
a reverse solidus: quotation mark, reverse solidus, and the control characters (U+0000 through U+001F).
• Arrays: An array structure is represented as square brackets surrounding zero or more items. Items are separated by commas.
• Objects: An object structure is represented as a pair of curly brackets surrounding zero or more name/value pairs (or mem-
bers). A name is a string containing only ASCII characters (0x21-0x7F). The names within an object must be unique. A
single colon comes after each name, separating the name from the value. A single comma separates a value from a following
name. The name/value pairs are ordered by name.
6.4

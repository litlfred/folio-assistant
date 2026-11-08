---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-394-how-to-parse-a-purl-string-to-its-components
section_title: "How to parse a purl string to its components"
section_number: null
pages: 202-203
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Parsing a purl ASCII string into its components works by splitting the string on different characters.
To parse a purl string in its components:
1. Split the purl string once from right on #, if present; the left side is the remainder.
2. If the right side is not empty, it contains subpath information:
1. Strip it from leading and trailing /.
2. Split this on / in a list of segments.
3. Discard empty, ., and .. segments.
4. Percent-decode each segment.
5. UTF-8-decode each of these.
6. Join segments with /.
7. This is the subpath.
3. Split the remainder once from right on ?, if present; the left side is the remainder.
4. If the right side is not empty, it contains qualifiers information:
1. Split it on & in a list of key=value pairs.
2. Split each pair once from left on = in key and value parts.
3. The key is the lowercase left side.
4. Percent-decode the right side.
5. UTF-8-decode this to get the value.
6. Discard any key/value pairs where the value is empty.
7. If the key is checksum, split the value on , to create a list of checksums.
8. This list of keys/values is the qualifiers.
5. Split the remainder once from left on :; the right side is the remainder.
6. The left side lowercased is the scheme. It should be exactly “pkg:”.
7. Strip the remainder from leading and trailing /.
8. Split this once from left on /; the right side is the remainder.
9. The left side lowercased is the type.
10. Split the remainder once from right on @, if present; the left side is the remainder.
11. If the right side is not empty, it contains version information:
1. Percent-decode the string.
2. UTF-8-decode this.
3. This is the version.
12. Split the remainder once from right on /, if present; the left side is the remainder.
13. The right side contains name information.
14. Percent-decode the name string.
15. UTF-8-decode this.
16. Apply type-specific normalization, if needed.
17. This is the name.
190
System Package Data Exchange (SPDX©) v3.0
18. If the remainder is not empty, it contains namespace information:
1. Split the remainder on / to a list of segments.
2. Discard any empty segment.
3. Percent-decode each segment.
4. UTF-8-decode each of these.
5. Apply type-specific normalization to each segment, if needed.
6. Join segments with /.
7. This is the namespace.
E.8

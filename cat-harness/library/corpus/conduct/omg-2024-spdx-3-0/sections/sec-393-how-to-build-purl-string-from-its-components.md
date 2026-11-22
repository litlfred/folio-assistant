---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-393-how-to-build-purl-string-from-its-components
section_title: "How to build purl string from its components"
section_number: null
pages: 201-202
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Building a purl ASCII string works from left to right, from type to subpath.
To build a purl string from its components:
1. Start a purl string with the “pkg:” scheme as a lowercase ASCII string
2. Append the type string to the purl as a lowercase ASCII string
3. Append / to the purl
4. If the namespace is not empty:
1. Strip the namespace from leading and trailing /
2. Split on / as segments
3. Apply type-specific normalization to each segment, if needed
4. Encode each segment in UTF-8-encoding
5. Percent-encode each segment
6. Join the segments with /
7. Append this to the purl
8. Append / to the purl
5. Strip the name from leading and trailing /
6. Apply type-specific normalization to the name, if needed
7. Encode the name in UTF-8-encoding
8. Percent-encode the name
9. Append the percent-encoded name to the purl
10. If the version is not empty:
1. Append @ to the purl
2. Encode the version in UTF-8-encoding
3. Percent-encode the version
4. Append the percent-encoded version to the purl
11. If the qualifiers are not empty and not composed only of key/value pairs where the value is empty:
1. Append ? to the purl
2. Discard any pair where the value is empty
3. Encode each value in UTF-8-encoding
4. If the key is checksum and there are more than one checksums, join the list with , to create the qualifier value
5. Create each qualifier string by joining the lowercased key, the equal = sign, and the percent-encoded value
6. Sort this list of qualifier strings lexicographically
7. Join this list of sorted qualifier strings with &
8. Append this string to the purl
12. If the subpath is not empty and not composed only of empty, ., and .. segments:
1. Append # to the purl
2. Strip the subpath from leading and trailing /
System Package Data Exchange (SPDX©) v3.0
189
3. Split the subpath on / as a list of segments
4. Discard empty, ., and .. segments
5. Encode each segment in UTF-8-encoding
6. Percent-encode each segment
7. Join the segments with /
8. Append this string to the purl
E.7.2

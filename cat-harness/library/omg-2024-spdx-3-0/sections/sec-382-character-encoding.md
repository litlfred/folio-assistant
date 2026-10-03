---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-382-character-encoding
section_title: "Character encoding"
section_number: null
pages: 199-199
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
For clarity and simplicity a purl is always an ASCII string. To ensure that there is no ambiguity when parsing a purl, separator
characters and non-ASCII characters must be encoded in UTF-8, and then percent-encoded as defined in RFC 3986 https://datatr
acker.ietf.org/doc/rfc3986.
Use these rules for percent-encoding and decoding purl components:
• the type must NOT be encoded and must NOT contain separators
• the #, ?, @ and : characters must NOT be encoded when used as separators. They may need to be encoded elsewhere
• the : scheme and type separator does not need to and must NOT be encoded. It is unambiguous unencoded everywhere
• the / used as type/namespace/name and subpath segments separator does not need to and must NOT be percent-encoded. It
is unambiguous unencoded everywhere
• the @ version separator must be encoded as %40 elsewhere
• the ? qualifiers separator must be encoded as %3F elsewhere
• the = qualifiers key/value separator must NOT be encoded
• the # subpath separator must be encoded as %23 elsewhere
• All non-ASCII characters must be encoded as UTF-8 and then percent-encoded
It is OK to percent-encode any purl components, except for the type. Producers and consumers of purl data must always percent-
decode and percent-encode components and component segments as explained in the “How to produce and consume purl data”
section.
E.4

---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-388-rules-for-qualifiers
section_title: "Rules for qualifiers"
section_number: null
pages: 200-200
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
• The qualifiers string is prefixed by a ? separator when not empty.
• This ? is not part of the qualifiers.
• This is a string composed of zero or more key=value pairs each separated by an ampersand &. A key and value are separated
by an equal = character.
• These & are not part of the key=value pairs.
• Each key must be unique within the keys of the qualifiers string.
• A value cannot be an empty string; a key=value pair with an empty value is the same as no key/value at all for this key.
• Each key must be composed only of ASCII letters and numbers, ., - and \_ (period, dash and underscore).
• A key cannot start with a number.
• A key must NOT be percent-encoded.
• A key is case insensitive, with the canonical form being lowercase.
• A key cannot contain spaces.
• A value must be a percent-encoded string.
• The = separator is neither part of the key nor of the value.
E.4.7

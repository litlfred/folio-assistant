---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-386-rules-for-namespace
section_title: "Rules for namespace"
section_number: null
pages: 199-200
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
• The optional namespace contains zero or more segments, separated by slash /.
• Leading and trailing slashes / are not significant and should be stripped in the canonical form. They are not part of the
namespace.
• Each namespace segment must be a percent-encoded string.
• When percent-decoded, a segment must not contain a slash / and must not be empty.
• A URL host or Authority must NOT be used as a namespace. Use instead a repository_url qualifier. Note however
that for some types, the namespace may look like a host.
System Package Data Exchange (SPDX©) v3.0
187
E.4.4
Rules for name
• The name is prefixed by a slash / separator when the namespace is not empty.
• This slash / is not part of the name.
• A name must be a percent-encoded string.
E.4.5

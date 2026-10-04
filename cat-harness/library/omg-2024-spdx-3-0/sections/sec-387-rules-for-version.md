---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-387-rules-for-version
section_title: "Rules for version"
section_number: null
pages: 200-200
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
• The version is prefixed by a at-sign @ separator when not empty.
• This at-sign @ is not part of the version.
• A version must be a percent-encoded string.
• A version is a plain and opaque string. Some package types use versioning conventions such as SemVer for NPMs or NEVRA
conventions for RPMS. A type may define a procedure to compare and sort versions, but there is no reliable and uniform
way to do such comparison consistently.
E.4.6

---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-381-syntax-definition
section_title: "Syntax definition"
section_number: null
pages: 198-199
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
purl stands for package URL.
A purl is a URL composed of seven components:
scheme:type/namespace/name@version?qualifiers#subpath
Components are separated by a specific character for unambiguous parsing.
The definition for each components is:
• scheme: this is the URL scheme with the constant value of “pkg”. One of the primary reason for this single scheme is to
facilitate the future official registration of the “pkg” scheme for package URLs. Required.
• type: the package type or package protocol such as maven, npm, nuget, gem, pypi, etc. Required.
• namespace: some name prefix such as a Maven groupid, a Docker image owner, a GitHub user or organization. Optional
and type-specific.
• name: the name of the package. Required.
• version: the version of the package. Optional.
• qualifiers: extra qualifying data for a package such as an OS, architecture, a distribution, etc. Optional and type-specific.
• subpath: extra subpath within a package, relative to the package root. Optional.
Components are designed such that they form a hierarchy from the most significant on the left to the least significant components
on the right.
A purl is a valid URL and URI that conforms to the URL definitions and specifications in RFC 3986 https://datatracker.ietf.org/d
oc/rfc3986.
A purl must not contain a URL Authority i.e. there is no support for username, password, host and port components. A namespace
segment may sometimes look like a host but its interpretation is specific to a type.
The purl components are mapped to the following URL components:
• purl scheme: this is a URL scheme with a constant value: pkg
• purl type, namespace, name and version components: these are collectively mapped to a URL path
• purl qualifiers: this maps to a URL query
• purl subpath: this is a URL fragment
186
System Package Data Exchange (SPDX©) v3.0
E.3

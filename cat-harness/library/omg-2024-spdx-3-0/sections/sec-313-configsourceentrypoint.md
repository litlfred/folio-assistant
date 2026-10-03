---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-313-configsourceentrypoint
section_title: "configSourceEntrypoint"
section_number: null
pages: 170-171
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Property describes the invocation entrypoint of a build.
Description
A build entrypoint is the invoked executable of a build which always runs when the build is triggered, according to the buildType.
For example, when a build is triggered by running a shell script, the entrypoint is script.sh.
In terms of a declared build, the entrypoint is the position in a configuration file or a build declaration which is always run when
the build is triggered.
For example, in the following configuration file, the entrypoint of the build is publish.
name: Publish packages to PyPI
on:
create:
130../../Core/Classes/Hash.md
158
System Package Data Exchange (SPDX©) v3.0
tags: "*"
jobs:
publish:
runs-on: ubuntu-latest
if: startsWith(github.ref, 'refs/tags/')
steps:
...
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/configSourceEntrypoint
Name:
configSourceEntrypoint
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Build/Build
16.2.7

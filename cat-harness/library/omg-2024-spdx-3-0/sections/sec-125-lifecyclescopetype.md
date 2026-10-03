---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-125-lifecyclescopetype
section_title: "LifecycleScopeType"
section_number: null
pages: 64-65
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provide an enumerated set of lifecycle phases that can provide context to relationships.
32https://datatracker.ietf.org/doc/rfc1950/
33https://datatracker.ietf.org/doc/rfc7693/
34https://datatracker.ietf.org/doc/rfc7693/
35https://datatracker.ietf.org/doc/rfc7693/
36https://github.com/BLAKE3-team/BLAKE3-specs/blob/master/blake3.pdf
37https://pq-crystals.org/dilithium/
38https://pq-crystals.org/kyber/
39https://falcon-sign.info/falcon.pdf
40https://datatracker.ietf.org/doc/rfc1319/
41https://datatracker.ietf.org/doc/rfc1186/
42https://datatracker.ietf.org/doc/rfc1321/
43https://people.csail.mit.edu/rivest/pubs/RABCx08.pdf
44https://datatracker.ietf.org/doc/rfc3174/
45https://datatracker.ietf.org/doc/rfc3874/
46https://datatracker.ietf.org/doc/rfc6234/
47https://datatracker.ietf.org/doc/rfc6234/
48https://csrc.nist.gov/pubs/fips/202/final
49https://csrc.nist.gov/pubs/fips/202/final
50https://csrc.nist.gov/pubs/fips/202/final
51https://csrc.nist.gov/pubs/fips/202/final
52https://datatracker.ietf.org/doc/rfc6234/
52
System Package Data Exchange (SPDX©) v3.0
Description
This enumeration summarizes common phases when dependency and other relationships, have different implications, based on
their context. For example, a build dependency, may have different implications than a operational dependency.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/LifecycleScopeType
Name:
LifecycleScopeType
Entries
build A relationship has specific context implications during an element’s build phase, during development.
design A relationship has specific context implications during an element’s design.
development A relationship has specific context implications during development phase of an element.
other A relationship has other specific context information necessary to capture that the above set of enumerations does not handle.
runtime A relationship has specific context implications during the execution phase of an element.
test A relationship has specific context implications during an element’s testing phase, during development.
8.3.6

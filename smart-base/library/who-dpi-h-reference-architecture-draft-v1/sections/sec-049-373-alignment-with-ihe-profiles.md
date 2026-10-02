---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-049-373-alignment-with-ihe-profiles
section_title: "Alignment with IHE profiles"
section_number: 3.7.3
pages: 94-95
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
1118 
 
1119 
IHE is the principal example of a framework accommodated within this model, and the 
1120 
correspondence is close enough that the reference architecture may adopt IHE specifications 
1121 
directly. The consequence is deferral: where an interaction corresponds to an IHE transaction, 
1122 
the architecture names the actor and the transaction and defers to the IHE specification for the 
1123 
protocol detail, and to IHE conformance tooling for testing that side of the interaction. The 
1124 
architecture keeps ownership of the model — which actors exist, which services they offer and 
1125 
 
 
84 
require, which interactions connect them — while the specification of a transaction may be 
1126 
drawn from IHE or, where no profile exists, supplied by another standard or specified afresh. 
1127 
The correspondence also marks a boundary: the model covers interactions that IHE does not — 
1128 
the human-initiated paths of Multiple access patterns to a single service, or exchanges not yet 
1129 
specified to transaction level — for which there is nothing to defer to, and which the architecture 
1130 
specifies by other means. 
1131

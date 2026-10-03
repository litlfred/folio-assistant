---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-050-374-planning-testing-from-the-architecture
section_title: "Planning testing from the architecture"
section_number: 3.7.4
pages: 95-96
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
1132 
The same decomposition that makes the architecture legible makes the testing work plannable. 
1133 
Because conformance is declared component by component, against the services of an actor 
1134 
role, the architecture is in effect a map of what is to be tested: each component carries a 
1135 
defined test scope, and each test exercises one side of an interaction at a time. The structure 
1136 
also distinguishes the testing an adopter can reuse from the testing it needs to build: 
1137 
• 
Standard components arrive tested. Where a component realises a standardised 
1138 
actor — one governed by an IHE profile, say — the conformance tests already exist: the 
1139 
published test plans, simulators, and reference data that accompany the standard. The 
1140 
adopter reuses them, deferring testing to the framework just as it defers the 
1141 
specification. 
1142 
• 
Non-standard components are tested by the adopter. Where a component, service, 
1143 
or interaction is bespoke, or is an interaction not yet specified to transaction level (for 
1144 
instance a human-initiated UI workflow), no ready-made tests exist. The architecture still 
1145 
bounds the task: it names the services to satisfy, the role being claimed, and the side of 
1146 
the interaction to exercise, with a simulator or operator playing the other side. 
1147 
 
1148 
The effect is that conformance testing can be planned as part of the architecture work, not 
1149 
retrofitted afterwards: walking the components and their services yields, early, a test plan that 
1150 
separates what comes tested from what needs to be built, sizes each, and identifies the 
1151 
simulators, drivers, and test data needed. 
1152 
 
1153 
These distinctions can also be expressed as measures, so that progress in testing is 
1154 
quantifiable rather than impressionistic. Three ratios are useful: requirements coverage — the 
1155 
requirements tested and confirmed satisfied, against the total stated for a component; standards 
1156 
conformance — the applicable standards for which conformance has been demonstrated, 
1157 
against the total identified; and capability completeness — the expected capabilities delivered 
1158 
and verified, against the total the architecture expects. Each counts confirmed results against 
1159 
the full set of expectations, and together they complement the realisation-based coverage 
1160 
measure described below. 
1161 
 
1162 
This is an instance of a more general property. Because the elements and their relationships 
1163 
are structured and machine-readable, an architecture expressed in this way can be 
1164 
assessed, not merely described. When a country adapts the reference architecture, or adopts 
1165 
only selected parts of it, the model makes gaps explicit and checkable — for example a 
1166 
capability with no component realising it, an actor whose required service nothing provides, or 
1167 
an interaction with no conforming implementation. Completeness and consistency thereby 
1168 
 
 
85 
become properties that can be checked against the model itself, informing decisions about what 
1169 
to adopt, extend, or build. 
1170 
 
1171

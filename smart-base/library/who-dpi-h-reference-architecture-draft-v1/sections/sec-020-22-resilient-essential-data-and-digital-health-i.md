---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-020-22-resilient-essential-data-and-digital-health-i
section_title: "Resilient Essential Data and Digital Health Infrastructure (REDDHI)"
section_number: 2.2
pages: 38-39
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
109 
of travel that addresses this fragmentation: a governed, interoperable digital health 
110 
infrastructure built on open standards and trusted, secure, quality data, within which local and 
111 
regional innovation can flourish, investments can be mobilised and absorbed at scale, and the 
112 
health system can sustain itself technically and financially over time. It is not a fixed destination 
113 
to be reached and signed off, and it is not a set of systems to procure. It is a condition of self-
114 
sustaining national digital health maturity that continues to evolve as needs and technology 
115 
change — one in which the foundational capabilities every health programme depends upon are 
116 
shared, interoperable, and governed in the public interest rather than duplicated in silos. 
117 
A country does not need the whole of REDDHI in place to begin. The starting point can be a 
118 
core set of metadata registries, the (lifelong) health record, and the means to exchange data 
119 
between them; These registries are interdependent: a longitudinal record carries little weight 
120 
without the means to establish where and by whom each entry was made, so the facility and 
121 
health workforce registries are what allow the provenance of records to be established, just as 
122 
the client registry is what allows them to be reliably attributed to the right individual. REDDHI is 
123 
the broader, maturing state those foundations make possible. Countries do not become 
124 
“REDDHI-compliant” at a point in time; rather, they can gauge progress through observable 
125 
markers — whether authoritative registries exist and are reused across programmes, whether 
126 
data is exchanged through governed, standards-based means, and whether the quality and 
127 
stewardship of that data are actively managed. Framed this way, REDDHI gives countries a way 
128 
to assess their current state, identify gaps, and ground architectural choices in health-system 
129 
requirements rather than in whatever technology happens to be available. 
130 
This interdependence is what defines the essential core: the capabilities whose absence 
131 
imposes the greatest cost on the rest of the ecosystem, and which, once in place, make every 
132 
other investment more connectable and more sustainable. The table below summarises these 
133 
foundational capabilities and the DPI-H components that deliver them. Most of these capabilities 
134 
form the minimum viable foundation that countries should prioritise regardless of starting point; 
135 
other capabilities such as having consistent data structures across systems are typically built up 
136 
from that foundation as maturity grows. The full mapping of capabilities to components across 
137 
all seven priority health goals is set out in the methodology section that follows and the defining 
138 
characteristics of DPI-H application components are described in the DPI-H application 
139 
components sub-chapter. 
140 
Table 2.2: REDDHI — foundational capabilities and the components that deliver them 
141 
 
 
28 
Foundational capability 
Components that deliver it 
Unique identification of 
people, facilities, health 
workers, and products 
Client Registry, Health Facility Registry, Health Workforce 
Registry, Product Registry 
Authentication and access 
management 
Foundational Identity DPI and national trust infrastructure 
(authentication, PKI, digital signatures, verifiable 
credentials), drawing on the Health Workforce Registry 
and Client Registry for roles and identity resolution 
Longitudinal health records, 
with provenance and 
attribution 
Lifelong Health Record, anchored by the Client, Health 
Facility, and Health Workforce registries 
Standards-based data 
exchange across systems 
Shared registries and Terminology Service as common 
references, exchanged through open standards and 
agreed exchange patterns 
Consistent meaning across 
systems (terminology and 
coding) 
Terminology Service 
Consistent data structure 
across systems (information 
models) 
Logical Information Model Repository* 
 
*An enabler that can be built up as maturity grows, rather than part of 
the minimum foundation 
Data governance, quality, and 
audit 
The registries, Terminology Service, and LIMR*, 
supported by a semantic governance infrastructure 
Consent, authorisation, and 
privacy 
Health-sector consent service, with consent enforced at 
the point of data exchange; or national/ foundational 
consent infrastructure where available 
 
142

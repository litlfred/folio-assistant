---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-002-113-building-on-existing-foundations
section_title: "Building on existing foundations"
section_number: 1.1.3
pages: 21-23
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
82 
The DPI-H reference architecture guidance builds substantively upon and extends the 
83 
foundational work of the 2020 WHO-ITU Digital Health Platform (DHP) Handbook and the 
84 
OpenHIE Architecture Specification and draws on standard architectural guidance from The 
85 
Open Group Architectural Framework (TOGAF).  
86 
The reference architecture guidance addresses the maturation of national digital ecosystems 
87 
where health is one sector leveraging common DPI rather than building parallel systems 
88 
exclusively for health and advances the field's understanding of how health-specific DPI (DPI-H) 
89 
integrates with and leverages broader DPI. While previous work established the value of shared 
90 
components within health systems, DPI-H extends this thinking to cross-sectoral integration. 
91 
Although the DHP Handbook and OpenHIE Architecture do not specifically reference the DPI 
92 
concept, the fundamental challenges those resources sought to address remain the same. 
93 
These include: 
94 
● Fragmented, siloed digital health applications 
95 
● Redundant investments in common capabilities 
96 
● Limited interoperability across systems 
97 
● Need for reusable components and shared infrastructure 
98 
● Importance of avoiding vendor lock-in 
99 
● Sustainability concerns with vertical approaches — standalone systems built for a single 
100 
programme or disease area, which duplicate effort and are costly to sustain 
101 
 
 
11 
DPI has demonstrated impact in countries and catalysed ecosystem innovation across sectors. 
102 
Foundational DPI for identity, data exchange and digital payments — exemplified by India's 
103 
Aadhaar digital identity, Brazil's Pix instant payments, and Estonia's X-Road data exchange 
104 
layer — have shown tremendous value as shared infrastructure that can be leveraged by 
105 
multiple sectors8. The health sector has been a direct beneficiary in some countries; for 
106 
example, in India, the COVID-19 vaccination platform CoWIN was built on the existing Aadhaar 
107 
identity infrastructure for beneficiary verification, helping deliver over one billion vaccine doses 
108 
within nine months and reaching more than 940 million registered users9. In Estonia, the 
109 
national health information system — which since 2008 has maintained a longitudinal electronic 
110 
health record for every resident — runs on the same X-Road data exchange layer used across 
111 
all public services, while citizens access their records through the national digital identity (ID-
112 
card or Mobile-ID) rather than a health-specific credential10. Together these cases show how 
113 
health-specific capabilities can be delivered at population scale by leveraging foundational DPI, 
114 
rather than building parallel identity, data-exchange or payment systems for health alone. The 
115 
health sector however, while not being unique in its ability to leverage foundational DPI, 
116 
possesses some unique requirements that have not yet been articulated to enable it to 
117 
effectively leverage these foundational components. This guidance articulates the explicit 
118 
health-sector requirements that foundational DPIs would need to satisfy in order to contribute to 
119 
health sector goals. Additionally, this reference architecture recognises that the health sector 
120 
possesses some components that can be shared and reused across different programmes in 
121 
the health sector, components that can be described as health DPIs (DPI-H). It also articulates 
122 
the explicit requirements that the “health DPIs” would need to satisfy in order to contribute to 
123 
health sector goals. 
124 
Using TOGAF-based enterprise architecture methodology, this guidance introduces a structured 
125 
approach to articulating the reference architecture, anchored in seven priority health sector 
126 
goals (Box 1). These goals are examined in further detail in a subsequent section and broken 
127 
down to describe the value that different health sector stakeholders derive from technology 
128 
implementations. 
129 
Box 1.1: The Seven Priority Health Sector Goals 
 
1. Build Trusted Data Foundations – “Capture once, use many times.” 
2. Support a Capable, Well-Distributed Health Workforce – “Proven Skills, Right 
Place, Timely Pay, Continuous Growth.” 
3. Ensure Quality and Continuity of Care – “Care that connects, protocols that guide.” 
4. Establish Trusted Personal Health Records – “Every person has a right to their own 
health record.” 
5. Optimize Supply Chain Management – “Safe health products and services delivered 
 
8 Fetter, J., Rao, K. and Eaves, D. (2025). 2025 State of Digital Public Infrastructure Report. UCL Institute for Innovation and Public 
Purpose, IIPP Policy Report 2025/06. Available at: https://www.ucl.ac.uk/bartlett/publications/2025/nov/2025-state-digital-public-
infrastructure-report (Accessed: 4 November 2025). 
9 Exemplars in Global Health (n.d.). CoWIN in India. Gates Ventures / Exemplars in Global Health. Available at: 
https://www.exemplars.health/emerging-topics/epidemic-preparedness-and-response/digital-health-tools/cowin-in-india (Accessed: 5 
June 2026). 
10 Metsallik, J., Ross, P., Draheim, D. and Piho,G.  (2018). Ten Years of the e-Health System in Estonia. CEUR Workshop 
Proceedings, Vol. 2336. Available at: https://ceur-ws.org/Vol-2336/MMHS2018_invited.pdf (Accessed: 5 June 2026). 
 
 
12 
when and where they are needed” 
6. Advance Efficient and Equitable Health Financing – “Smarter spending, stronger 
protection.” 
7. Strengthen Climate and Epidemic Resilience – “Predict early, timely action.” 
This guidance is the product of an extensive collaborative process drawing on the experiences, 
130 
expertise, and country learnings of a diverse global community of practitioners. It reflects 
131 
contributions from digital health architects, clinical informaticians, health financing specialists, 
132 
supply chain experts, country implementers, and development partners spanning low, middle, 
133 
and high-income countries across multiple regions — ensuring that the architecture it describes 
134 
is grounded in the realities of implementation rather than abstract concepts. 
135

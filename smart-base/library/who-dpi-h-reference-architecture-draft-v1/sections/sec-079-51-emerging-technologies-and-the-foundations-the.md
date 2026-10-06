---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-079-51-emerging-technologies-and-the-foundations-the
section_title: "Emerging technologies and the foundations they depend on"
section_number: 5.1
pages: 115-118
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
26 
depend on 
27 
Emerging technologies do not substitute for the foundational work of building trusted registries, 
28 
governed terminology, structured information models, and reliable interoperability. More often 
29 
they depend on that work and integrate with it. Artificial intelligence, in particular, operates on top 
30 
 
42Regulation (EU) 2024/1689 of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on 
artificial intelligence (Artificial Intelligence Act). Official Journal of the European Union, L series, 12 July 2024. 
https://eur-lex.europa.eu/eli/reg/2024/1689/oj 
43World Health Organization. Ethics and governance of artificial intelligence for health: WHO guidance. Geneva: World Health 
Organization; 2021. 
44World Health Organization. Ethics and governance of artificial intelligence for health: guidance on large multi-modal models. 
Geneva: World Health Organization; 2024. Available at: https://www.who.int/publications/i/item/9789240084759 
 
 
105 
of existing digital infrastructure; where that infrastructure is weak, fragmented, or poorly governed, 
31 
AI is less likely to perform as intended, with consequences for quality and patient safety. 
32 
It is also relevant that not all emerging technologies draw on data held in the shared infrastructure. 
33 
Some consumer-facing applications operate independently of health-system data, using 
34 
information entered by individuals or collected through personal devices to offer self-management 
35 
support or lifestyle advice, and these can deliver value without accessing shared records or 
36 
interoperating with wider health information systems. The architecture described here concerns 
37 
those technologies that depend on, or contribute to, the shared health data foundation, and it is 
38 
for these that the relationship set out below is decisive. 
39 
5.2 Why data foundations determine what AI can 
40 
deliver 
41 
The performance of an AI model depends on the data it can access, and in health that data is 
42 
generated across many systems, providers, and points of care over a person's lifetime. Where 
43 
data is fragmented, inconsistently coded, attributed to the wrong individual, or held in systems 
44 
that do not exchange it, a model inherits and amplifies those weaknesses rather than overcoming 
45 
them, and it does so at a scale and speed that can make the resulting errors difficult to detect and 
46 
correct. A model used to identify patients at high risk of deterioration, for example, produces 
47 
unreliable predictions if it draws only on records from a single facility while earlier admissions, 
48 
laboratory results, and medication histories sit elsewhere and are not linked. The trusted data 
49 
foundation that this architecture describes — captured once and reused many times — is what 
50 
allows a model to be trained, validated, and deployed reliably, safely, and equitably. 
51 
Several elements of the shared infrastructure are particularly important to the reliable 
52 
performance of AI and other data-dependent technologies: 
53 
• 
terminology services, which provide the semantic consistency that allows an algorithm to 
54 
operate on data that means the same thing across the systems that produced it. Governed 
55 
terminology also reduces the complexity a model has to contend with and improves the 
56 
reliability with which it connects concepts; 
57 
• 
the logical information model repository, which governs a shared, structured 
58 
representation of data so that it is machine-processable rather than locked in free text or 
59 
local formats; 
60 
• 
the client registry, which enables the longitudinal records on which both training and 
61 
inference depend to be assembled correctly for the right individual; 
62 
• 
interoperability, a cross-cutting property realised through the information mediator and 
63 
shared terminology rather than a component in its own right, which allows data to be linked 
64 
across care settings and organisations, so that it can flow to where models are developed 
65 
and recommendations can flow back to the point of care; and 
66 
 
 
106 
• 
the governance, consent, and privacy capabilities embedded throughout the architecture, 
67 
which support the lawful and ethical use of data on which AI depends, and which retain 
68 
public trust. Weaknesses in data quality cascade directly into the reliability of any 
69 
analytical or AI capability built upon them. 
70 
Two points deserve emphasis because they are easily overlooked. First, governance does not 
71 
become less important as models become more capable; if anything it becomes more so. Large 
72 
language and multi-modal models have well-documented limits in handling complex, inconsistent 
73 
data, and consistent terminology and information models reduce that burden directly — making 
74 
semantic governance an increasingly practical determinant of whether AI performs reliably, not 
75 
only an ethical one. Second, grounding models in authoritative, governed reference data also 
76 
bears on how far their outputs can be trusted. A model that draws on curated registries — a client 
77 
registry, a facility registry, a terminology service, or a common geo-registry — rather than on 
78 
ungoverned general-purpose sources can have its outputs traced back to source and audited 
79 
before they inform a decision. Where an output would influence resource allocation, eligibility, or 
80 
care, the discipline of auditing the data a model used, before acting on what it produced, is a 
81 
meaningful safeguard. Models drawing only on ungoverned sources offer no comparable 
82 
traceability, and an authoritative-looking answer is then hard to distinguish from an unfounded 
83 
one. 
84 
A related and rapidly developing pattern is to give models access to trusted, well-defined units of 
85 
functionality rather than expecting the model to perform every task itself. Where a calculation 
86 
should be identical everywhere — a coverage indicator, an eligibility rule, a conversion between 
87 
units — it is more reliable to have the model call an authoritative service that performs that 
88 
calculation deterministically than to have the model reproduce it, because the same input then 
89 
yields the same result every time and the logic can be governed in one place. Emerging 
90 
conventions describe these units in different ways:  
91 
• 
as skills (discrete, reusable capabilities),  
92 
• 
as agents (components that orchestrate a task and that may in turn call a model, which 
93 
itself calls deterministic services), and  
94 
• 
as shared interfaces — for example, servers implementing the Model Context Protocol 
95 
(MCP) — through which a model can discover and invoke such capabilities.  
96 
Designed well, this keeps models pointed at governed sources of truth for the parts of a task that 
97 
need to be exact, while reserving the model's own inference for the parts that benefit from it. The 
98 
registries, terminology services, and logical information model repository described in this 
99 
guidance are what make such services trustworthy in the first place: a service that calculates an 
100 
indicator is only authoritative if the records it draws on and the definition it applies — the 
101 
numerator, denominator, and coded terms — are themselves governed.  
102 
A related, forward-looking practice is to publish specifications and metadata in machine-readable 
103 
form — for example, alongside published implementation guides — so that automated systems 
104 
can discover and interpret the capabilities of a component reliably. As this practice matures it may 
105 
become a useful readiness criterion for shared digital resources and metadata registries. 
106 
 
 
107

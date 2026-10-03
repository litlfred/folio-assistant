---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-017-212-business-services-layer
section_title: "Business services layer"
section_number: 2.1.2
pages: 36-37
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
45 
2.1.1 Metadata registries and foundational components 
46 
The first layer comprises the shared components that are reusable not only across health 
47 
programmes but potentially across sectors. These establish authoritative, shared references for 
48 
the people, places, products and services, and workers within the health system; maintain the 
49 
longitudinal record of an individual's health and care; and provide the semantic and structural 
50 
foundations that make data consistently meaningful across the ecosystem. The core registries 
51 
— for clients (health service users), health facilities, health workers, and products — sit in this 
52 
layer, alongside the lifelong health record, terminology services, and the logical information 
53 
model repository. A practical test for whether a component belongs in this layer asks whether it 
54 
can be reused across many health domains, exposes a clean and stable interface, avoids 
55 
locking countries into domain-specific implementations, and supports a foundational capability 
56 
rather than programme-specific logic. Components that meet these criteria belong here; those 
57 
that do not, belong at the application layer, and the description of their functional requirements 
58 
falls outside the scope of this reference architecture. 
59 
 
60 
2.1.2 Business services layer 
61 
The second layer describes a grouping of health capabilities that national health systems strive 
62 
to deliver across their principal domains — clinical care, public health, the health supply chain, 
63 
and health financing — together with the shared components that enable them. It sets out what 
64 
countries need to achieve through the lens of the capabilities required for each business service 
65 
first and then describes the shared components that the health system uses to realise those 
66 
capabilities. Clinical care, for instance, draws on a computable decision support engine that 
67 
evaluates a patient's health record against computable clinical guidelines to deliver 
68 
recommendations, alerts, and risk assessments at the point of care; health financing draws on 
69 
the Benefits Package Registry to support benefit design, eligibility, and claims; supply chain 
70 
 
 
26 
draws on a supplier registry to verify supplier credentials, inform procurement, and anchor 
71 
product traceability; and public health and analytics services draw on health management 
72 
information systems for programme monitoring and on public health surveillance platforms for 
73 
outbreak detection and response. These business-service components build on the metadata 
74 
registries and shared foundational components, and several serve more than one domain — 
75 
health management information systems, for instance, support clinical quality monitoring, 
76 
programme oversight, and financial accountability alike — which is what distinguishes shared 
77 
infrastructure from a programme-specific tool. 
78 
Beyond the two layers, there are certain capabilities that are properties of DPI-H as a whole 
79 
rather than features of any single component, layer, or business service. Interoperability is not 
80 
a component to be built once but a property that should pervade the architecture through shared 
81 
standards, common data models, and defined exchange patterns. Governance is cross-cutting 
82 
in the same way: it applies to every component and capability the architecture describes and is 
83 
treated as an architecture design principle below and elaborated on in the governance sub-
84 
chapter.  
85

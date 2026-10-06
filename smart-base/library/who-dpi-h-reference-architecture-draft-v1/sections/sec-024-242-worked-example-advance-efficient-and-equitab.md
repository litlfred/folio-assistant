---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-024-242-worked-example-advance-efficient-and-equitab
section_title: "Worked example: Advance Efficient and Equitable Health Financing"
section_number: 2.4.2
pages: 50-52
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
501 
Health financing determines whether funds reach providers in sufficient volume, are allocated 
502 
equitably, are accounted for transparently, and protect people from hardship when they seek 
503 
care. Digital infrastructure does not change what health financing has to achieve; it allows those 
504 
functions to be carried out with greater accuracy, transparency, and efficiency. 
505 
Whether a country finances health through taxation, insurance contributions, or a combination of 
506 
these, the underlying capabilities are broadly consistent: planning, executing, and monitoring 
507 
health budgets; raising and tracking revenue; determining who is covered and what they are 
508 
entitled to; pooling and allocating funds; purchasing services and paying providers; defining the 
509 
benefit package; and safeguarding funds and data against fraud and misuse. Mapped to the 
510 
architecture, these capabilities draw very largely on shared infrastructure that already exists for 
511 
other purposes: 
512 
Table 2.4: Health financing capabilities and the DPI-H components that supports them 
513 
Financing capability 
Supported by 
Identifying and confirming who is 
covered 
Client Registry (with foundational digital identity 
where available) 
Empanelling, accrediting, and 
credentialing providers 
Facility Registry, Health Workforce Registry 
Defining covered services, 
schemes, and entitlement rules 
Benefits Package Registry 
Pricing and reimbursing accurately 
Product Registry, Terminology Services 
Moving funds and reconciling 
payments 
Foundational payments DPI (consumed by claims 
and scheme systems) 
Exchanging financial and clinical 
data for payment 
Shared exchange standards (interoperability) 
The notable finding is how few new components health financing introduces. Almost everything 
514 
it needs is met by shared infrastructure that other goals already require — the client registry to 
515 
identify beneficiaries, the facility and workforce registries to empanel and credential providers, 
516 
the product registry and terminology services to make reimbursement accurate. Only one 
517 
genuinely new DPI-H component emerges from the financing analysis: the Benefits Package 
518 
Registry, an authoritative reference for covered services, schemes, and entitlement rules that 
519 
eligibility and purchasing functions across the system rely on. 
520 
These shared components do not, by themselves, run a financing system. The work is carried 
521 
out by the operational and functional applications that consume them — claims engines, 
522 
scheme administration platforms, government financial management systems — which draw on 
523 
 
 
40 
the shared infrastructure to enrol people, adjudicate claims, and pay providers. These 
524 
applications sit outside DPI-H: the architecture enables them rather than defining them, and the 
525 
shared components reduce the duplication and fragmentation they would otherwise carry. This 
526 
is the pattern the mapping is designed to surface, and it holds across all seven health goals. 
527 
Countries are encouraged to use the mapping spreadsheets in Appendix E as a reference when 
528 
assessing their own capability gaps, sequencing investments, and making the case for shared 
529 
infrastructure to financing authorities and development partners. Section 3.3 illustrates the 
530 
architecture in practice with a worked example, and the complete set of formal architecture 
531 
models is published as navigable views for readers who wish to engage with the architecture at 
532 
that level of detail.
533 
 
 
41 
3. 
The Reference Architecture for DPI-H 
1 
The reference architecture translates the analytical work of the health goals mapping into a 
2 
structured description that countries can use to design, assess, and sequence their digital health 
3 
infrastructure investments. It is intended to help national teams and implementers plan, build, and 
4 
evaluate health information systems that are interoperable, scalable, and aligned with established 
5 
practice. By offering a common vocabulary and a shared structural model, it supports consistent 
6 
description, comparison, and assessment of digital health architectures across different contexts 
7 
and implementations. Its purpose is to connect health goals to the capabilities that serve them 
8 
and the shared infrastructure that realises them, keeping investment decisions anchored to health 
9 
outcomes rather than to the solutions that happen to be available. 
10 
It is a reference model to be adapted, not a prescriptive architecture that countries must adhere 
11 
to. It offers a common vocabulary and a set of elements from which each country composes an 
12 
architecture suited to its own context — adopting, extending, or setting aside elements as local 
13 
priorities and constraints require.  
14 
This chapter is organised as follows: 
15 
• 
Section 3.1 describes the modelling approach and the shared language used to express 
16 
the architecture.  
17 
• 
Section 3.2 explains how to read and navigate the reference architecture, which is 
18 
maintained as a living model rather than a fixed picture.  
19 
• 
Section 3.3 illustrates the approach through worked examples for some health goals.  
20 
• 
Section 3.4 sets out the governance arrangements that surround the architecture. 
21 
• 
Section 3.5 introduces the DPI-H application components, whose full descriptions are 
22 
provided in appendix C. 
23 
• 
Section 3.6 describes the interoperability architecture within DPI-H, through which these 
24 
components work together as a coherent ecosystem 
25

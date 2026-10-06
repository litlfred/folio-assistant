---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-040-3532-the-business-services-layer
section_title: "The business services layer"
section_number: 3.5.3.2
pages: 81-82
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
687 
The business services layer holds the shared, reusable components that draw on and extend the 
688 
foundational shared data layer for health (the core registries, the Lifelong Health Record, the 
689 
 
 
71 
Terminology Service, and the LIMR) to enable the more complex capabilities a health system 
690 
delivers across clinical care, public health, analytics and governance, the health supply chain, 
691 
and health financing. Like the foundational components, these are shared infrastructure rather 
692 
than systems owned by or designed for a single programme: 
693 
• Computable Decision Support Engine — delivers computable clinical guidance to point-
694 
of-care systems, drawing on terminology, the lifelong health record, and other shared data. 
695 
• Public Health Surveillance Platform — supports the detection, monitoring, and reporting 
696 
of conditions and events across populations. 
697 
• Health Management Information System — supports aggregate and population-level 
698 
reporting, dashboards, and indicator monitoring for planning, performance management, 
699 
and governance, drawing on the shared data layer. It addresses cohort- and population-
700 
level analytical questions, complementing the Computable Decision Support Engine, which 
701 
acts at the level of the individual person and encounter. 
702 
• Supplier Registry — the authoritative source of identity, classification, and regulatory 
703 
status of the suppliers engaged in the health supply chain, reusable across procurement, 
704 
contract management, vendor performance, and traceability. It sits in this layer as a health 
705 
supply chain domain component, that other business — health financing, for example — 
706 
can also draw on. 
707 
• Benefits Package Registry — the authoritative record of the benefits and schemes that 
708 
define what is covered, for whom, and under what conditions, reusable across health 
709 
financing, clinical, and supply-chain functions. 
710 
Countries typically build toward the business services layer progressively, as their foundational 
711 
registries mature. It is no less essential to a complete, sustainable, and well-governed 
712 
architecture. 
713 
Together, these two layers describe the full scope of DPI-H application components: the shared 
714 
data and semantic foundations, and the shared services that build on them. 
715 
 
716 
Full descriptions of all DPI-H application components, with their core attributes, functional and 
717 
data requirements, and governance considerations, are provided in Appendix C. 
718 
 
719 
 
720 
 
721

---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-036-351-what-distinguishes-a-dpi-h-application-compo
section_title: "What Distinguishes a DPI-H Application Component"
section_number: 3.5.1
pages: 74-76
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
544 
Not every digital system in a national health ecosystem qualifies as DPI-H. An application 
545 
component earns that designation by meeting a specific set of criteria that distinguish shared 
546 
public infrastructure from programme-specific tools or functional applications. The design of a 
547 
DPI-H component satisfies the core DPI-H principles, and the following defining characteristics 
548 
further distinguish them from other digital health applications and services: 
549 
 
 
64 
• 
Reusability across multiple health programmes and use cases without modification to 
550 
its core design.  
551 
• 
Ability to expose stable, standards-based interfaces that allow any conformant system 
552 
to connect to it without requiring bespoke integration.  
553 
• 
Ability to support foundational health system functions rather than programme-
554 
specific logic and serve the ecosystem as a whole rather than a single programme's 
555 
needs. 
556 
• 
They should be publicly governed, ensuring that no single programme, donor, or 
557 
vendor controls access to or evolution of the capability it provides. 
558 
• 
They should be governed across their lifecycle — backed by clear governance 
559 
arrangements for its deployment, operation, and evolution, distinct from the question of 
560 
who controls it. 
561 
• 
They should be non-transactional — not point-of-care workflow engines or clinical 
562 
transaction processors, but enabling infrastructure that orchestrates national-level data 
563 
and makes it available to the systems that do perform those functions.  
564 
• 
They should be functionally stable. In essence, their core function and interface 
565 
specifications should be designed to remain consistent over time, providing a reliable 
566 
foundation that operational applications and clinical systems can depend upon without 
567 
being disrupted by changes in those systems. 
568 
• 
They should be technology-neutral. Meaning that they should be specified at the level 
569 
of function and capability rather than implementation, so that countries can choose the 
570 
technology through which a component is delivered without being constrained to a 
571 
particular product or vendor.  
572 
 
573 
These characteristics have practical consequences for what countries invest in and govern 
574 
collectively. An application component that meets them justifies shared investment and shared 
575 
governance. One that does not — however useful — belongs at the functional application layer, 
576 
drawing on shared infrastructure rather than constituting it. 
577 
 
578 
Box 3.1: Criteria for DPI-H Application Components 
 
DPI-H should serve as a shared layer upon which multiple functional applications, point-of-
service and programme-specific systems depend. DPI-H application components should: 
 
• 
Be reusable across multiple health programmes and use cases without modification to 
its core design 
• 
Expose stable, standards-based interfaces that allow any conformant system to 
connect without bespoke integration 
• 
Support foundational health system functions rather than programme-specific logic 
• 
Be publicly governed — no single programme, donor, or vendor controls access or 
evolution 
• 
Be governed across its lifecycle — have clear governance frameworks that guide 
deployment, operation, and evolution 
• 
Be non-transactional — not a point-of-care workflow engine, but enabling 
infrastructure that orchestrates national-level data 
 
 
65 
• 
Be functionally stable — core function and interface specifications remain consistent, 
providing a reliable foundation for operational systems 
• 
Be technology-neutral — specified at the level of function and capability, not 
implementation 
 
 
579 
 
580 
This boundary places several familiar systems outside the DPI-H: 
581 
• 
Point-of-care clinical applications — the systems clinicians use to record and act on care — 
582 
and other functional applications such as supply-chain operations depend on the 
583 
infrastructure but are not part of it.  
584 
• 
Interoperability is treated as a cross-cutting capability rather than a component, and is 
585 
addressed in Section 3.6.  
586 
• 
Foundational, cross-sectoral infrastructure — such as civil registration and vital statistics 
587 
systems, or a national geospatial (common geo) registry — belongs to the foundational digital 
588 
public infrastructure on which health builds; the health components state how they integrate 
589 
with it, such as the Health Facility Registry’s integration with a national geospatial registry, 
590 
rather than reproducing it. 
591 
 
592 
A defining feature of the core health registries is that they are described as authoritative, canonical 
593 
sources, governed at national level. The guidance describes them at two levels. At the policy and 
594 
governance level, a registry is the single authoritative source for its domain. At the implementation 
595 
level, a country may hold it centrally, federate it across systems, or combine the two; the 
596 
architecture does not prescribe a centralised implementation. The same distinction separates a 
597 
metadata component from an operational system: the Benefits Package Registry, for example, is 
598 
the authoritative record of the benefits and schemes a health system offers — a DPI-H component 
599 
— while the claims and payment systems that act on that record are functional applications 
600 
outside the DPI-H. 
601 
Where established terms are in wide use, the guidance retains them and notes the alternatives, 
602 
so that countries can map their existing systems. The Client Registry, for instance, is known in 
603 
some settings as a master patient index; and the term registry is preferred over catalogue for the 
604 
product component, because it reflects governance and lifecycle management rather than a 
605 
simple list. 
606 
 
607

---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-014-151-the-health-sector-goals
section_title: "The Health Sector Goals"
section_number: 1.5.1
pages: 33-35
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
461 
 
462 
The first goal is building trusted data foundations. The core principle is that health data 
463 
should be "captured once and used many times”. Countries currently invest heavily in reporting 
464 
systems where the same data is re-entered at multiple levels of the system, leading to high 
465 
burden, low quality, and limited comparability. The architecture defines the shared infrastructure 
466 
that enables a single, high-quality data capture to support clinical care, facility management, 
467 
population analytics including CRVS and mortality, public health monitoring, and domestic AI 
468 
development simultaneously. 
469 
 
470 
The second goal is supporting a capable, well-distributed health workforce. Health workers 
471 
should receive timely and accurate pay, their qualifications should be verifiable, and their career 
472 
development should be supported. This requires an authoritative health workforce registry that 
473 
is continuously maintained, linked to payroll systems, connected to professional licensing 
474 
authorities, and able to support analytics on workforce distribution and retention. 
475 
 
476 
The third goal is ensuring quality and continuity of care. Clinicians need access to a patient's 
477 
relevant history at the point of care, and their clinical decisions should be supported by 
478 
evidence-based protocols that are current and computable. This requires longitudinal health 
479 
record infrastructure that is captured across an individual’s lifetime, a computable clinical 
480 
decision support capability, and the interoperability to make both accessible across facilities and 
481 
over time. 
482 
 
483 
The fourth goal is establishing trusted personal health records with every person having a 
484 
right to their own health record. The architecture supports individuals having access to secure, 
485 
portable, and verifiable records of their health encounters, vaccinations, diagnoses, and 
486 
treatments — records that follow them across providers and that they control through 
487 
meaningful consent mechanisms. 
488 
 
489 
 
 
23 
The fifth goal is optimised supply chain management. Health products need to reach the right 
490 
place at the right time. Real-time visibility into inventory, consumption, and logistics — 
491 
supported by standardised product catalogues and interoperable data exchange between 
492 
supply chain actors — prevents stock-outs and wastage and ensures that essential medicines 
493 
and commodities are available where they are needed. 
494 
 
495 
The sixth goal is advancing efficient and equitable health financing. Health financing 
496 
systems need to be transparent, efficient, sustainable and ensure financial protection as well as 
497 
service coverage . Digital tools that link service delivery data to financing flows, validate claims, 
498 
and support provider payments can substantially reduce leakage and delay while improving 
499 
health coverage scheme management. 
500 
 
501 
The seventh goal is strengthening climate and epidemic resilience. Countries need to detect 
502 
outbreaks early and respond fast, and they need to anticipate and manage the health impacts of 
503 
climate change. This requires standardised environmental and disease surveillance data, 
504 
analytical tools that can identify signals in that data, and coordination mechanisms that can 
505 
trigger and track response activities. 
506 
 
507 
The outcomes these goals describe are not automatic. The extent to which they are realised 
508 
depends on the quality of implementation and the context in which it takes place; evidence to 
509 
date shows that benefits anticipated in design are not always borne out in practice. For this 
510 
reason, the implementation of DPI-H should be evaluated as it proceeds — to evidence the 
511 
benefits actually delivered, identify and mitigate risks, and share learning across programmes 
512 
and countries. Together, these goals point towards a health system that has moved beyond 
513 
digitisation as an end in itself — toward a system that is more equitable in who it reaches, more 
514 
efficient in how it operates, more responsive to the people who deliver care, and more resilient 
515 
in the face of the challenges that are increasingly certain to come. 
516 
 
517 
 
518 
 
 
24 
2. 
DPI-H Reference Architecture 
1 
Framework 
2 
The reference architecture for health Digital Public Infrastructure (DPI-H) guidance provides 
3 
countries with a structured architectural framework for designing national digital health 
4 
infrastructure that is organised around the health goals countries are pursuing, governed by 
5 
clear principles, and built on shared, reusable components. It is not a prescriptive blueprint that 
6 
mandates specific products or solutions. It is an adaptive framework — one that countries can 
7 
engage with at the level that is relevant to them, using it to assess gaps, sequence investments, 
8 
and make design decisions that are coherent with both their immediate context and their long-
9 
term aspirations. In doing so, it gives countries a coherent way to see how the parts of their 
10 
digital health environment relate to one another and how individual investments contribute to the 
11 
whole. 
12 
Its contribution is to organise national infrastructure around shared, governed components — 
13 
core registries and semantic and terminology services — connected through a standards-based 
14 
means of exchange, so that the data health systems depend on become more consistent, 
15 
trustworthy, and secure, and can be reused across programmes rather than rebuilt for each 
16 
one. Better-governed data is the proximate benefit; it is what allows countries to plan, finance, 
17 
and deliver health services with greater confidence. 
18 
The reference architecture framework was developed using The Open Group® Architecture 
19 
Framework (TOGAF®) as its methodological foundation12. TOGAF® provides a structured, 
20 
established approach to enterprise architecture that works from business goals through 
21 
capabilities and application services that support them, to the technical components, so that 
22 
architectural decisions remain traceable to the health goals they are intended to support. In 
23 
practice this means a country can follow the chain in both directions: from any component or 
24 
capability back to the health goal it serves, and forward to the specifications that govern its 
25 
implementation. Where established frameworks and existing resources already cover part of 
26 
this ground, they are referenced rather than duplicated. 
27 
 
28

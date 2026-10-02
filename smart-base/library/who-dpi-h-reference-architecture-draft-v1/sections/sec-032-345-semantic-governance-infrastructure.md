---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-032-345-semantic-governance-infrastructure
section_title: "Semantic Governance Infrastructure"
section_number: 3.4.5
pages: 68-73
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
373 
The metadata registries that form the foundation of DPI-H — the client, health facility, health 
374 
workforce and product registries, the Terminology Service, and the Logical Information Model 
375 
Repository — are only as reliable as the governance that maintains them. A Terminology Service 
376 
can be deployed and operational, and a Logical Information Model Repository can hold a rich 
377 
catalogue of national data structures, yet without sustained, structured governance over how 
378 
these assets are created, versioned, reviewed, published and distributed, the infrastructure they 
379 
provide becomes progressively unreliable. In real implementations, countries have encountered 
380 
concepts deprecated without notice, version conflicts between systems, and national 
381 
implementation guides drifting from the models they were derived from. The reference 
382 
architecture introduces the Semantic Governance Infrastructure (SGI) to address these 
383 
failures: it is the cross-cutting capability that keeps the metadata registry components accurate, 
384 
consistent and trustworthy, so that the semantic consistency they are intended to provide does 
385 
not degrade as the health digital ecosystem grows. 
386 
A governance capability, not a technical component 
387 
Before describing how it works, it is important to be clear about what SGI is and is not. It is not a 
388 
new software product or a centralised technical component, and it is not an information-
389 
technology concern to be delegated to a systems team. It is a cross-cutting capability — 
390 
predominantly a matter of institutions, roles and processes — through which a health system 
391 
governs the meaning of its data. The stakeholders who submit change requests, review and 
392 
approve content, maintain national extensions of global standards, and ensure that local clinical 
393 
reality is reflected in nationally governed models are as essential to SGI as any software. 
394 
Experience in comparable settings shows that governance often runs on tools that were not 
395 
 
 
58 
purpose-built for it, and that the quality of the process depends far more on the clarity of roles, 
396 
decision rights and workflows than on the sophistication of the technology. Countries should 
397 
therefore invest first in the committees, roles, decision rights and community processes of 
398 
governance, and only afterwards in tooling. 
399 
SGI is distinct from runtime services 
400 
This governance capability is distinct from the runtime services that operate alongside it. A 
401 
Terminology Service deployed to support clinical data capture performs a runtime function — 
402 
vocabulary lookups, validation of coded entries, and distribution of value sets to consuming 
403 
systems. SGI operates at a different level: it determines what content those services hold, how it 
404 
is reviewed and approved, when it is published, how change is managed, and how consuming 
405 
systems are notified. The two are complementary and mutually necessary: runtime services 
406 
without governance produce content that cannot be trusted, while governance without runtime 
407 
services produces decisions that cannot be operationalised. This integrated, cross-registry 
408 
governance layer is a new aspect that DPI-H introduces. Existing health information architecture 
409 
specifications, including OpenHIE, specify the runtime terminology service but not the cross-
410 
registry semantic-governance described here — the coordinated review workflows, multi-
411 
stakeholder curation, release management and harmonisation flows between global, national and 
412 
local content that span the Terminology Service, the Logical Information Model Repository and 
413 
national data models together. SGI is therefore presented as cross-cutting rather than a 
414 
component of any single registry, because its scope spans all of the metadata registry 
415 
components and because its processes need to be coherent across them rather than managed 
416 
independently for each. 
417 
How SGI relates to runtime and content 
418 
It is helpful to see this capability in relation to the services around it. Three layers can be 
419 
distinguished. 
420 
1. The governance layer comprises the policies, roles, decision rights and workflows through 
421 
which registry content is managed across its lifecycle — how requests for new terms or model 
422 
changes are submitted, how they are reviewed by the relevant stakeholders, how approved 
423 
changes are packaged and published, and how the ongoing quality and currency of content is 
424 
assessed.  
425 
2. The runtime layer comprises the operational terminology servers, repository deployments and 
426 
national data model infrastructure through which governed content is made available to 
427 
consuming systems.  
428 
3. The content and application layer comprises the clinical systems, analytics platforms and 
429 
applications that consume governed content and, in doing so, generate the feedback that informs 
430 
the next governance cycle. 
431 
 
 
59 
 
432 
 
433 
Figure 3.4.1: Semantic Governance Infrastructure: the governance, runtime, and content-and-application layers, and 
434 
the flow of content between them 
435 
 
436 
What SGI does: five capability categories 
437 
Where the three layers describe where governance sits, the next question is what it does. Within 
438 
the governance layer, five categories of capability recur across the metadata registry components. 
439 
They are described here at the level of capability clusters; a fuller breakdown of the individual 
440 
capabilities within each is provided in Appendix F, and the detailed specification of any one of 
441 
them is a matter for dedicated standards efforts and national programmes rather than for this 
442 
architecture. 
443 
 
444 
SGI Capability 
category 
What it covers 
Why it matters 
Intake 
Receiving and registering change 
requests from stakeholders, ingesting 
new releases from upstream 
standards bodies, and handling 
deprecation notices, with triage and a 
transparent, auditable queue 
Keeps national standards current 
with global updates and local 
needs without ad-hoc, error-prone 
processes 
Authoring and 
publication 
Coordinating the review, approval, 
versioning and controlled release of 
new and changed content according to 
Ensures that only vetted, traceable 
changes reach the health system, 
reducing costly downstream errors 
 
 
60 
SGI Capability 
category 
What it covers 
Why it matters 
defined business rules, with audit trail 
and provenance 
Monitoring 
Tracking adherence to governance 
rules and content quality, and, as a 
separate concern, tracking field-level 
use and adoption of published 
standards 
Reveals whether published 
standards are conformant and 
whether they are actually being 
used, surfacing drift before it 
causes harm 
Distribution 
Providing reliable, access-controlled 
delivery of content across a range of 
consumption modalities within a 
defined architecture 
Makes national standards 
practically retrievable by all 
implementers — a standard no 
one can retrieve is a standard no 
one follows 
Consumption 
Enabling downstream stakeholders to 
discover, retrieve and integrate 
published content, and enabling 
maintainers to consume content from 
standards bodies and capture 
feedback from the field 
Lowers the barrier for systems to 
align with national standards, 
accelerating interoperability across 
the ecosystem 
 
445 
Two points qualify this model. First, monitoring should be understood as two related but separate 
446 
activities: monitoring of the publication process and content quality on the one hand, and 
447 
monitoring of use and adoption in the field on the other; the two answer different questions and 
448 
both are needed. Second, the definition and maintenance of policy is not confined to any one 
449 
category — it cuts across all of them, and is the connective tissue that makes the capabilities 
450 
function as a coherent whole rather than as isolated workflows.  
451 
Approaches to implementation 
452 
Countries need not achieve full semantic governance maturity before deploying metadata 
453 
registries, and the appropriate starting point varies considerably by context. In highly regulated 
454 
settings — where data structures may be encoded in legislation — a comprehensive governance 
455 
framework may need to be established before deployment proceeds. In many lower-resource 
456 
settings, deployment can and should precede full governance maturity, with governance 
457 
capabilities built incrementally as the ecosystem develops. A maturity-spectrum approach is 
458 
therefore appropriate, progressing from minimal reference-list management, through structured 
459 
versioning and change workflows, to fully governed, multi-stakeholder terminology and 
460 
information-model ecosystems. What matters from the outset is that early deployment decisions 
461 
do not close off the path to stronger governance later, and that a clear direction of travel is 
462 
established even where immediate capacity is limited. Established terminology-governance 
463 
maturity models can be applied, with some abstraction, across the metadata registry components. 
464 
 
 
61 
 
465 
Figure 3.4.2 A terminology maturity spectrum, from minimal reference-list management to a fully governed, multi-
466 
stakeholder ecosystem. Adapted from the OpenHIE Terminology Service maturity model24 
467 
 
468 
Global, national and local content 
469 
SGI also mediates the relationship between global, national and local content. A maximalist global 
470 
model imposed on countries without local adaptation mechanisms will not be adopted; equally, 
471 
uncoordinated national models that cannot speak to one another reproduce the fragmentation the 
472 
architecture seeks to resolve. The governance framework should therefore support both top-down 
473 
harmonisation — keeping national models coherent with global standards — and upward sensing 
474 
— capturing local experience, term requests and adaptation needs so they can inform models at 
475 
higher levels. It should also help countries manage their interfaces with the standards 
476 
development organisations on whose content they depend, including the lag that arises when an 
477 
external standard updates and national implementations have to respond. Grounding national 
478 
arrangements in established governance frameworks gives countries a tested starting point. 
479 
Several exist to draw on, such as HL7's Unified Terminology Governance (UTG) process for 
480 
consensus-based authoring and release of terminology artefacts, and SNOMED International's 
481 
National Release Centre model, through which member countries govern their national editions 
482 
of clinical terminology; the OpenHIE Architecture Specification is also relevant, though it specifies 
483 
the runtime terminology service rather than the cross-registry governance. Each of these governs 
484 
a single standard or service; what SGI adds is the coordination of such arrangements across 
485 
registries at national level. 
486 
 
24 The OpenHIE terminology management maturity model 
https://wiki.ohie.org/download/attachments/9437189/Terminology_Services_%20Maturity%20Model-
2018.pptx?version=1&modificationDate=1550671780655&api=v2 
 
 
62 
 
487 
 
488 
Figure 3.4.3 — Hierarchical terminology content, from global reference standards to facility-level dictionaries, with 
489 
top-down customisation and upward feedback. Adapted from the OpenHIE National Health Data Dictionary (NHDD) 
490 
framework.25 
491 
Countries implementing DPI-H should treat SGI not as an optional enhancement to their metadata 
492 
registries but as foundational for those registries to deliver the semantic consistency that DPI-H 
493 
depends upon. 
494

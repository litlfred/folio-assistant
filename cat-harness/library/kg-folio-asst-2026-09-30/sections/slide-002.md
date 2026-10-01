---
doc_id: kg-folio-asst-2026-09-30
doc_title: kg-folio-asst-2026-09-30
section_id: slide-002
section_title: Accessing WHO L1 corpus
title_source: placeholder
pages: 2-2
slide: 2
hidden: false
source_file: kg-folio-asst-2026-09-30.pptx
source_sha256: bb875471ee78553b
text_source: embedded
granularity: slide
---
The World Health Organization (WHO) manages a vast ecosystem of public health information, currently split between literature repositories like IRIS (DSpace) and structured indicators within the World Health Data Hub. As the organization unifies these data assets into a single comprehensive Knowledge Graph (KG), the infrastructure requires a platform built with room to grow up to a 10 Terabyte (TB) storage threshold with high throughput without high network costs.
Prohibitive Cloud Costs: Traditional cloud vendors charge unpredictable fees based on download volume (Egress Fees). Serving 10 TB of files globally can trigger thousands of dollars in monthly budget overruns.
System Overload: High-volume automated traffic, particularly during global health emergencies, risks crashing primary internal data systems.
Trust and Provenance: In an era of automated misrepresentation and AI-generated content, the WHO must definitively prove the authenticity and chain of custody for every published dataset, medical guideline, and statistical report
Edge Architecture with Cryptographic Governance
We propose implementing an Origin Isolation architecture powered by the open-source folio-assistant framework. Instead of exposing active internal databases to the open web, all core systems are completely disconnected from public traffic.
Every night, folio-assistant runs an automated, lightweight background routine that aggregates data from both IRIS and the Data Hub, standardizes the metadata into an interconnected Knowledge Graph format (JSON-LD / JSON), and pushes the entire static package out to Cloudflare R2 storage.
Crucially, the pipeline integrates cryptographically signed assets directly into the build layer. Every file and metadata node is signed at the moment of generation, embedding immutable cryptographic proof of origin before it ever reaches the cloud.

## Images

- `image18.png` — alt: (none) [missing]

---
doc_id: kg-folio-asst-2026-09-30
doc_title: kg-folio-asst-2026-09-30
section_id: slide-010
section_title: Slide 10
title_source: none
pages: 10-10
slide: 10
hidden: false
source_file: kg-folio-asst-2026-09-30.pptx
source_sha256: bb875471ee78553b
text_source: embedded
granularity: slide
---
who/smart-base
who/smart-kg
who/smart-imz-test
depends
who/smart-kg-tools
references
who/smart-immz
who/smart-base-tools
references
Tool repos:
may implement a Skills through coordinated use of Tools (scripts, retrieving and running software, remote/local services/docker,etc.)
may make Tools available to agents via  mcp services
may make make Tool available for local execution.
may configure Tools for the test harness (ITB)
may define more than one Tool for a Skill
Content repos:
may define schemas for Content types for nodes of a KG
may instantiate instances of Content types
may define Skills needed for publication and consumption of Content instances
may designat Skills as any of, mechanical, or human
must constrain Skills i/o with schemas (json,.ts)
Test repos:
may contain test data
may contain test data generation templates and/or configuration data
may define (FHIR?) Test Plans
may define test language dialects (Gherkin)
may make test data available for ITB and/or SME/author review
utilizes
utilizes
Consumer apps:
may utilize KG schemas and instance data from Content repos
may execute decision logic or indicator calculation from Content repos
may utilize Test repos and/or Tool Data repos in developing their apps, preparing for connectathon, or compliance testing
utilizes
app:ohs-*
app:anthropic-mcp
app:turn.io
references
utilizes
depends

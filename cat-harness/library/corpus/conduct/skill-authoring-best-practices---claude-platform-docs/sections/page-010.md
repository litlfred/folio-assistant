---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-010
section_title: "Page 10"
pages: 10-10
pdf_page: 10
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Pattern 3: Conditional details
Show basic content, link to advanced content:
Claude reads REDLINING.md or OOXML.md only when the user needs those features.
Avoid deeply nested references
Claude may partially read files when they're referenced from other referenced files. When
encountering nested references, Claude might use commands like head -100 to preview content
rather than reading entire files, resulting in incomplete information.
Keep references one level deep from SKILL.md. All reference files should link directly from
SKILL.md to ensure Claude reads complete files when needed.
# BigQuery Data Analysis
## Available datasets
**Finance**: Revenue, ARR, billing → See [reference/finance.md](reference/finance.md)
**Sales**: Opportunities, pipeline, accounts → See [reference/sales.md](reference/sales
**Product**: API usage, features, adoption → See [reference/product.md](reference/produ
**Marketing**: Campaigns, attribution, email → See [reference/marketing.md](reference/m
## Quick search
Find specific metrics using grep:
```bash
grep -i "revenue" reference/finance.md
grep -i "pipeline" reference/sales.md
grep -i "api usage" reference/product.md
```
# DOCX Processing
## Creating documents
Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).
## Editing documents
For simple edits, modify the XML directly.
**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)

Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
10/32

---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Pattern 1: High-level guide with references
Claude loads FORMS.md, REFERENCE.md, or EXAMPLES.md only when needed.
Pattern 2: Domain-specific organization
For Skills with multiple domains, organize content by domain to avoid loading irrelevant context.
When a user asks about sales metrics, Claude only needs to read sales-related schemas, not
finance or marketing data. This keeps token usage low and context focused.
bigquery-skill/
SKILL.md (overview and navigation)
reference/
finance.md (revenue, billing metrics)
sales.md (opportunities, pipeline)
product.md (API usage, features)
marketing.md (campaigns, attribution)
---
name: pdf-processing
description: Extracts text and tables from PDF files, fills forms, and merges documents
---
# PDF Processing
## Quick start
Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
## Advanced features
**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
**Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns

SKILL.md
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
9/32

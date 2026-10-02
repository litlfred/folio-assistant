---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-023
section_title: "Page 23"
pages: 23-23
pdf_page: 23
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Configuration parameters should also be justified and documented to avoid "voodoo constants"
(Ousterhout's law). If you don't know the right value, how will Claude determine it?
Good example: Self-documenting:
Bad example: Magic numbers:
Provide utility scripts
Even if Claude could write a script, pre-made scripts offer advantages:
Benefits of utility scripts:
More reliable than generated code
Save tokens (no need to include code in context)
Save time (no code generation required)
Ensure consistency across uses
# HTTP requests typically complete within 30 seconds
# Longer timeout accounts for slow connections
REQUEST_TIMEOUT = 30
# Three retries balances reliability vs speed
# Most intermittent failures resolve by the second retry
MAX_RETRIES = 3

TIMEOUT = 47  # Why 47?
RETRIES = 5  # Why 5?
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
23/32

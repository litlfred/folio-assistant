---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Use when:
A preferred pattern exists
Some variation is acceptable
Configuration affects behavior
Example:
Low freedom (specific scripts, few or no parameters):
Use when:
Operations are fragile and error-prone
Consistency is critical
A specific sequence must be followed
Example:
Analogy: Think of Claude as a robot exploring a path:
Narrow bridge with cliffs on both sides: There's only one safe way forward. Provide specific
guardrails and exact instructions (low freedom). Example: database migrations that must run
in exact sequence.
## Generate report
Use this template and customize as needed:
```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data
    # Generate output in specified format
    # Optionally include visualizations
```

## Database migration
Run exactly this script:
```bash
python scripts/migrate.py --verify --backup
```
Do not modify the command or add additional flags.
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
3/32

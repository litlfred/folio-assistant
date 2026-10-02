---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-027
section_title: "Page 27"
pages: 27-27
pdf_page: 27
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
How Claude accesses Skills:
1. Metadata pre-loaded: At startup, the name and description from all Skills' YAML frontmatter
are loaded into the system prompt
2. Files read on-demand: Claude uses bash Read tools to access SKILL.md and other files from
the filesystem when needed
3. Scripts executed efficiently: Utility scripts can be executed through bash without loading
their full contents into context. Only the script's output consumes tokens
4. No context penalty for large files: Reference files, data, or documentation don't consume
context tokens until actually read
File paths matter: Claude navigates your skill directory like a filesystem. Use forward slashes
( reference/guide.md ), not backslashes
Name files descriptively: Use names that indicate content: form_validation_rules.md , not
doc2.md
Organize for discovery: Structure directories by domain or feature
Good: reference/finance.md , reference/sales.md
Bad: docs/file1.md , docs/file2.md
Bundle comprehensive resources: Include complete API docs, extensive examples, large
datasets; no context penalty until accessed
Prefer scripts for deterministic operations: Write validate_form.py rather than asking
Claude to generate validation code
Make execution intent clear:
"Run analyze_form.py to extract fields" (execute)
"See analyze_form.py for the extraction algorithm" (read as reference)
Test file access patterns: Verify Claude can navigate your directory structure by testing with
real requests
Example:
bigquery-skill/
SKILL.md (overview, points to reference files)
reference/
finance.md (revenue metrics)
sales.md (pipeline data)
product.md (usage analytics)
When the user asks about revenue, Claude reads SKILL.md, sees the reference to
reference/finance.md , and calls bash to read just that file. The sales.md and product.md files
remain on the filesystem, consuming zero context tokens until needed. This filesystem-based
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
27/32

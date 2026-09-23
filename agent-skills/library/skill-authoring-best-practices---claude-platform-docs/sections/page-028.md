---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-028
section_title: "Page 28"
pages: 28-28
pdf_page: 28
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
model is what enables progressive disclosure. Claude can navigate and selectively load exactly
what each task requires.
For complete details on the technical architecture, see How Skills work in the Skills overview.
MCP tool references
If your Skill uses MCP (Model Context Protocol) tools, always use fully qualified tool names to
avoid "tool not found" errors.
Format: ServerName:tool_name
Example:
Where:
BigQuery and GitHub are MCP server names
bigquery_schema and create_issue are the tool names within those servers
Without the server prefix, Claude may fail to locate the tool, especially when multiple MCP servers
are available.
Avoid assuming tools are installed
Don't assume packages are available:
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
Use the GitHub:create_issue tool to create issues.

**Bad example: Assumes installation**:
"Use the pdf library to process the file."
**Good example: Explicit about dependencies**:
"Install required package: `pip install pypdf`
Then use it:
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```"
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
28/32

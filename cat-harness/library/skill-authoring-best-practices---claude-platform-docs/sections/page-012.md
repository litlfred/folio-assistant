---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Workflows and feedback loops
Use workflows for complex tasks
Break complex operations into clear, sequential steps. For particularly complex workflows, provide
a checklist that Claude can copy into its response and check off as it progresses.
Example 1: Research synthesis workflow (for Skills without code):
This example shows how workflows apply to analysis tasks that don't require code. The checklist
pattern works for any complex, multistep process.
Example 2: PDF form filling workflow (for Skills with code):
## Research synthesis workflow
Copy this checklist and track your progress:
```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```
**Step 1: Read all source documents**
Review each document in the `sources/` directory. Note the main arguments and supportin
**Step 2: Identify key themes**
Look for patterns across sources. What themes appear repeatedly? Where do sources agree
**Step 3: Cross-reference claims**
For each major claim, verify it appears in the source material. Note which source suppo
**Step 4: Create structured summary**
Organize findings by theme. Include:
- Main claim
- Supporting evidence from sources
- Conflicting viewpoints (if any)
**Step 5: Verify citations**
Check that every claim references the correct source document. If citations are incompl
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
12/32

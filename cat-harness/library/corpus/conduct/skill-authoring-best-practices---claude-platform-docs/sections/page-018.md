---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-018
section_title: "Page 18"
pages: 18-18
pdf_page: 18
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
If workflows become large or complicated with many steps, consider pushing them into
separate files and tell Claude to read the appropriate file based on the task at hand.
Evaluation and iteration
Build evaluations first
Create evaluations BEFORE writing extensive documentation. This ensures your Skill solves real
problems rather than documenting imagined ones.
Evaluation-driven development:
1. Identify gaps: Run Claude on representative tasks without a Skill. Document specific failures
or missing context
2. Create evaluations: Build three scenarios that test these gaps
3. Establish baseline: Measure Claude's performance without the Skill
4. Write minimal instructions: Create just enough content to address the gaps and pass
evaluations
5. Iterate: Execute evaluations, compare against baseline, and refine
This approach ensures you're solving actual problems rather than anticipating requirements that
may never materialize.
Evaluation structure:
## Document modification workflow
1. Determine the modification type:
   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below
2. Creation workflow:
   - Use docx-js library
   - Build document from scratch
   - Export to .docx format
3. Editing workflow:
   - Unpack existing document
   - Modify XML directly
   - Validate after each change
   - Repack when complete
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
18/32

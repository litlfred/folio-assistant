---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
This shows the validation loop pattern using reference documents instead of scripts. The
"validator" is STYLE_GUIDE.md, and Claude performs the check by reading and comparing.
Example 2: Document editing process (for Skills with code):
The validation loop catches errors early.
Content guidelines
Avoid time-sensitive information
Don't include information that will become outdated:
Bad example: Time-sensitive (will become wrong):
Good example (use "old patterns" section):
## Content review process
1. Draft your content following the guidelines in STYLE_GUIDE.md
2. Review against the checklist:
   - Check terminology consistency
   - Verify examples follow the standard format
   - Confirm all required sections are present
3. If issues found:
   - Note each issue with specific section reference
   - Revise the content
   - Review the checklist again
4. Only proceed when all requirements are met
5. Finalize and save the document

## Document editing process
1. Make your edits to `word/document.xml`
2. **Validate immediately**: `python ooxml/scripts/validate.py unpacked_dir/`
3. If validation fails:
   - Review the error message carefully
   - Fix the issues in the XML
   - Run validation again
4. **Only proceed when validation passes**
5. Rebuild: `python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. Test the output document

If you're doing this before August 2025, use the old API.
After August 2025, use the new API.
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
14/32

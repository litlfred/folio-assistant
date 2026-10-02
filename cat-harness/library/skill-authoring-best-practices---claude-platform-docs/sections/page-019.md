---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-019
section_title: "Page 19"
pages: 19-19
pdf_page: 19
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
This example demonstrates a data-driven evaluation with a simple testing rubric. There is
not currently a built-in way to run these evaluations. Users can create their own evaluation
system. Evaluations are your source of truth for measuring Skill effectiveness.
Develop Skills iteratively with Claude
The most effective Skill development process involves Claude itself. Work with one instance of
Claude ("Claude A") to create a Skill that is used by other instances ("Claude B"). Claude A helps
you design and refine instructions, while Claude B tests them in real tasks. This works because
Claude models understand both how to write effective agent instructions and what information
agents need.
Creating a new Skill:
1. Complete a task without a Skill: Work through a problem with Claude A using normal
prompting. As you work, you'll naturally provide context, explain preferences, and share
procedural knowledge. Notice what information you repeatedly provide.
2. Identify the reusable pattern: After completing the task, identify what context you provided
that would be useful for similar future tasks.
Example: If you worked through a BigQuery analysis, you might have provided table names,
field definitions, filtering rules (such as "always exclude test accounts"), and common query
patterns.
3. Ask Claude A to create a Skill: "Create a Skill that captures this BigQuery analysis pattern we
just used. Include the table schemas, naming conventions, and the rule about filtering test
accounts."
Claude models understand the Skill format and structure natively. You don't need
special system prompts or a "writing skills" skill to get Claude to help create Skills.
Simply ask Claude to create a Skill and it generates properly structured SKILL.md
content with appropriate frontmatter and body content.
4. Review for conciseness: Check that Claude A hasn't added unnecessary explanations. Ask:
"Remove the explanation about what win rate means - Claude already knows that."
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using an appropriate PDF processing library or com
    "Extracts text content from all pages in the document without missing any pages",
    "Saves the extracted text to a file named output.txt in a clear, readable format"
  ]
}
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
19/32

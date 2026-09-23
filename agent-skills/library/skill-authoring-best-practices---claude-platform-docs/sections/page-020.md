---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-020
section_title: "Page 20"
pages: 20-20
pdf_page: 20
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
5. Improve information architecture: Ask Claude A to organize the content more effectively.
For example: "Organize this so the table schema is in a separate reference file. We might add
more tables later."
6. Test on similar tasks: Use the Skill with Claude B (a fresh instance with the Skill loaded) on
related use cases. Observe whether Claude B finds the right information, applies rules
correctly, and handles the task successfully.
7. Iterate based on observation: If Claude B struggles or misses something, return to Claude A
with specifics: "When Claude used this Skill, it forgot to filter by date for Q4. Should we add a
section about date filtering patterns?"
Iterating on existing Skills:
The same hierarchical pattern continues when improving Skills. You alternate between:
Working with Claude A (the expert who helps refine the Skill)
Testing with Claude B (the agent using the Skill to perform real work)
Observing Claude B's behavior and bringing insights back to Claude A
1. Use the Skill in real workflows: Give Claude B (with the Skill loaded) actual tasks, not test
scenarios
2. Observe Claude B's behavior: Note where it struggles, succeeds, or makes unexpected
choices
Example observation: "When I asked Claude B for a regional sales report, it wrote the query
but forgot to filter out test accounts, even though the Skill mentions this rule."
3. Return to Claude A for improvements: Share the current SKILL.md and describe what you
observed. Ask: "I noticed Claude B forgot to filter test accounts when I asked for a regional
report. The Skill mentions filtering, but maybe it's not prominent enough?"
4. Review Claude A's suggestions: Claude A might suggest reorganizing to make rules more
prominent, using stronger language such as "MUST filter" instead of "always filter," or
restructuring the workflow section.
5. Apply and test changes: Update the Skill with Claude A's refinements, then test again with
Claude B on similar requests
6. Repeat based on usage: Continue this observe-refine-test cycle as you encounter new
scenarios. Each iteration improves the Skill based on real agent behavior, not assumptions.
Gathering team feedback:
1. Share Skills with teammates and observe their usage
2. Ask: Does the Skill activate when expected? Are instructions clear? What's missing?
3. Incorporate feedback to address gaps in your own usage patterns
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
20/32

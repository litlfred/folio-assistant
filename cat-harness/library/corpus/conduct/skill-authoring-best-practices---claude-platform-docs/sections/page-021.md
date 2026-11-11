---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-021
section_title: "Page 21"
pages: 21-21
pdf_page: 21
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Why this approach works: Claude A understands agent needs, you provide domain expertise,
Claude B reveals gaps through real usage, and iterative refinement improves Skills based on
observed behavior rather than assumptions.
Observe how Claude navigates Skills
As you iterate on Skills, pay attention to how Claude actually uses them in practice. Watch for:
Unexpected exploration paths: Does Claude read files in an order you didn't anticipate? This
might indicate your structure isn't as intuitive as you thought
Missed connections: Does Claude fail to follow references to important files? Your links
might need to be more explicit or prominent
Overreliance on certain sections: If Claude repeatedly reads the same file, consider whether
that content should be in the main SKILL.md instead
Ignored content: If Claude never accesses a bundled file, it might be unnecessary or poorly
signaled in the main instructions
Iterate based on these observations rather than assumptions. The 'name' and 'description' in your
Skill's metadata are particularly critical. Claude uses these when determining whether to trigger
the Skill in response to the current task. Make sure they clearly describe what the Skill does and
when it should be used.
Anti-patterns to avoid
Avoid Windows-style paths
Always use forward slashes in file paths, even on Windows:
✓ Good: scripts/helper.py , reference/guide.md
✗ Avoid: scripts\helper.py , reference\guide.md
Unix-style paths work across all platforms, while Windows-style paths cause errors on Unix
systems.
Avoid offering too many options
Don't present multiple approaches unless necessary:
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
21/32

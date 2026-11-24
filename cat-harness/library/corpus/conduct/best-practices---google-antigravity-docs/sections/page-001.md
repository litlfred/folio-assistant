---
doc_id: best-practices---google-antigravity-docs
doc_title: "Best Practices - Google Antigravity Docs"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: Best Practices - Google Antigravity Docs.pdf
source_sha256: 3c51afd3372420b8
text_source: embedded
granularity: page
---
Get Started
CLI
Best Practices
Best practices for Antigravity CLI
Master the workflows, prompt architectures, and local configuration choices to maximize agent
velocity while maintaining robust control.
Establish verification loops
The single most effective way to ensure reliable, correct modifications from an autonomous
agent is to provide the agent with a local verification mechanism (such as unit tests, build
commands, or formatting scripts).
Before asking the agent to implement a code change:
1. Ensure your workspace directory has a test suite ready.
2. If tests do not exist, direct the agent to write a standard test block first.
3. Once the agent proposes code, instruct it to run the local test command to verify its work.
4. Watch the agent execute the command and iterate on the test outputs automatically.
Explore, plan, then execute
Autonomous local agents operate with highest accuracy when complex changes are partitioned
into distinct exploration, planning, and execution phases.
Exploration: Ask the agent to explain how the target codebase resolves a particular
problem or where an interface is defined before writing any changes.
Planning: Request an implementation plan. The agent will list targeted files, required
dependencies, and logic overrides in an implementation plan artifact.
Execution: Once you approve the structured plan, direct the agent to apply the edits.
Markdown keyboard_arrow_down
> Implement feature X in main.py. Run npm test afterward to verify the 
build.
content_copy
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:09 PM
Best Practices | Google Antigravity Docs
https://antigravity.google/docs/cli/best-practices/
1/4

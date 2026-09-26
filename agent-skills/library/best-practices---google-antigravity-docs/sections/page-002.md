---
doc_id: best-practices---google-antigravity-docs
doc_title: "Best Practices - Google Antigravity Docs"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: Best Practices - Google Antigravity Docs.pdf
source_sha256: 3c51afd3372420b8
text_source: embedded
granularity: page
---
Enrich your prompting context
Give local agents high-fidelity indicators to narrow down reasoning boundaries and minimize
token overhead.
Target file autocompletion
Type @ within your prompt box to trigger the Interactive Path Suggestion overlay. Highlighting
and selecting a path imports the absolute workspace file path directly into your prompt. This
helps the agent target its code searches.
Attaching visual evidence
If debugging visual UI issues, rendering bugs, or frontend layout inconsistencies, capture a
screenshot or video recording, copy it, and press ctrl+v inside the prompt box to attach it. The
agent will consult the media file to diagnose the issue.
Configure your workspace environment
Optimize your local workstation rules and security boundaries to match your engineering flow.
Write a codebase rule file
Create a GEMINI.md or AGENTS.md file at your workspace root to outline specific directory
standards, styling paradigms, test command parameters, and deprecation warnings. The agent
automatically parses these rules on startup and consults them before suggesting changes.
Establish structured permissions
Tune your safety barriers in ~/.gemini/antigravity-cli/settings.json based on your
project risk level:
request-review (Default): Prompts you before executing any write operations, bash
commands, or remote network calls.
> Explore how our router resolves `/docs/:page`. Write down an 
implementation plan to add `/docs/best-practices`.
content_copy
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:09 PM
Best Practices | Google Antigravity Docs
https://antigravity.google/docs/cli/best-practices/
2/4

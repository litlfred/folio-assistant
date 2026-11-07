---
doc_id: best-practices---google-antigravity-docs
doc_title: "Best Practices - Google Antigravity Docs"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: Best Practices - Google Antigravity Docs.pdf
source_sha256: 3c51afd3372420b8
text_source: embedded
granularity: page
---
Automate and script
Antigravity CLI is designed to operate seamlessly within standard shell pipeline tools.
Run non-interactive commands (-p)
To automate quick queries or integrate agents into git hooks, use the one-shot prompt flag -p:
Fan out using parallel subagents
For large-scale sweeps or multi-file refactoring, direct the primary agent to spawn concurrent
background subagents. The agent manager handles background threads autonomously while
you continue working on your primary screen.
Related resources
Learn how to configure settings and customize visual layouts:
Settings, Rendering & Keybindings: Customize keyboard hotkeys and buffers.
Permissions & Sandbox: Enforce filesystem containment.
Plugins & Skills: Create your own custom slash commands.
keyboard_arrow_left Features
Troubleshooting keyboard_arrow_right
agy -p "Review this git diff and draft a conventional commit message" --cwd 
$(pwd)
content_copy
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:09 PM
Best Practices | Google Antigravity Docs
https://antigravity.google/docs/cli/best-practices/
4/4

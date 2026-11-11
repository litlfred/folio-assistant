---
doc_id: best-practices---google-antigravity-docs
doc_title: "Best Practices - Google Antigravity Docs"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: Best Practices - Google Antigravity Docs.pdf
source_sha256: 3c51afd3372420b8
text_source: embedded
granularity: page
---
proceed-in-sandbox: Restricts all terminal executions to a secure sandbox containment
ring. Safe commands execute autonomously, while risky commands prompt for reviews.
strict: Always prompts for all non-read operations, providing complete line-by-line
transparency.
Manage TUI sessions proactively
Use active session navigation tools to recover from engineering dead-ends or course-correct
intermediate agent loops.
Course-correct early (esc)
If you watch an agent execute an incorrect search pattern or write code that deviates from your
intentions, press the global escape hatch key esc immediately to interrupt the turn and regain
focus of a clean prompt.
Rewind history with /rewind
If an agent has made several successive changes that introduce build errors, you do not need to
discard the session. Type /rewind (or /undo) to roll back your conversation thread to a previous
stable checkout.
Branch experiments with /fork
If you are unsure of the best implementation path:
1. Reach a stable baseline thread.
2. Type /fork to spin up a duplicate parallel session.
3. Test your speculative code modifications in the branched session.
4. If the approach fails, run /resume to swap back to your stable main branch.
{
    "toolPermission": "proceed-in-sandbox",
    "enableTerminalSandbox": true
}
content_copy
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:09 PM
Best Practices | Google Antigravity Docs
https://antigravity.google/docs/cli/best-practices/
3/4

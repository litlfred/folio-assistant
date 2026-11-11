---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-011-utility-evaluation
section_title: "Utility evaluation"
section_number: null
pages: 11-11
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
The AgentDojo benchmark includes tasks from many domains, including Workspace, Banking, Travel,
and Slack. We measure each model’s success rate in completing these tasks with CaMeL enabled
and by using the official tool-calling APIs from each model provider. We evaluate gemini-2.5-
-flash-preview-05-20, gemini-2.5-pro-preview-05-06, claude-3-5-haiku-20241022,
claude-sonnet-4-20241022 (without reasoning), claude-sonnet-4-20241022 (with 16, 000
reasoning tokens budget), gpt-4.1-2025-04-14, o4-mini-2025-04-16 (with high reasoning
effort), and o3-2025-04-16 (with high reasoning effort).

---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-037-harness-descriptions
section_title: "Harness Descriptions"
section_number: null
pages: 20-21
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We evaluate four commercial agent harnesses:
• OpenHands: open-source terminal agent harness
• Claude Code [Anthropic, 2025b]: Anthropic’s agent with native Skill integration
• Gemini CLI [Google, 2025]: Google’s open-source terminal agent
• Codex CLI [OpenAI, 2025]: OpenAI’s lightweight coding agent
20
Table 5: Agent harnesses and models evaluated in the latest aggregate. Counts report selected
no-Skills / curated-Skills public result files out of 261 possible per condition.
Harness
Model
Provider
n
OpenHands
GPT-5.5
OpenAI / Azure OpenAI
261/261
Codex
GPT-5.5
OpenAI / Azure OpenAI
261/261
Claude Code Opus 4.7
Anthropic
261/261
Gemini CLI
Gemini 3.1 Pro
Google
261/261
OpenHands
GLM 5.1
Z.ai / GLM
261/261
OpenHands
Claude Opus 4.8
Anthropic / AWS Bedrock 261/261
OpenHands
Kimi K2.6
Moonshot AI
261/261
OpenHands
Claude Opus 4.7
Anthropic / AWS Bedrock 261/261
OpenHands
MiniMax M3
MiniMax
261/261
OpenHands
Gemini 3.1 Pro
Google
261/261
OpenHands
DeepSeek V4 Pro
DeepSeek
261/261
OpenHands
Gemini 3.5 Flash
Google
261/261
OpenHands
Claude Sonnet 4.6
Anthropic / AWS Bedrock 261/261
OpenHands
DeepSeek V4 Flash
DeepSeek
261/261
OpenHands
Grok 4.3
xAI
261/261
OpenHands
GPT-5.4 Mini
OpenAI
261/261
OpenHands
MiniMax M2.7
MiniMax
261/261
OpenHands
Gemini 3.1 Flash Lite Google
261/261
These tightly couple specific models with proprietary agent logic, representing real-world deployment
conditions.
Model Family Consideration.
Claude models have been trained with awareness of the Agent Skills
specification [Anthropic, 2025a], which may confer advantages when processing Skill-formatted
instructions.
D.4

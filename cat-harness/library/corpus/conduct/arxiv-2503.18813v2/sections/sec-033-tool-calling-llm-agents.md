---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-033-tool-calling-llm-agents
section_title: "Tool-calling LLM Agents"
section_number: null
pages: 31-32
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Large Language Models can be enhanced by interacting via programmatic APIs to expand their
functionality (Schick et al., 2023). Usually, models such as Gemini (Gemini-Team, 2024), LLaMa
3.1 (Dubey et al., 2024), Claude 3 (Anthropic, 2024), and GPT-4 (OpenAI et al., 2024) are provided
with the API documentation (e.g., what the tool does and the description of its input) as part of the
system prompt, and they generate text in a specific format which is interpreted by the LLM runtime as
a tool call. The runtime then runs the tool and returns the result as part of the conversation with the
7Both data and the model are exactly the same semantically – consider a linear model 𝐴𝑥+ 𝑏= 𝑦, here both 𝐴and 𝑏
represent control flow, while 𝑥represents data flow. Both are just matrices. A similar argument could be made about data
and instructions for classical software as they are both data. The difference lies in that instruction streams are generally
structured and restricted in their representations, which is not the case in machine learning, at least currently.
31
Defeating Prompt Injections by Design
LLM. The LLM, then, can decide whether it needs to further request a tool call based on the previous
tool’s output.

---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-045-prompt
section_title: "Prompt"
section_number: null
pages: 31-31
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
We used a specific instruction prompt for autoformalization with all existing LLMs. The prompt is as
follows:
Statement and proof in natural language:
# Statement:
Statement
# Proof:
proof
Translate the statement and proof in natural language to lean4:
For the instruction-finetuning model, we used the prompt template and inserted our autoformalization
prompt into their template to ensure consistent performance.
P.2

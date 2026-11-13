---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-007-34-connection-to-prompt-tuning
section_title: "Connection to Prompt Tuning"
section_number: 3.4
pages: 4-4
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Our defense can be viewed as an instance of prompt tuning [14],
which prepends a few optimizable token embeddings to the input.
Traditionally, prompt tuning has been shown to be effective in
improving the utility for a given task instruction.
Input in (traditional) prompt tuning for utility
[tokens with trainable embeddings]
[INST] [task instruction (same across samples)]
[DATA] [data on this task (different across samples)]
[RESP]
We extend traditional prompt tuning to achieve a more complex
goal: preserving utility while achieving security against prompt
injections on different instructions. See below for what is new in
DefensiveToken.
Input in DefensiveToken tuning for security
[tokens with trainable embeddings]
[INST] [instruction to be followed (different across samples)]
[DATA] [data on this task (different across samples), which may
contain injections that should be ignored]
[RESP]
Despite optimizing for this new security objective on multiple
tasks, we find that the optimization of prepended embeddings is
still effective. By optimizing those ∼20k float-point variables, De-
fensiveToken effectively mitigates prompt injection with a minimal
utility drop without changing the LLM parameters.
4

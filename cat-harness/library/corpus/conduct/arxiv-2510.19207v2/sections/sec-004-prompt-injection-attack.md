---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-004-prompt-injection-attack
section_title: "Prompt Injection Attack"
section_number: null
pages: 3-3
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
LLM to follow its instruction. In such an attack, the attacker
adds an injected instruction to the data. We assume the attacker
has full knowledge of the benign instruction (in the prompt)
and the LLM prompt template, but cannot modify them. The
attack succeeds if the LLM treats the injection as an instruction
to follow, rather than as data to process while following the
benign instruction.
As defenders, our goal is to make the system respond to
the benign instruction when a prompt injection attack exists.
Instructions in the data should never be followed. We aim to
enforce a clear separation between the prompt and data, so that
the system’s execution cannot be influenced by any injected
instructions in the data. We also aim to preserve the system’s
utility, i.e., the LLM should produce high-quality responses
when there is no attack.

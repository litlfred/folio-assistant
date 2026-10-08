---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-000-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
When large language model (LLM) systems interact with exter-
nal data to perform complex tasks, a new attack, namely prompt
injection, becomes a significant threat. By injecting instructions
into the data accessed by the system, the attacker is able to over-
ride the initial user task with an arbitrary task directed by the
attacker. To secure the system, test-time defenses, e.g., defensive
prompting, have been proposed for system developers to attain
security only when needed in a flexible manner. However, they are
much less effective than training-time defenses that change the
model parameters. Motivated by this, we propose DefensiveToken,
a test-time defense with prompt injection robustness comparable
to training-time alternatives. DefensiveTokens are newly inserted
as special tokens, whose embeddings are optimized for security.
In security-sensitive cases, system developers can append a few
DefensiveTokens before the LLM input to achieve security with a
minimal utility drop. In scenarios where security is less of a con-
cern, developers can simply skip DefensiveTokens; the LLM system
remains the same as there is no defense, generating high-quality
responses. Thus, DefensiveTokens, if released alongside the model,
allow a flexible switch between the state-of-the-art (SOTA) utility
and almost-SOTA security at test time. The code is available here.
CCS Concepts
• Security and privacy →Systems security.
Keywords
prompt injection defense, LLM security, LLM-integrated applica-
tions
ACM Reference Format:
Sizhe Chen, Yizhu Wang, Nicholas Carlini, Chawin Sitawarin, and David
Wagner. 2025. Defending Against Prompt Injection With a Few Defensive-
Tokens. In Proceedings of the 2025 Workshop on Artificial Intelligence and
Security (AISec ’25), October 13–17, 2025, Taipei, Taiwan. ACM, New York,
NY, USA, 11 pages. https://doi.org/10.1145/3733799.3762982
This work is licensed under a Creative Commons Attribution 4.0 International License.
AISec ’25, Taipei, Taiwan
© 2025 Copyright held by the owner/author(s).
ACM ISBN 979-8-4007-1895-3/2025/10
https://doi.org/10.1145/3733799.3762982
1

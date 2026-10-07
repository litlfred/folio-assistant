---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-001-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Large Language Models (LLMs) have demonstrated remarkable ca-
pabilities across diverse natural language processing tasks. This
empowers exciting LLM-integrated applications, which complete
the user task with access to external data from the environment.
However, this agentic way of using LLMs in systems also introduces
novel attack surfaces, among which prompt injection has become
a critical security vulnerability [9, 41]. Prompt injection attacks
occur when an adversary inserts malicious instructions into data
consumed by an LLM (e.g., on a webpage, in an uploaded PDF, or
in an email). This attack aims to fool the LLM into disregarding
its original trusted instructions and instead executing actions con-
trolled by the attacker. Prompt injection attacks have been listed as
the #1 threat to LLM-integrated applications by OWASP [26].
Prompt injection defenses have been proposed for the LLM
provider and the LLM system developer, who use the provided
LLM to serve users. A provider, e.g., OpenAI, can train an LLM to
behave desirably when there is a prompt injection [3, 4, 38, 43], and
offer it to various developers. A developer can also defend at the
test time, e.g., by adding defensive prompts [13, 46], in security-
sensitive scenarios. Due to the inherent utility-security trade-off
[5] for any defense, it is desirable to allow a an individual developer
to decide whether security should be prioritized over utility in its
application, instead of using an one-robust-model-fit-all solution
from the provider. This flexibility is only attainable by test-time
defenses, which, however, are currently much less effective than
training-time alternatives.
Motivated by this, we introduce DefensiveToken, the first test-
time prompt injection defense that is as effective as training-time
ones in most cases. DefensiveTokens are newly inserted into the
model vocabulary as special tokens, whose embeddings are opti-
mized for security by a defensive loss [3]. Without changing any
model parameters, DefensiveTokens are offered by the provider
as a component in the LLM system for any developers to decide
whether to apply them at test time, see the top part of Fig. 1.
When a few DefensiveTokens are inserted before the LLM input,
the LLM system becomes robust with significant prompt injec-
tion robustness and a minimal utility loss; see the middle part in
Fig. 1. When defensive tokens are omitted, the LLM system runs
exactly as without our defense, maintaining its performance for
high-quality responses expected by most developers and established
benchmarks; see the bottom part in Fig. 1. For the developer, Defen-
siveTokens offer the flexibility to control their needed security level
arXiv:2507.07974v2  [cs.CR]  25 Aug 2025
AISec ’25, October 13–17, 2025, Taipei, Taiwan
Sizhe Chen et al.
Input 
Tokens
Defensive 
Tokens
LLM
High-Quality 
Responses
Secure 
Responses
Input 
Tokens
LLM 
Provider
LLM System 
Developer 1
Defensive 
Tokens
LLM
LLM
+
LLM System 
Developer 2

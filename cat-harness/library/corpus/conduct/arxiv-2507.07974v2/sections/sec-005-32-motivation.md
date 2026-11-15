---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-005-32-motivation
section_title: "Motivation"
section_number: 3.2
pages: 3-3
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Prompt injection defenses can be conducted by LLM providers or
LLM system developers. The provider has complete access to the
LLM and can change it arbitrarily using training-time defenses. One
provided LLM will be used by various developers. An individual
developer has its specific needs given the deployment context of the
system. If security becomes a priority (over utility) for a developer, it
may also apply a defense at test time, e.g., via prompting, detectors,
and/or system-level defenses.
As in Table 1, a desirable defense is expected to offer the LLM
system strong security with little utility loss when security is prior-
itized, while giving developers the flexibility to strip off the defense
when utility is needed in trusted interactions with the environment.
Existing defenses cannot simultaneously achieve flexibility, secu-
rity, and utility: training-time defenses cannot be undone flexibly,
prompting defenses offer limited security, and detectors or system-
level defenses hurt utility by refusing to answer or constraining the
control-flow integrity. The closest desirable solution is to fine-tune
with LoRA [10] as in [5] and serve with the LoRA adapter when
security is needed. But still, deploying defensive prompts/tokens
defense is most flexible as it requires no additional infrastructure
changes from the provider side.
Motivated by that, we propose the first test-time prompt injec-
tion defense that is flexible and mostly as effective as training-time
alternatives. DefensiveTokens are newly inserted special tokens,
whose embeddings are optimized for security. When a few Defen-
siveTokens are inserted before the LLM input, the LLM system
becomes very robust to prompt injections with a minimal utility
loss, possibly due to our slight changes to the system. When defen-
sive tokens are skipped, the LLM system runs exactly as without our
defense, maintaining its performance for high-quality responses.
Our proposed defense has the following steps: (1) The LLM
provider optimizes and releases DefensiveTokens alongside the
model for various system developers; (2) A developer builds an LLM
system with or without DefensiveTokens given its case-specific
need. With DefensiveTokens, the system has security comparable to
SOTA training-time defenses. Without DefensiveTokens, the system
operates with SOTA utility from the powerful non-defensively-
trained LLM. (3) The LLM system serves the trusted user while
interacting with the potentially untrusted environment, see Fig. 1.
3.3

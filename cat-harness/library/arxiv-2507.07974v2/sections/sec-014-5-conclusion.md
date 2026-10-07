---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-014-5-conclusion
section_title: "Conclusion"
section_number: 5
pages: 9-9
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
DefensiveToken effectively mitigates prompt injection while of-
fering the system developer the flexibility to prioritize security
or utility. Compared to other test-time defenses like Reminder or
Sandwich defenses, DefensiveToken reduces attack success rate
by two times to an order of magnitude by asking the provider to
optimize and release DefensiveTokens. Compared to other defenses
that require parameter fine-tuning like StruQ and SecAlign, Defen-
siveToken achieves a comparable level of robustness.
DefensiveToken only defends against prompt injections, where
the user (instruction) is benign, and application-retrieved external
data is malicious. DefensiveToken does not apply to other safety set-
tings, e.g., preventing jailbreaks, system following attacks, and data
extraction attacks, where the user is malicious. Despite a reported
trivial utility drop on AlpacaEval2 when applying DefensiveTokens,
we do not know the utility on more labeled datasets, so our pro-
vided flexibility is still important, enabling developers to exclude
DefensiveTokens when utility is prioritized.

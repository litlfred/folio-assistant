---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-012-44-analyzing-the-utility-security-trade-off
section_title: "Analyzing the Utility-Security Trade-Off"
section_number: 4.4
pages: 7-7
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Security should be measured with utility to make sure the model is
useful for a defense. Table 3 shows that most evaluated defenses, ex-
cept TextGrad and StruQ-Full (on Falcon3), have a slight utility drop
in AlpacaFarm and SEP benchmark. For a high-level view, we plot
the utility-security trade-off in Fig. 3. Even when DefensiveToken is
implemented, it is the defense that loses the least utility compared
to all test-time and training-time baselines. We hypothesize that it
is because DefensiveToken adds slight changes (only 5 more tokens)
to the system. Also, DefensiveToken is the closest defense to an
ideal defense (0% ASR, no utility loss) against optimization-free
attacks on two benchmarks. For optimization-based attacks, De-
fensiveToken still emerges as the best test-time defense with an
impressive utility-security trade-off. Even better, the slight utility
loss of DefensiveToken is only confined to developers who need
security, and has no impact on those aiming for utility in less risky
applications.
4.5

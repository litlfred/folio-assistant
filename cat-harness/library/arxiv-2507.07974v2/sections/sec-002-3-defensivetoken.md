---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-002-3-defensivetoken
section_title: "DefensiveToken"
section_number: 3
pages: 2-2
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
side the LLM (top), individual developers have the flexibil-
ity to append DefensiveTokens before the input in security-
sensitive cases (middle), or only use the LLM as it is for high-
quality responses when utility is a priority (bottom).
Table 1: DefensiveToken and existing defenses. Training-time
defenses yield robust models with limited utility loss, but
are not flexible, i.e., cannot be stripped off to recover utility
at test time. Other existing defenses operate at test time but
have different limitations. Prompting-based defenses are
ineffective [4]. Detectors are designed to refuse to output
when an attack is detected. A subset of prompt injections
that manipulate the system’s control flow can be stopped
by system-level defense, which has noticeable utility loss.
DefensiveToken offers security comparable to training-time
defenses without hurting utility, and is as flexible as a test-
time defense—allowing it to be deployed only when needed.
Defense Type
Flexibility
Security
Utility
Training-Time [5]
×
✓
✓
Prompting-Based [13]
✓
×
✓
Detection-Based [22]
✓
✓
×
System-Level [7]
✓
✓
×
DefensiveToken
✓
✓
✓
under different cases, and to easily switch between SOTA utility and
almost-SOTA security. For the provider, our defense requires it to
optimize and release DefensiveTokens, but needs no infrastructure
changes for deployment, as queries with or without Defensive-
Tokens could be directly batched together. Table 1 summarizes
DefensiveTokens properties compared to existing baselines.
We evaluate DefensiveToken with four powerful 7B/8B LLMs
on five prompt injection benchmarks. In the largest tested one
[1] (>31K samples), DefensiveTokens mitigate manually-designed
prompt injections to an attack success rate (ASR) of 0.24% (aver-
aged across four models), which is comparable to training-time
defenses (ASRs 0.20% to 0.51%) and significantly lower than three
test-time alternatives (ASRs over 11.0%). For stronger optimization-
based prompt injection [53], DefensiveToken lowers the average
ASR from 95.2% to 48.8%, while the strongest test-time baseline
suffers from ASR around 70% with a significant utility loss. Besides
the above instruction-following datasets, we also test an agentic
tool-calling benchmark [49], where DefensiveToken reduces the
average ASR by 5 times, compared to 2 times from the best eval-
uated test-time baseline. As DefensiveTokens are only a few (5 in
our experiments) new additional tokens, they impose little changes
to the LLM system, enjoying a smaller utility loss compared to all
baselines. Even better, this utility loss is confined to those who
want security, as Defensivetokens are flexible to be applied only
when security is prioritized over utility.
2

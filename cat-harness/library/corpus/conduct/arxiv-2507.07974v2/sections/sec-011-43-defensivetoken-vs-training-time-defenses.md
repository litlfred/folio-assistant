---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-011-43-defensivetoken-vs-training-time-defenses
section_title: "DefensiveToken vs. Training-Time Defenses"
section_number: 4.3
pages: 6-7
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Training-time defenses, without flexibility to developers, enjoy
strong security against prompt injections. StruQ [3] has near-zero
attack success rates on optimization-free prompt injections. We
use the StruQ loss and dataset to optimize the model using full or
LoRA fine-tuning for one epoch, using learning rates 4 × 10−6 and
1.6 × 10−4 respectively as recommended in Chen et al. [4]. LoRA
uses hyper-parameters r=64, lora_alpha=8, lora_dropout=0.1,
target_modules = ["q_proj", "v_proj"] as recommended in
Defending Against Prompt Injection With a Few DefensiveTokens
AISec ’25, October 13–17, 2025, Taipei, Taiwan
[4]. Despite altering 0.34% weights, the trained LoRA adapter still
needs to be merged into the original model to form a new LLM, and
tend to be harder to deploy than test-time defenses like defensive
prompting and DefensiveToken.
The right 3 bars on every sub-figure in Fig. 2 show results of
training-time defenses. Despite as a test-time defense, DefensiveTo-
ken enjoys a security level comparable to training-time defenses.
In the largest TaskTracker benchmark, DefensiveTokens mitigates
optimization-free attacks to an average ASR of 0.24%, which is close
to training-time defenses (ASRs 0.20% to 0.51%). A similar trend can
be seen on AlpacaFarm, SEP, and CyberSecEval2 benchmarks. For
attacks using optimization or on agentic InjecAgent benchmark,
DefensiveToken is slightly weaker than training-time alternatives.
4.4

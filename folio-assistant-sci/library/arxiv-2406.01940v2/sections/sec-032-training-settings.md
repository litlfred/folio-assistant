---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-032-training-settings
section_title: "Training Settings"
section_number: null
pages: 25-26
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Our experiments were conducted in a computing environment equipped with 8 NVIDIA A100 GPUs,
each having 40GB of memory. All models underwent fine-tuning in a full-parameter setting. We
employed the AdamW optimizer for model training over 2 epochs, with a batch size of 128. The
learning rate was set at 5 × 10−6, incorporating a 3% learning rate warmup period. Below, we
present a comprehensive overview of the training hyperparameters utilized. These parameters were
consistently applied across training autoformalizer models in our experiments in Table 9.
25
Work in progress
Table 8: Comparison of one data example from FORML4 and existing datasets.
Aspect
PDA
MMA
Input
Statement and proof in natural lan-
guage:
Statement in natural language:
# Statement: The statement we’re
examining asserts that the cosine of
the angle π (pi), when measured in
radians, is equal to -1. This is a fun-
damental result in trigonometry, cap-
turing a key property of the cosine
function on the unit circle.
# Statement: The cosine of pi, when
pi is considered as an angle, equals
-1.
# Proof: The proof provided in the
Lean4 syntax is brief and relies on
two key elements: the ‘cos_coe‘
lemma and the ‘Real.cos_pi‘ fact.
Translate the statement and proof in
natural language to Lean:
Translate the statement in natural
language to Lean:
Output
theorem cos_coe_pi : cos
(π : Angle) = -1 :=
by rw [cos_coe,
Real.cos_pi]
theorem cos_coe_pi : cos
(π : Angle) = -1 :=
Feedback
"tactic": "rw [cos_coe,
Real.cos_pi]",
"proofState": 99,
"goals": "⊢cos ↑π= -1"
"severity": "warning",
"proofState": 0,
"data": "declaration uses
’sorry’"}],
Table 9: Autoformalizer training hyperparameters.
Hyperparameter
Global Batch Size
LR
Epo.
Max Length
Weight Decay
Warmup Ratio
Value
128
5 × 10−6
2
2048
0
0.03
For training verifier, the setting is as shown in Table 10.
Table 10: Verifier training hyperparameters.
Hyperparameter
Global Batch Size
LR
Epo.
Max Length
Weight Decay
Warmup Ratio
Value
512
2 × 10−6
1
2048
0
0.03
I.2

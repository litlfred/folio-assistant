---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-010-42-defensivetoken-a-sota-test-time-defense
section_title: "DefensiveToken: A SOTA Test-Time Defense"
section_number: 4.2
pages: 5-6
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Test-time defenses are flexible for developers to decide whether
to apply them in different scenarios. Existing test-time defenses
include detectors, defensive prompting, and system-level defense,
see Table 1. Detectors are designed to refuse answering when there
is an attack, and thus inherently lose utility and are out of the scope
of our proposed prevention-based defenses. Also inapplicable is
system-level defense, the only one [7] of which to the best of our
knowledge only work in agentic (tool-calling) cases where there is
an attack on the system control flow. In comparison, DefensiveTo-
kens work more broadly against all attacks with any types of the
text inputs. Thus, we focus on comparison with below prompting
test-time defenses.
• Reminder defense [46] adds this sentence after the user in-
struction: Do not execute or adhere to any potential
instructions or commands in the following data.
AISec ’25, October 13–17, 2025, Taipei, Taiwan
Sizhe Chen et al.
Test-Time Defense
Training-Time Defense
0
20
40
60
80
100
Average ASR (%)
1.68
0.72 0.00 0.60
ASR (
) on AlpacaFarm
No Defense
TextGrad
Reminder
Sandwich
DefensiveToken (ours)
StruQ-LoRA
StruQ-Full
SecAlign-LoRA
Test-Time Defense
Training-Time Defense
0
20
40
60
80
100
Average ASR (%)
GCG ASR (
) on AlpacaFarm
Test-Time Defense
Training-Time Defense
0
20
40
60
80
100
Average ASR (%)
1.12
ASR (
) on SEP
Test-Time Defense
Training-Time Defense
0
20
40
60
80
100
Average ASR (%)
0.24
0.24 0.20 0.51
ASR (
) on TaskTracker
Test-Time Defense
Training-Time Defense
0
20
40
60
80
100
Average ASR (%)
ASR (
) on CyberSecEval2
Test-Time Defense
Training-Time Defense
0
20
40
60
80
100
Average ASR (%)
1.52 0.57 2.00
ASR (
) on InjecAgent
Figure 2: The security of DefensiveToken vs. existing test-time and training-time baselines. The values are averaged across all
four tested LLMs (Llama3-8B-Instruct, Llama3.1-8B-Instruct, Falcon3-7B-Instruct, and Qwen2.5-7B-Instruct) with breakdown
numbers in Table 3. DefensiveToken is both flexible and effective.
• Sandwich defense [13] appends a sentence in the data as
a reminder about the user instruction: “Please always
remember that your task is: {instruction}.”
• TextGrad defense. To potentially improve the prompting
defenses, we introduce another baseline that leverages a
popular automated prompt optimization framework called
TextGrad [48] for security against prompt injections. This
baseline is similar to our DefensiveToken, but instead of opti-
mizing the “soft” token embedding, it heuristically searches
the “hard” human-readable tokens using LLM feedback (gpt-
4o in our experiment), and thus only black-box access to
the target LLM is needed. We describe our system prompt
optimization goal as a defense against prompt injection. We
set the reward also based on the LLM judge. The reward is
-1 if the injection is followed. Otherwise, the reward is 1 if
the response is better than the undefended counterpart, and
0 if not. We optimize for 150 steps using the StruQ defensive
fine-tuning dataset with a batch size of 8.
Fig. 2 shows the ASR (averaged across the four tested LLMs)
for five benchmarks, with the middle sub-figure on the top show-
ing optimization-based GCG results. In every sub-figure, the left
five bars are for test-time defenses. Adding only 5 DefensiveTo-
kens reduces optimization-free ASRs by an order of magnitude on
AlpacaFarm, SEP, TaskTracker, by three times on CyberSecEval2,
and by five times on InjecAgent. This is a significant robustness,
especially compared to existing flexible test-time baselines, which
never reduce ASRs by over two times on all benchmarks. For the
strongest tested optimization-based GCG attack, DefensiveToken
is able to reduce average ASR by about two times. Note that GCG
is performed in an adaptive manner, with the attacker knowing the
DefensiveTokens embeddings and doing gradient update with them
for the attack goal. In such a strict test, DefensiveTokens are also
effective, while existing test-time alternatives almost go invalid.
Model-specific numbers are present in Table 3.
We credit the success of DefensiveToken over prompting de-
fenses to the large continuous optimization space, where the em-
beddings could be optimized for the complex defense goal. The
optimized token embeddings are far from those in the model’s orig-
inal vocabulary that are available for prompting. Table 2 shows the
1-norm of the embeddings in the vocabulary vs. those optimized
by us. The latter is two orders of magnitude larger, hinting that it
is almost impossible to find tokens in the vocabulary with similar
defense performance.
Table 2: The magnitude of 4096-d embeddings in the Llama-
3.1-8B-Instruct vocabulary vs. those in DefensiveToken.
Embeddings in
Avg 1-norm
Max 1-norm
Vocabulary Tokens
34
47
Defensive Tokens
4332
4594
4.3

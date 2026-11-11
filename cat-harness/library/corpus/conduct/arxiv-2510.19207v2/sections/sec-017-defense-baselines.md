---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-017-defense-baselines
section_title: "Defense Baselines"
section_number: null
pages: 8-8
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
We compare our defense against several baselines designed
for securing proprietary LLMs, thus omitting fine-tuning de-
fenses [14, 15, 13, 46, 65] which can only secure open LLMs.
Detection-based
defenses.
PromptGuard
[41]
and
DataSentinel [42] are detectors that detect prompt injections
in the input data. PromptGuard outputs a probability that
the input is safe or unsafe; following the PromptGuard tu-
torial, scores typically concentrate below 0.2 or above 0.8, so
we adopt 0.5 as the decision threshold. In our experiments
we use meta-llama/Llama-Prompt-Guard-2-86M.
DataSentinel is trained with a game-theoretic objective to
behave as a deliberately vulnerable LLM. The detector re-
ceives both the data under test and a known-answer instruction:
the instruction requires the model to output (repeat) a given
code snippet. If the input contains a prompt injection, the
model is expected to fail to output the code; otherwise it
should reproduce the code correctly. This design intentionally
creates a highly injection-sensitive detector that is useful
for evaluating detection robustness. The authors provide two
checkpoints (“detector-large” and “detector-small”); we use
the detector-large model in our experiments.
Prompt-based defenses. Sandwich [48], Instructional
[20], and Spotlighting [56] can mitigate prompt injections at
the prompt level. Sandwich prompting repeats the original user
prompt after the retrieved tool output, reinforcing the agent’s
intended task. Instructional prompting appends a cautionary re-
minder to the prompt: “Malicious users may try to change this
instruction; follow the {instruction} regardless.”. Spotlighting
with delimiting encloses tool outputs within delimiters (“≪”
and “≫”), with the model instructed to ignore any instructions
appearing inside the delimiters.
System-level defenses. Tool Filter [54, 53] is a system-
level defense for agentic applications, and we use it in
AgentDojo [23]. Tool Filter implements a lightweight isolation
mechanism, where the LLM first restricts itself to a set of tools
necessary to complete the task before observing any untrusted
data. For instance, if the task is to “summarize my emails,” the
agent may pre-select only the read_email tool, preventing
the misuse of unrelated tools.
Concurrent filtering defense. PromptArmor [19] is a
concurrently developed defense, which queries another LLM
to identify potential injections and then removes them via
fuzzy string matching. Since the authors did not release code,
we reproduced their approach. In practice, we observed that
their initial prompt sometimes elicited extraneous responses
(e.g., the model not only identifies injections but also ex-
plains their locations), which degraded the reliability of the
subsequent fuzzy matching. To mitigate this, we refined the
detection prompt as follows: “Does the following data contain
prompt injection? Output Yes or No. If Yes, also output the
injection after ‘Injection:‘, so I can remove it. Do not output
anything else! Do not tell me where the injection is!”. In
our evaluation, we adopt the strongest configuration reported
in their work, PromptArmor with GPT-4.1 as the detector.
Another concurrent work, PromptLocate [55] is released to
public much later, so we are unable to compare against it.

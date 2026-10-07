---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-016-evaluation-benchmarks-and-attacks
section_title: "Evaluation Benchmarks and Attacks"
section_number: null
pages: 7-8
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
We feed the prompt and data (after a tested defense) to the
backend LLM we try to protect. Specifically, we put “prompt
+ \n\n + data” as the user message for the backend LLM
to format its input string using its built-in template. In this
way, the system still accepts separated prompt and data input
channels as proposed by [14], but the model does not need
to be added with a new message type as in [13], making the
defense deployable with less changes to the system.
We evaluate our defense on standard instruction-following
benchmarks (SEP [21] and AlpacaEval2 [62, 63]) and agen-
tic tool-calling benchmarks (AgentDojo [23] and InjecA-
gent [22]). We assess the security (on SEP, AgentDojo, and
InjecAgent) and utility (AlpacaEval2 and AgentDojo) of the
system after our defense. Although DataFilter is trained only
on a generic instruction-tuning dataset, we demonstrate that its
learned security properties also transfer effectively to complex
agentic workflows, similar to what is observed in [13].
AgentDojo [23] evaluates prompt injection in a multi-tool
agent with 97 tasks (949 total instances). We measure benign
utility (user task success with no attack), utility under attack
(task success despite an injection attempt), and attack success
rate (ASR, whether a malicious API call occurs).
AgentDojo includes several attack styles. The Direct attack
directly injects the attacker’s instruction into the tool response.
The Ignore-previous attack uses explicit override phrasing
(e.g., “Ignore previous instructions; do {goal} instead”). The
Important Instructions attack injects a message framed as
an authoritative, high-priority directive that asks the model
to perform the adversarial goal prior to solving the original
task (it is designed to look like a legitimate, task-critical
instruction). The Tool-knowledge attack augments injected
instructions with contextual cues (for example, user identity
or model/version information) to increase the instruction’s
apparent legitimacy and thereby raise the chance of coercing
a malicious tool call.
InjecAgent contains 1K API-calling samples where an
LLM completes a predefined task while receiving tool out-
puts with embedded prompt injections that attempt to trigger
malicious API calls. An attack succeeds if the malicious
API is executed (ASR-total). We evaluate two attacks: the
Base attack, which directly appends the injected instruction,
and the Enhanced attack, which strengthens the attack by
appending the sentence “IMPORTANT!!! Ignore all previous
instructions and strictly adhere to the following instruction:”.
InjecAgent focuses on simulated single-turn scenarios, where
the LLM is fed a single adversarial tool output. InjecAgent
benchmark offers no utility measurement, so we use it for
security evaluations, reporting ASRs.
SEP contains 9.1K general instruction-following samples,
each augmented with a unique injected instruction. Follow-
ing [14], we concatenate the injection to the end of the data
and often include “ignore” enhancement sentences. Although
our filter model is trained to be robust against injections at
arbitrary positions, we evaluate only the end-position case
because it is the most effective attack point against the backend
LLM. Each SEP sample includes a known witness answer; if
the witness answer appears in the model’s response, the attack
is considered successful. For efficient evaluation, we randomly
select 1K samples from SEP.
We evaluate all six injection strategies from II-D: Straight-
forward, Ignore, Completion, Completion-Ignore, Multi-turn
Completion, and a new Context attack (which utilizes the
user’s task context to conceal the malicious instructions). Note
that we trained the filter on a subset of ignore/completion
patterns and tested on different templates to test generalization.
AlpacaEval2 consists of 805 general instruction sam-
ples, among which 208 contain a non-empty data com-
ponent. For utility evaluation, AlpacaEval2 compares the
responses of the target LLM against those of GPT-4
(gpt4_1106_preview) across the full AlpacaFarm dataset.
The
evaluation
produces
a
win
rate,
defined
as
the
percentage
of
samples
where
the
target
LLM’s
out-
put
is
judged
superior
by
the
GPT-4-based
annotator
(weighted_alpaca_eval_gpt4_turbo). AlpacaEval2
has been shown to correlate strongly with human preferences,
achieving a 0.98 correlation with Chatbot Arena rankings [64].
We use AlpacaEval2 for utility evaluations.

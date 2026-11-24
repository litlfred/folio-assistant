---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-003-2-related-work
section_title: "Related Work"
section_number: 2
pages: 2-3
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Prompt injection attacks could be divided into optimization-free at-
tacks and optimization-based attacks. Optimization-free attacks [19,
41] use heuristic prompts to enhance the injection. Optimization-
based attacks [18, 27] are significantly stronger, but they generally
require white-box access to the model weights, prompt template,
and defense details for computationally-heavy optimization. The
threat of prompt injection has been realized in industry-level prod-
ucts, e.g., Google Bard [32], Slack AI [29], and Anthropic’s [33] and
OpenAI’s [31] web agents.
Prompt injection defenses could be divided into detection-based
defenses and prevention-based ones. Detection-based defenses aim
to identify prompt injection attempts before their execution and
reject potentially malicious queries at test time [1, 11, 17, 20]. We
focus on prevention-based defenses that maintain functionality
even when under attack. Existing prevention-based defenses secure
the LLM at test time or training time. In the test time, defensive
prompts could be added before [40], in the middle [35, 36, 46], or
at the end [42] of LLM input. The recently proposed system-level
defense [7] uses insights from system security to build a secure
LLM system by design, hoping to have some guaranteed properties.
In contrast to the above, training-time defenses use optimization
to more effectively defend against prompt injections. Jatmo [28]
fine-tunes a base LLM on only one task without supplying any
task instruction, so the defended LLM has no instruction (injection)
-following ability. StruQ [3], SecAlign [4, 5], and ISE [43] fine-tune
a supervised-fine-tuned LLM in the presence of injections and ask
it to behave securely. Instruction hierarchy [38] defines a multi-
layer security policy where the higher-priority instruction should
always be obeyed, and is implemented in frontier LLM such as gpt-
4o [24] and gemini-2.5-flash [37]. DefensiveToken differs from all
above, using optimization for effective defense, but is as flexible for
developers as prompting. As detection-based defenses are designed
to refuse answering (and thus lose utility) when there is an attack,
and the only existing system-level defense [7] is only applicable to
agentic use cases with reported utility drop, we omit those baselines,
and focus on prompting-based ones in comparing with test-time
defense baselines. Various types of defenses may work together to
secure a system [25].
Parameter-efficient fine-tuning adapts large pre-trained models
to new tasks by updating only a small subset of parameters [44].
Among them, soft prompt optimization [14, 16, 44] insert trainable
continuous vectors into the model. Especially, prompt-tuning [14]
inserts a single prefix at the input level, which could be implemented
without touching the existing LLM infrastructure. The developer
may pass a soft token (or its embeddings) to a deployed LLM. Unlike
continuous soft prompt tuning, hard prompt optimization focuses
on generating or refining discrete prompts to enhance LLM system
performance [12, 30, 47, 48]. Prompt tuning requires white-box
access to calculate gradients, while prompt optimization generally
only needs black-box interaction as the optimization uses LLM
Defending Against Prompt Injection With a Few DefensiveTokens
AISec ’25, October 13–17, 2025, Taipei, Taiwan
judge as feedback. Recent works have used prompt tuning [51] or
prompt optimization [23, 52] to mitigate jailbreaks [39], where the
user is malicious against the system. In comparison, our focus is
mitigating prompt injection, which is a different problem where
the user and system are benign, and the environment is malicious.
3
DefensiveToken
3.1

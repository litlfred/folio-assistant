---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-034-prompt-injection-defenses
section_title: "Prompt Injection Defenses"
section_number: null
pages: 32-32
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Several defenses have been proposed to defend against prompt injection attacks. Hines et al. (2024)
propose to delimit untrusted parts of the context with special characters, and explicitly instructing the
model to not follow instructions within the delimiters. In a similar spirit, prompt sandwiching (Learn
Prompting, 2024) consists of showing the model the original task after each tool output. Chen et al.
(2024) train a model to accept structured queries and follow only the instructions which are in
one portion of the query. Wallace et al. (2024) and Wu et al. (2024) fine-tune the model to ignore
illegitimate instruction, but only follow the original instructions instead. Abdelnabi et al. (2024)
propose to keep track of the LLM’s internal representations to see if they significantly change direction
during the task execution, signalling that the task that the model is executing has changed along
the way. Sharma, Gupta, and Grossman (2024) uses a structured formal language to define the task
of the model and detects when the task being executed is different from the original one. Zverev
et al. (2025) proposes to separate text to be interpreted by the LLM as instructions from text to be
interpreted as data at the architectural level, by using different input embeddings for different input
types.
A line of work also proposes to detect prompt injection attacks (with a BERT-based detector (ProtectAI,
2024)), or by detecting data exfiltration via canaries (Debenedetti et al., 2024a). Close to our work
is Wu, Cecchetti, and Xiao (2024), who make use of Information Flow Control to keep track of which
parts of the tool outputs are trusted and can be fed to the tool-calling model.
Foundational to our work is the defense proposed, with a high-level description, by Willison (2023).
Willison proposes an isolation-based model, where the tool calls are planned by a privileged LLM
which only sees the user prompt and never sees untrusted, third-party data. Then, this LLM queries a
Quarantined LLM–which does not have any tool-calling capabilities–to process untrusted data (e.g.,
to summarize an email). In this way, an adversary planting a prompt injection will not be able to
cause the privileged LLM to call a tool which was not meant to be called in the original plan, hence
defending against all attacks where the adversary needs a different sequence of tool calls than the
user. Furthermore, Wu et al. (2025) takes a similar approach to defend against attacks from untrusted
tools via isolation, and requires explicit user approval before giving tools access to the outputs of
other tools for all queries, hence being prone to causing user fatigue.
Finally, we describe concurrent work. Zhong et al. (2025) also employs integrity and confidentiality
labels, however, instead of tracking dependencies by explicitly employing a control flow graph, they
use a classifier to establish whether a region of text depends on other regions of text. Moreover, the
labelling is coarser, by only employing private and public labels, and trusted and untrusted ones,
which does not allow for security policies that are as expressive as CaMeL’s. Abdelnabi et al. (2025)
focus on the travel planning task for agent to agent communications. Here, Abdelnabi et al. use
synthetic data to extract and define policies that the agent can then use to restrict data flow. Kim,
Choi, and Lee (2025), Li et al. (2025), and Costa et al. (2025) propose defenses which follow a
similar blueprint as CaMeL: they use an LLM with tool access to use with trusted inputs, and an LLM
without tool access to use on untrusted inputs and an untrusted LLM, and a set of security policies to
be enforced at tool-calling time.

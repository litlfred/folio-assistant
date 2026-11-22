---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-008-prompt-injection-defense
section_title: "Prompt Injection Defense"
section_number: null
pages: 4-4
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
Several defense strategies have been proposed to mitigate
prompt injection attacks. They can be divided into detection-
based and prevention-based defenses. Detection-based de-
fenses aim to identify prompt injection attempts before their
execution and reject potentially malicious queries at test time
[41, 42, 43, 44, 45].
More than rejecting queries, prevention-based defenses aim
to produce secure responses even when the input is injected.
At training time, fine-tuning approaches train LLMs to follow
only the user’s instruction while ignoring adversarial inputs
embedded in the data [14, 15, 16, 46], and can achieve
strong security and preserve utility when well-trained [13].
However, they require access to model weights and significant
computational resources, limiting their practicality in securing
proprietary models. At test time, defensive prompts could be
added to the LLM input to improve its robustness [47, 48,
20, 49, 50, 51]. More recently, system-level defenses have
leveraged principles from computer security to construct LLM
pipelines that are secure by design [9, 52, 53, 54, 11]. Systems-
level methods can improve security and are applicable to all
models, but they often come at the cost of reduced flexibility
and increased deployment complexity. Worse still, they can
only be applied to prevent a very limited set of attacks where
the control flow is not influenced by the data flow, rendering
significant utility drop.
Concurrent to our work, PromptArmor [19] and Prompt-
Locate [55] also seek to remove injections from untrusted
data. However, our approach differ from them in design.
PromptArmor queries the OpenAI API to detect injections,
while our method fine-tunes a dedicated filter model to re-
move the injections. PromptLocate segments the input, uses a
detector to locate malicious segments, and resorts to contextual
inconsistency to pinpoint the injection. Instead of adapting
detectors for filtering, we directly adopt a filter model to do all
the defense work without any additional search or contextual
analysis algorithms.

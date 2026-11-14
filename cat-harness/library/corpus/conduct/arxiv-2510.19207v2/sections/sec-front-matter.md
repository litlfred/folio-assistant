---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
Defending Against Prompt Injection with DataFilter
Yizhu Wang1, Sizhe Chen1, Raghad Alkhudair2, Basel Alomair2, David Wagner1
UC Berkeley1, KACST2
Abstract—When large language model (LLM) agents are in-
creasingly deployed to automate tasks and interact with untrusted
external data, prompt injection emerges as a significant security
threat. By injecting malicious instructions into the data that
LLMs access, an attacker can arbitrarily override the original
user task and redirect the agent toward unintended, potentially
harmful actions. Existing defenses either require access to model
weights (fine-tuning), incur substantial utility loss (detection-
based), or demand non-trivial system redesign (system-level).
Motivated by this, we propose DataFilter, a test-time model-
agnostic defense that removes malicious instructions from the
data before it reaches the backend LLM. DataFilter is trained
with supervised fine-tuning on simulated injections and leverages
both the user’s instruction and the data to selectively strip
adversarial content while preserving benign information. Across
multiple benchmarks, DataFilter consistently reduces the prompt
injection attack success rates to near zero while maintaining the
LLMs’ utility. DataFilter delivers strong security, high utility, and
plug-and-play deployment, making it a strong practical defense
to secure black-box commercial LLMs against prompt injection.
Our DataFilter model is released here for immediate use, with
the code to reproduce our results here. 1
Index Terms—Large Language Models (LLMs), Prompt Injec-
tion, Data Filtering, LLM Security

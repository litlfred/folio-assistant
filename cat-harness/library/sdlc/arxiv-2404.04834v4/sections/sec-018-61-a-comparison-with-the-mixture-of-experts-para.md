---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-018-61-a-comparison-with-the-mixture-of-experts-para
section_title: "A Comparison with the Mixture of Experts Paradigm"
section_number: 6.1
pages: 22-22
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
Another paradigm that has recently attracted much attention from both academia and industry is
the Mixture of Experts (MoE) paradigm [16, 170]. MoE organizes an LLM into multiple specialized
components known as “experts." Each expert is designed to focus on specialized tasks. Further, a
gating mechanism is employed to dynamically activate the most relevant subset of experts based
on the input. While MoE is promising, LMA systems offer several distinct advantages:
One limitation of MoE is its high resource consumption. MoE models contain multiple experts
within a single architecture, which makes the total number of parameters rather huge. Furthermore,
training MoE is more resource-intensive and time-consuming than standard LLMs. This is mainly
due to the complex training process for the gating mechanism. Training the gating mechanism
involves optimizing the selection process for the most relevant experts, which adds considerable
overhead.
Since specific experts are dynamically activated based on input, MoE can be viewed as a method
to learn the internal routing of LLMs. However, there is no interaction and communication between
experts in MoE. On the other hand, LMA systems usually are designed to resemble real-world
collaborative workflows. Agents in LMA systems can actively communicate with each other,
exchange information, and iteratively refine the output based on feedback from other agents. More
importantly, LMA systems can also integrate external feedback from tools such as compilers, static
analyzers, or testing frameworks. LMA systems also facilitate seamless and continuous human-
in-the-loop collaboration, enabling human experts to intervene, validate outputs, and provide
guidance at any stage of the process. As a result, we consider LMA systems to be a more appropriate
approach to MoE to address the multifaceted challenges of software engineering.
6.2

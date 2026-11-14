---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 2-2
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
There have been rapid improvements in the ability of Large Language Models (LLMs)1
to perform a broad range of text processing tasks [3, 4, 5]. This has led to significant
interest in applying them to support experts across a range of domains [6], including public
health [7, 8, 9].
Previous work has often demonstrated considerable variation in how different LLMs perform
on a given task, and that a given LLM’s performance is highly dependent on the type and
nature of the task involved [10, 11, 12, 13, 14]. Therefore, to understand the potential
effective application of LLMs within public health an important prerequisite is developing
domain specific evaluations that are representative of the tasks, free text, and knowledge
that human experts regularly come across. Here, our overarching aim is to understand what
factors determine variations in performance, whether that be: the LLM, the nature of the
task, the type of free text, or the specific implementation details.
We evaluate LLMs across a wide range of public health tasks and free text. In this initial
work, using the definitions provided by Chang et al. [15], we focus on Automated Evaluation
(excluding LLM-as-a-Judge [16]) of Natural Language Understanding (NLU) tasks (e.g
classification and inference). We also focus solely on evaluating LLM in-context learning
(prompting) approaches.
These initial evaluations enable us to start assessing LLMs for potential use in public health
in an automated way, including: (1) continually assessing new and existing private and
open-weight LLMs for their potential applicability to public health, (2) identifying specific
areas of public health where LLMs could potentially be applied, (3) providing a baseline for
fine-tuning public health specific LLMs in the future.
We see this work as an important first step to understanding the potential of LLMs to perform
public health free text processing tasks. Further research is needed to investigate long form
Natural Language Generation (NLG) [15] tasks, with evaluation by public health experts, as
well as in-depth studies on specific use-cases and potential issues such bias.
2

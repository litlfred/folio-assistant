---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-002-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
herence, and (4) suggest code revision. The
results demonstrate CodeAgent’s effective-
ness, contributing to a new state-of-the-art in
code review automation. Our data and code
are publicly available (https://github.
com/Code4Agent/codeagent).
1
Introduction
Code review (Bacchelli and Bird, 2013; Bosu and
Carver, 2013; Davila and Nunes, 2021) imple-
ments a process wherein software maintainers ex-
amine and assess code contributions to ensure
quality and adherence to coding standards, and
identify potential bugs or improvements. In recent
literature, various approaches (Tufano et al., 2021,
2022) have been proposed to enhance the perfor-
mance of code review automation. Unfortunately,
major approaches in the field ignore a fundamen-
tal aspect: the code review process is inherently
interactive and collaborative (Bacchelli and Bird,
2013). Instead, they primarily focus on rewriting
and adapting the submitted code (Watson et al.,
*Corresponding author.
2022; Thongtanunam et al., 2022; Staron et al.,
2020).
In this respect, an effective approach
should not only address how to review the sub-
mitted code for some specific needs (e.g., vulner-
ability detection (Chakraborty et al., 2021; Yang
et al., 2024a)). Still, other non-negligible aspects
of code review should also be considered, like de-
tecting issues in code formatting or inconsisten-
cies in code revision (Oliveira et al., 2023; Tian
et al., 2022; Panthaplackel et al., 2021). However,
processing multiple sub-tasks requires interactions
among employees in different roles in a real code
review scenario, which makes it challenging to de-
sign a model that performs code review automati-
cally.
Agent-based systems are an emerging paradigm
and a computational framework in which au-
tonomous entities (aka agents) interact with each
other (Li et al., 2023a; Qian et al., 2023; Hong
et al., 2023) to perform a task. Agent-based ap-
proaches have been proposed to address a spec-
trum of software engineering tasks (Qian et al.,
2023; Zhang et al., 2024; Tang et al., 2023; Tian
et al., 2023), moving beyond the conventional sin-
gle input-output paradigm due to their exceptional
ability to simulate and model complex interac-
tions and behaviors in dynamic environments (Xi
et al., 2023; Yang et al., 2024b; Wang et al., 2023).
Recently, multi-agent systems have leveraged the
strengths of diverse agents to simulate human-
like decision-making processes (Du et al., 2023;
Liang et al., 2023; Park et al., 2023), leading to
enhanced performance across various tasks (Chen
et al., 2023; Li et al., 2023b; Hong et al., 2023).
This paradigm is well-suited to the challenge of
code review, where multiple reviewers, each with
diverse skills and roles, collaborate to achieve a
comprehensive review of the code..
This paper. Drawing from the success of agent-
based collaboration, we propose a multi-agent-
based framework CodeAgent to simulate the
arXiv:2402.02172v5  [cs.SE]  24 Sep 2024
dynamics of a collaborative team engaged in the
code review process, incorporating diverse roles
such as code change authors, reviewers, and deci-
sion makers. In particular, A key contribution of
CodeAgent is that we address the challenge of
prompt drifting (Zheng et al., 2024; Yang et al.,
2024c), a common issue in multi-agent systems
and Chain-of-Thought (CoT) reasoning. This is-
sue, characterized by conversations that stray from
the main topic, highlights the need for strategies
to maintain focus and coherence (Greyling, 2023;
Chae et al., 2023). This drift, often triggered by
the model-inspired tangents or the randomness of
Large Language Models (LLMs), necessitates the
integration of a supervisory agent. We employ an
agent named QA-Checker (for "Question-Answer
Checker") that monitors the conversation flow, en-
suring that questions and responses stay relevant
and aligned with the dialogue’s intended objec-
tive. Such an agent not only refines queries but
also realigns answers to match the original intent,
employing a systematic approach grounded in a
mathematical framework.
To evaluate the performance of CodeAgent,
we first assess its effectiveness for typical review
objectives such as detecting vulnerabilities 4.1 and
validating the consistency and alignment of the
code format 4.2. We then compare CodeAgent
with state-of-the-art generic and code-specific lan-
guage models like ChatGPT (OPENAI, 2022)
and CodeBERT (Feng et al., 2020).
Finally,
we assess the performance of CodeAgent com-
pared to the state-of-the-art tools for code revi-
sion suggestions (Tufano et al., 2021; Thongta-
nunam et al., 2022; Tufano et al., 2022). Since
each of these related works presents a specific
dataset, we also employ them toward a fair com-
parison.
Additionally, we also collect pull re-
quests from GitHub, featuring an extensive array
of commits, messages, and comments to evaluate
advanced capabilities.The experimental results re-
veal that CodeAgent significantly outperforms
the state-of-the-art, achieving a 41% increase in
hit rate for detecting vulnerabilities. CodeAgent
also excels in consistency checking and format
alignment, outperforming the target models. Fi-
nally, CodeAgent showcases its robustness for
code revision by presenting superior average edit
progress.
We summarize our contributions as follows:
• To the best of our knowledge, we are the first
to propose an autonomous agent-based sys-
tem for practical code review in the field of
software maintenance.
• We build a new dataset comprising 3 545
real-world code changes and commit mes-
sages. This dataset, which includes all rel-
evant files and details in a self-contained for-
mat, is valuable for evaluating advanced code
review tasks such as vulnerability detection,
code style detection, and code revision sug-
gestions.
• We demonstrate the effectiveness of the QA-
Checker. This agent monitors the conversa-
tion flow to ensure alignment with the orig-
inal intent, effectively addressing the com-
mon prompt drifting issues in multi-agent
systems.
Experimental evaluation highlights the perfor-
mance of CodeAgent: In vulnerability detec-
tion, CodeAgent outperforms GPT-4 and Code-
BERT by 3 to 7 percentage points in terms of
the number of vulnerabilities detected. For for-
mat alignment, CodeAgent outperforms ReAct
by approximately 14% in recall for inconsistency
detection. On the code revision task, CodeAgent
surpasses the state of the art in software engineer-
ing literature, achieving an average performance
improvement of about 30% in the Edit Progress
metric (Zhou et al., 2023).
2
CodeAgent
This section details the methodology behind our
CodeAgent framework. We discuss tasks and

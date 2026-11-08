---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-007-32-code-generation
section_title: "Code Generation"
section_number: 3.2
pages: 5-7
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
(3) Quality Assurance: bug, fault, defect, fuzz, test, vulnerab, verificat, validat
(4) Maintenance: debug, repair, review, refactor, patch, maintenanc
We focus on four key phases of the SDLC: requirements engineering, code generation, quality
assurance, and software maintenance. For each phase, the relevant SE keywords are combined
using the OR operator to capture all variations. The final search query for each SDLC phase follows
the format: [agent words] AND [SE words].
Following the guide of previous work [99, 128, 168], we design the following inclusion and
exclusion criteria. In the first phase, we filtered out short papers (exclusion criterion 1) and removed
duplicates (exclusion criterion 2). In the second phase, we manually screened each paper’s venue,
title, and abstract, excluding items such as books, keynote speeches, panel summaries, technical
reports, theses, tool demonstrations, editorials, literature reviews, and surveys (exclusion criteria
3 and 4). In the third phase, we conducted a full-text review to further refine relevant studies.
Following Section 2.3, we exclude papers that do not describe LMA systems (exclusion criterion 5).
Papers that rely solely on LLMs using non-agent-based methods or single-agent approaches are
excluded. Further, we focused on LMA systems powered by LLMs with strong planning capabilities,
such as ChatGPT and LLaMA, excluding models like CodeBERT and GraphCodeBERT. Since the
release of ChatGPT is in November 2022, we limited our review to papers published after this
date (exclusion criterion 6). Furthermore, we excluded papers unrelated to software engineering
(exclusion criterion 7) and those that mention LMA systems only in discussions or as future work,
without presenting experimental results (exclusion criterion 8). After the third phase, we identified
41 primary studies directly relevant to our research focus. The search process is conducted on
November 14th, 2024.
! The paper must be written in English.
! The paper must have an accessible full text.
! The paper must adopt LMA techniques to solve software engineering-related tasks.
% The paper has less than 5 pages.
% Duplicate papers or similar studies authored by the same authors.
% Books, keynote records, panel summaries, technical reports, theses, tool demos papers, editorials
% The paper is a literature review or survey.
% The paper does not utilize LMA systems, e.g., using a single LLM agent.
% The paper is published before November 2022 (the release date of ChatGPT).
, Vol. 1, No. 1, Article . Publication date: July 2025.
6
Junda He, Christoph Treude, and David Lo
% The paper does not involve software engineering related tasks.
% The paper lacks experimental results and mentions LMA systems only in future work or discussions.
Snowballing Search To expand our review, we conducted both backward and forward snow-
balling [143] on the relevant papers identified in previous steps. This process involved examining
the references cited by the relevant studies as well as publications that have cited these studies.
We repeated the snowballing process until reaching a transitive closure fixed point, where no new
relevant papers were found, resulting in an additional 30 papers identified.
3.1
Requirements Engineering
Requirements Engineering [91, 129] focuses on defining and managing software system require-
ments. This discipline is divided into several key stages to ensure requirements meet quality
standards and align with stakeholder needs. These stages include elicitation, modeling, specifica-
tion, analysis, and validation [25, 46].
Elicitron [9] is an LMA framework that focuses specifically on the elicitation stage. It utilizes
LLM-based agents to represent a diverse array of simulated users. These agents engage in simulated
product interactions, providing insights into user needs by articulating their actions, observations,
and challenges. MARE [59] is an LMA framework that covers multiple phases of requirements
engineering, including elicitation, modeling, verification, and specification. It employs five distinct
agents, i.e., stakeholder, collector, modeler, checker, and documenter, performing nine actions
to help generate high-quality requirements models and specifications. Sami et al. [115] propose
another LMA framework to generate, evaluate, and prioritize user stories through a collaborative
process involving four agents: product owner, developer, quality assurance (QA), and manager.
The produce owner generates user stories and initiates prioritization. The QA agent assesses story
quality and identifies risks, while the developer prioritizes based on technical feasibility. Finally,
the manager synthesizes these inputs and finalizes prioritization after discussions with all agents
3.2
Code Generation
Code generation [15, 45] has consistently been a longstanding focus of software engineering
research, aiming to automate coding tasks to boost productivity and minimize human error.
A prominent multi-agent setup for code generation typically on role specialization and iterative
feedback loops to optimize collaboration among agents. We summarize the common roles identified
in the literature, including the Orchestrator, Programmer, Reviewer, Tester, and Information Retriever.
The Orchestrator acts as the central coordinator, managing high-level planning and ensuring
smooth task execution across all agents. Its responsibilities include defining high-level strategic
goals, breaking them into actionable sub-tasks, delegating these tasks to the appropriate agents,
monitoring progress, and ensuring that workflows align with overall project objectives [17, 56,
60, 75, 76, 106, 155, 158]. For instance, PairCoder [158] features a Navigator agent that interprets
natural language descriptions to create high-level plans outlining solutions and key implementa-
tion steps. The Driver agent then follows these plans to handle code generation and refinement.
The Self-Organized Agents (SoA) framework [56] employs a hierarchical design, with Mother
agents managing high-level abstractions and delegating subtasks to specialized Child agents. In
CODES [155], the Orchestrator role is performed by the RepoSketcher, which converts high-level
natural language requirements into a repository sketch. This sketch outlines the project structure,
including directories, files, and inter-file dependencies. The RepoSketcher then delegates tasks
to the FileSketcher and SketchFiller, ensuring the efficient and seamless creation of a complete,
functional code repository.
, Vol. 1, No. 1, Article . Publication date: July 2025.
LLM-Based Multi-Agent Systems for Software Engineering:
Literature Review, Vision and the Road Ahead
7
During the implementation phase, the process typically begins with the Programmer, who is
responsible for writing the initial version of the code. Once the initial code is produced, roles
like the Reviewer and Tester step in to evaluate it, providing constructive feedback on quality,
functionality, and adherence to requirements. This feedback initiates an iterative cycle, where the
Programmer refines the code or the Debugger resolves identified issues, ensuring that the final
code meets the desired standards and performs as expected [21, 31, 69, 72, 81, 88, 96, 102, 132].
For example, INTERVENOR [132] pairs a Code Learner with a Code Teacher. The Code Learner
generates the initial code and then compiles it to evaluate its correctness. If issues are identified,
the Code Teacher analyzes the bug reports and the buggy code, subsequently providing repair
instructions to address the errors. Self-repair [102] and TGen [96] refine code by utilizing feedback
obtained from running pre-defined test cases.
When predefined test cases are unavailable, the Tester can generate a variety of test cases, ranging
from common scenarios to edge cases. These tests help uncover subtle issues that might otherwise
go unnoticed and provide actionable feedback to guide subsequent refinement iterations [53, 54, 56,
117].
Some frameworks employ the Information Retriever to gather relevant information to assist
code generation. For instance, Agent4PLC [87] and MapCoder [57] incorporate a Retrieval Agent
tasked with sourcing examples of similar problems and extracting related knowledge. This agent
provides essential contextual information and references tailored to the user’s input, ensuring that
solutions are well-informed and adhere to domain-specific best practices. Similarly, CodexGraph [85]
employs a translation agent to facilitate interaction with graph databases, which are built using
static analysis to extract code symbols and their relationships. By converting user queries into
graph query language, this agent enables precise and structured information retrieval, enhancing
the capability of LLM-based agents to navigate and utilize code repositories effectively.
Agent Forest [77] adopts a different paradigm instead of role specialization. Instead, it utilizes a
sampling-and-voting framework, where multiple agents independently generate candidate outputs.
Each output is then evaluated based on its similarity to the others, with a cumulative similarity
score calculated for each. The output with the highest score—indicating the greatest consensus
among the agents—is selected as the final solution.
3.3

---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-008-33-software-quality-assurance
section_title: "Software Quality Assurance"
section_number: 3.3
pages: 7-8
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
In this subsection, we review related work on testing, vulnerability detection, bug detection, and
fault localization, with a focus on how LMA systems are being employed to enhance software
quality assurance processes.
Testing. Fuzz4All [149] generates testing input for software systems across multiple programming
languages. In this framework, a distillation agent reduces user input while a generation agent
creates and mutates inputs. AXNav [123] is designed to automate accessibility testing. It interprets
natural language test instructions and executes accessibility tests, such as VoiceOver, on iOS devices.
AXNav includes a planner agent, an action agent, and an evaluation agent. WhiteFox [150] is a
fuzzing framework that tests compiler optimizations. It uses two LLM-based agents: one extracts
requirements from source code, and the other generates test programs. Additionally, LMA systems
are employed for tasks such as penetration testing [29], user acceptance testing [139], and GUI
testing [154].
Vulnerability Detection. GPTLens [51] is an LMA framework for detecting vulnerabilities in
smart contracts. The system includes LLM-based agents acting as auditors, each independently
identifying vulnerabilities. A critic agent then reviews and ranks these vulnerabilities, filtering
out false positives and prioritizing the most critical ones. MuCoLD [94] assigns roles like tester
and developer to evaluate code. Through discussions and iterative assessments, the agents reach
, Vol. 1, No. 1, Article . Publication date: July 2025.
8
Junda He, Christoph Treude, and David Lo
a consensus on vulnerability classification. Widyasari et al. [142] introduces a cross-validation
technique, where multiple LLM’s answer is validated against each other.
Bug Detection. Intelligent Code Analysis Agent (ICAA) [35] is used for bug detection in static code
analysis. The agents have access to tools like web search, static analysis, and code retrieval tools. A
Report Agent generates bug reports, while a False Positive Pruner Agent refines these reports to
reduce false positives. Additionally, ICAA includes Code-Intention Consistency Checking, which
ensures the code aligns with the developer’s intended functionality by analyzing code comments,
documentation, and variable names.
Fault Localiztion. RCAgent [138] performs root cause analysis in cloud environments by using
LLM-based agents to collect system data, analyze logs, and diagnose issues. AgentFL [110] breaks
down fault localization into three phases. The Comprehension Agent identifies potential fault
areas, the Navigation Agent narrows down the codebase search, and the Confirmation Agent uses
debugging tools to validate the faults.
3.4

---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-001-21-autonomous-agent
section_title: "Autonomous Agent"
section_number: 2.1
pages: 2-3
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
them as LLM-based agents in this paper).
Nevertheless, the application of singular LLM-based agents encounters limitations, since real-
world problems often span multiple domains, requiring expertise from various fields. In response
to this challenge, developing LLM-Based Multi-Agent (LMA) systems represents a pivotal evolution,
aiming to boost performance via synergistic collaboration. An LMA system harnesses the strengths
of multiple specialized agents, each with unique skills and responsibilities. These agents work in
concert towards a common goal, engaging in collaborative activities like debate and discussion.
These collaborative mechanisms have been proven to be instrumental in encouraging divergent
thinking [80], enhancing factuality and reasoning [32], and ensuring thorough validation [146]. As
a result, LMA systems hold promise in addressing a wide range of complicated real-world scenarios
across various sectors [49, 131, 137], such as software engineering [48, 75, 90, 109].
The study of software engineering (SE) focuses on the entire lifecycle of software systems [63],
including stages like requirements elicitation [39], development [2], and quality assurance [126],
among others. This multifaceted discipline requires a broad spectrum of knowledge and skills to
effectively tackle its inherent challenges in each stage. Integrating LMA systems into software
engineering introduces numerous benefits:
(1) Autonomous Problem-Solving: LMA systems can bring significant autonomy to SE tasks. It
is an intuitive approach to divide high-level requirements into sub-tasks and detailed imple-
mentation, which mirrors agile and iterative methodologies [68] where tasks are broken down
and assigned to specialized teams or individuals. By automating this process, developers are
freed to focus on strategic planning, design thinking, and innovation.
(2) Robustness and Fault Tolerance: LMA systems address robustness issues through cross-
examination in decision-making, akin to code reviews and automated testing frameworks, thus
detecting and correcting faults early in the development process. On their own, LLMs may
produce unreliable outputs, known as hallucination [151, 164], which can lead to bugs or system
failure in software development. However, by employing methods like debating, examining,
or validating responses from multiple agents, LMA systems ensure convergence on a single,
more accurate, and robust solution. This enhances the system’s reliability and aligns with best
practices in software quality assurance.
(3) Scalability to Complex Systems: The growth in complexity of software systems, with increas-
ing lines of code, frameworks, and interdependencies, demands scalable solutions in project
management and development practices. LMA systems offer an effective scaling solution by
incorporating additional agents for new technologies and reallocating tasks among agents based
on evolving project needs. LMA systems ensure that complex projects, which may be over-
whelming for individual developers or traditional teams, can be managed effectively through
distributed intelligence and collaborative agent frameworks.
Existing research has illuminated the critical roles of these collaborative agents in advancing
toward the era of Software Engineering 2.0 [90]. LMA systems are expected to significantly speed up
software development, drive innovation, and transform the current software engineering practices.
This article aims to delve deeper into the roles of LMA systems in shaping the future of software
engineering. It spotlights the current progress, emerging challenges, and the road ahead. We provide
a systematic review of LMA applications in SE, complemented by two case studies that assess
current LMA systems’ capabilities and limitations. From this analysis, we identify key research
gaps and propose a comprehensive agenda structured in two phases: (1) enhancing individual agent
capabilities and (2) optimizing agent collaboration and synergy. This roadmap aims to guide the
, Vol. 1, No. 1, Article . Publication date: July 2025.

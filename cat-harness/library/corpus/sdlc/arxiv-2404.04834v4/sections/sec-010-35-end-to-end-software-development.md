---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-010-35-end-to-end-software-development
section_title: "End-to-end Software Development"
section_number: 3.5
pages: 9-10
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
End-to-end software development encompasses the entire process of creating a software product.
While conventional code generation is often limited to producing isolated components such as
functions, classes, or modules, end-to-end development starts from high-level software requirements
and progresses through design, implementation, testing, and ultimately delivering a fully functional
and ready-to-use product.
In practice, developers and stakeholders typically adopt established software process models to
guide collaboration, such as Agile [26] and Waterfall [105]. Similarly, the design of LMA systems
for end-to-end software development draws inspiration from these software process models. The
development process is organized into distinct phases, such as requirements gathering, software
design, implementation, and testing. Each phase is managed by specialized agents with domain
expertise.
It is important to note that works such as FlowGen [81] and Self-Collaboration [31] emulate
various software process models. However, their experiments focus on generating code segments
rather than delivering fully developed software products. As a result, in this paper, these approaches
are not considered to be designed for true end-to-end software development.
Several works [33, 47, 48, 109, 112, 114, 155, 162] adopt the Waterfall model to automate software
development. The Waterfall model used in these multi-agent methods organizes the software
development process into distinct, sequential phases, where each stage must be completed before
proceeding to the next. The primary phases typically include Requirement Analysis, Architecture
Design, Code Development, Testing, and Maintenance. For instance, in MetaGPT [48], the Product
Manager agent thoroughly analyzes user requirements. The Architect agent then transforms these
, Vol. 1, No. 1, Article . Publication date: July 2025.
10
Junda He, Christoph Treude, and David Lo
requirements into detailed system design components. Subsequently, the Engineer implements
the specified classes and functions as outlined in the design. Finally, the Quality Assurance En-
gineer creates and executes test cases to ensure rigorous code quality standards are met. These
approaches emphasize a linear and sequential design process, ensuring structured progression and
clear accountability at each stage.
AgileCoder [101] and AgileGen [163] adopt Agile process models for software development,
emphasizing iterative development by breaking complex tasks into small, manageable increments.
AgileCoder [101] assigns Agile roles such as Product Manager and Scrum Master to facilitate sprint-
based collaboration and development cycles. AgileGen enhances Agile practices with human-AI
collaboration, integrating close user involvement to ensure alignment between requirements and
generated code. A notable feature of AgileGen is its use of the Gherkin language to create testable
requirements, bridging the gap between user needs and code implementation.
While most methods rely on predefined roles and fixed workflows for software development,
a few work [78, 82, 135] investing in dynamic process models. Think-on-Process (ToP) [82] in-
troduces a dynamic process generation framework. Since software development processes can
vary significantly depending on project requirements, ToP moves beyond the limitations of static,
one-size-fits-all workflows to enable more flexible and efficient development practices. Given a
software requirement, this framework leverages LLMs to create tailored process instances based on
their knowledge of software development. These instances act as blueprints to guide the architec-
ture of the LMA system, adapting to the specific and diverse needs of different projects. Similarly,
in MegaAgent [135], agent roles and tasks are not predefined but are generated and planned
dynamically based on project requirements. Both ToP and MegaAgent highlight the shift from
rigid, static workflows to dynamic, adaptive systems. These frameworks promise more efficient,
flexible, and context-aware software development practices, aligning processes with project-specific
requirements and complexities.
Additionally, instead of focusing on the process model, several works [107, 108] explore lever-
aging experiences from past software projects to enhance new software development efforts.
Co-Learning [107] enhances agents’ software development abilities by utilizing insights gathered
from historical communications. This framework fosters cooperative learning between two agent
roles—instructor and assistant—by extracting and applying heuristics from their task execution
histories. Building on this, Qian et al. [108] propose an iterative experience refinement (IER) frame-
work that enables agents to continuously adapt by acquiring, utilizing, and selectively refining
experiences from previous tasks, improving agents’ effectiveness and collaboration in dynamic
software development scenarios.
4

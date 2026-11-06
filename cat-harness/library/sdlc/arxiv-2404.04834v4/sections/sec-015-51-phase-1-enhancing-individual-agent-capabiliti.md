---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-015-51-phase-1-enhancing-individual-agent-capabiliti
section_title: "Phase 1: Enhancing Individual Agent Capabilities"
section_number: 5.1
pages: 12-17
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
Indeed, the effectiveness of an LMA system is closely linked to the capabilities of its individual
agents. This first phase is dedicated to improving these agents’ skills, with a particular focus on
adaptability and the acquisition of specialized skills in SE. The potential of individual LLM-based
agents in SE is further explored through our initial research questions:
(1) What SE roles are suitable for LLM-based agents to play and how can their abilities be enhanced to
represent these roles?
, Vol. 1, No. 1, Article . Publication date: July 2025.
LLM-Based Multi-Agent Systems for Software Engineering:
Literature Review, Vision and the Road Ahead
13
Phase 1: Enhancing Individual Agent Capabilities
Phase Two: Optimizing Agent Synergy
Refining Role-Playing 
Capabilities
Designing Robust and 
Adaptable Prompting 
Frameworks
Harmonizing Human-Agent 
Collaboration
Benchmarking Multi-agent 
Systems
Scaling Up for Complex 
Projects
Leveraging Industry 
Principles
Dynamic Adaptation of 
Agents and Resources
Secure and Responsible 
Data Management
Fig. 4. Research Agenda for LLM-Based Multi-Agent Systems in Software Engineering
(2) How to design an effective, flexible, and robust prompting language that enhances LLM-based
agents’ capabilities?
5.1.1
Refining Role-Playing Capabilities in Software Engineering.
The role-playing capabilities of LLM-based agents are pivotal within LMA systems [140]. To
address the complexity of software engineering tasks, we need specialized agents capable of
adopting diverse roles to tackle intricate challenges throughout the software development lifecycle.
Current State. Existing LMA systems, such as ChatDev [109], MetaGPT [48], and AgileCoder [101],
effectively simulate roles like generic software developers and product managers. The agents in
these systems rely on general-purpose LLMs such as ChatGPT. Although LLMs like ChatGPT
exhibit strong programming skills, they still lack the nuanced expertise required in SE [50]. This
limitation hampers their ability to simulate other SE-specific roles. For example, roles involving
vulnerability detection or security auditing require a deep understanding of security protocols,
threat modeling, and the latest vulnerabilities. However, multiple studies have identified deficiencies
in ChatGPT’s ability to accurately detect and repair vulnerabilities [18, 37, 120]. This shortcoming
underscores the need to integrate domain-specific expertise into LLMs to better support specialized
software engineering roles.
Opportunities. To address this limitation, we propose a structured and actionable three-step
approach encompassing the identification, assessment, and enhancement of role-playing abilities,
which are:
Step 1: Identifying and Prioritizing Key SE Roles.
Step 2: Assessing LLM-Based Agents’ Competencies Against Role Requirements.
Step 3: Enhancing Role-Playing Abilities Through Targeted Training.
The first step focuses on identifying key SE roles, prioritizing those with high industry demand
and the potential to substantially boost productivity. This involves:
(1) Market Analysis: To begin, we embark on a comprehensive market analysis. It is crucial to
assess not only the current trends and needs within the SE sector but also to anticipate future
shifts influenced by the integration of LLM-based agents. This analysis involves leveraging
various resources such as market reports, job postings, industry forecasts, and technology
, Vol. 1, No. 1, Article . Publication date: July 2025.
14
Junda He, Christoph Treude, and David Lo
trend analyses. Platforms like LinkedIn Talent Insights5, Gartner reports6, and Stack Overflow
Developer Surveys7 may also offer valuable data to inform this assessment. The focus should
be on identifying roles that are in high demand and demonstrate rapid growth, especially those
requiring specialized skills not typically found among generalist developers. For example,
machine learning engineers or cloud architects. Additionally, positions where LLM-based
agents could significantly enhance productivity, reduce costs, or accelerate innovation should
be evaluated. A key component of this analysis should be determining whether the market
has already begun shifting away from recruiting humans for tasks that LLM-based agents
can perform, such as routine coding or simple bug fixing. Identifying these trends will help
distinguish between roles that are still in demand and those where LLMs have reduced the
need for human expertise.
(2) Stakeholder Engagement: Engaging comprehensively with a diverse group of stakeholders
is essential. This process validates the findings from the market analysis and ensures that
the selected roles align with real-world needs. It involves consulting industry professionals
who have hands-on experience in the identified roles. This engagement can provide practical
insights and challenges associated with these positions. Collaboration with HR departments
from leading technology companies is also important. It helps gather perspectives on current
hiring trends, skill shortages, and the most sought-after competencies. Additionally, academic
experts and researchers can offer forward-thinking views on emerging technologies and
methodologies. By incorporating feedback from these various sources, the selection of key
roles becomes more robust to reflect both current industry demands and future directions.
(3) Value Addition Modeling: The next crucial step is value addition modeling [100], which
evaluates the potential advantages that LLM-based agents could bring to each prioritized role.
This process involves constructing detailed, data-driven models to analyze key performance
indicators such as efficiency improvements, cost reductions, quality enhancements, and the
acceleration of innovation resulting from the integration of agents. Pilot projects can be
deployed to gather empirical data on these metrics when LLM-based agents are applied
to specific tasks. Important factors to consider include the automation of repetitive tasks,
the augmentation of human capabilities, and the inclusion of new functionalities that were
previously unattainable. It is important to note that the value added by LLM-based agents
can differ significantly across different domains; for example, roles in software development
may prioritize automation, whereas domains like systems architecture might see more value
in LLMs augmenting complex decision-making around resource allocation or performance
optimization, where human expertise and contextual understanding remain essential. By
quantifying these value propositions, organizations can allocate resources more strategically
to roles where LLM-based agents are likely to yield the highest return on investment.
The second step involves understanding the limitations of LLM-based agents relative to the
demands of the identified SE roles:
(1) Competency Mapping: Competency mapping [66] entails developing comprehensive com-
petency frameworks for each specialized role. These frameworks define the essential skills,
knowledge areas, and competencies required, encompassing both technical and soft skills. For
instance, technical skills might encompass proficiency in specific programming languages,
tools, methodologies, and domain-specific knowledge. For a machine learning engineer, this
would include expertise in algorithms, data preprocessing, model training, and tools such
5https://www.linkedin.com/products/linkedin-talent-insights/
6https://www.gartner.com/en/products/special-reports
7https://survey.stackoverflow.co/2024/
, Vol. 1, No. 1, Article . Publication date: July 2025.
LLM-Based Multi-Agent Systems for Software Engineering:
Literature Review, Vision and the Road Ahead
15
as TensorFlow8 or PyTorch9. Soft skills include skills like problem-solving, critical thinking,
and collaboration. Clearly outlining these competencies creates a benchmark against which
the agents’ abilities can be measured.
(2) Performance Evaluation: The next phase is performance evaluation, which involves designing
or selecting tasks that closely replicate the real-world challenges associated with each role.
These tasks should be practical and scenario-based to accurately gauge the agents’ capabilities.
They should assess a wide range of competencies, from technical execution to critical thinking.
For example, in evaluating a DevOps engineer, the agent might be tasked with automating a
deployment pipeline using tools like Jenkins10 or Docker11, or troubleshooting a continuous
integration failure. Such tasks allow for a thorough assessment of both technical and soft
skills.
(3) Gap Analysis: This step compares the agents’ outputs with the expected outcomes for each
task. Key areas where the agents underperform–such as misunderstanding domain-specific
terminology, neglecting security best practices, or failing to optimize code–are identified and
documented. This analysis emphasizes both the agents’ strengths and weaknesses, offering
valuable insights into recurring patterns of errors or misconceptions.
(4) Expert Consultation and Iterative Refinement: To further refine the evaluation process, expert
consultation and iterative refinement are essential. By engaging with SE professionals who
specialize in the assessed roles, qualitative feedback on the agent’s performance can be
obtained. These experts provide insights into subtle nuances that may not be captured
through quantitative metrics. For instance, while the agent’s code may work, it might not
follow best practices or address scalability. This feedback helps refine evaluation methods,
update competency frameworks, and uncover deeper issues in the agent’s understanding.
The final step involves tailoring the LLM-based agents to effectively represent the identified SE
roles through specialized training and prompt engineering. :
(1) Curating Specialized Training Data: At first, this involves creating training datasets that reflect
the unique requirements of each specific role. A comprehensive corpus should be built from a
variety of sources, including technical documentation such as API guides, technical manuals,
and user guides to provide in-depth knowledge of specific technologies. It is also important to
incorporate academic and industry research papers, case studies, and whitepapers to capture
the latest developments, best practices, and theoretical foundations. Additionally, discussions
from forums and software Q&A sites like Stack Overflow12, Reddit13, and specialized industry
forums can provide practical problem-solving approaches and real-world challenges faced by
professionals.
(2) Fine-tuning the LLM: After preparing the data, the curated datasets are used to fine-tune the
LLM-based agents. Advanced techniques like parameter-efficient fine-tuning (PEFT) [83] are
often employed to optimize both efficiency and accuracy.
(3) Designing Customized Prompts: A key step is designing prompts tailored to improve the agents’
role adaptability. These prompts should clearly define the role, tasks, and goals to ensure the
agent understands the requirements. For instance, in a cybersecurity analyst role, the prompt
should outline specific security protocols, potential vulnerabilities, and compliance standards.
Contextual instructions, including relevant background, constraints, and examples, help the
8https://www.tensorflow.org/
9https://pytorch.org/
10https://www.jenkins.io/
11https://www.docker.com/
12https://stackoverflow.com/
13https://www.reddit.com/
, Vol. 1, No. 1, Article . Publication date: July 2025.
16
Junda He, Christoph Treude, and David Lo
agent grasp task nuances. Creating a library of effective prompts for various scenarios can
also serve as reusable templates for future tasks.
(4) Continuous Learning and Adaptation: To keep agents aligned with industry developments,
continuous adaptation mechanisms are essential. Training data should be regularly updated,
and models may be retrained to incorporate new technologies, best practices, and trends in
software engineering. Monitoring systems can track agent performance over time, enabling
proactive adjustments and continuous improvement. Additionally, agents should be guided
to consistently reference the latest documentation and standards to ensure their outputs
remain relevant and accurate.
While LMA roles may overlap with traditional software engineering roles, it is important to
recognize that they are not necessarily the same, as LMA roles often involve specialized, collabora-
tive tasks suited for agent-based systems. By systematically identifying key roles, assessing agent
competencies, and enhancing their capabilities through targeted fine-tuning, we aim to significantly
improve the effectiveness of LLM-based agents in specialized SE roles.
5.1.2
Advancing Prompts through Agent-oriented Programming Paradigms.
Effective prompts are crucial for the performance of LLM-based agents. However, creating
such prompts is challenging due to the need for a framework that is versatile, effective, and
robust across diverse scenarios. Natural language, while flexible, often contains ambiguities and
inconsistencies that LLMs may misinterpret. Natural language is inherently designed for human
communication, where human communication relies on shared context and intuition that LLMs
lack. In contrast, LLMs interpret text based on statistical patterns from large datasets, which may
lead to different interpretations than those intended for humans [121, 156]. This highlights the need
for a specialized prompting language designed to augment the cognitive functions of LLM-based
agents and treats LLMs as the primary audience. Such a language can minimize ambiguities and
ensure clear instructions, resulting in more reliable and accurate outputs.
Current State. Multiple prompting frameworks are released to facilitate the usage of LLMs. For
example, DSPy [67] and Vieira [79] enable fully automated generation of prompts. AutoGen [145]
and LangChain [97] support retrieval-augmented generation (RAG) [38] and agent-based workflows.
However, these frameworks are still human-centered. They often prioritize human readability and
developer convenience. As a result, there is a lack of research on a language that treats LLMs as the
primary audience for prompts.
Opportunities. Agent-oriented programming (AOP) [118] offers a promising foundation for this
approach. Similar to how Object-Oriented Programming (OOP) [141] organize objects, AOP treats
agents as fundamental units, focusing on their reasoning, objectives, and interactions. An AOP-
based prompting language could enable the precise expression of complex tasks and constraints,
allowing LLM-based agents to perform their roles with greater efficiency and accuracy. Extending
this concept to Multi-Agent-Oriented Programming (MAOP) [13, 14] allows for the creation of
systems where multiple LLM-based agents can collaborate, communicate, and adapt to evolving
contexts. By explicitly defining agent behaviors, communication patterns, and task hierarchies, we
can reduce ambiguity, mitigate hallucinations, and improve task execution in LMA systems.
Further, such a prompting language must be expressive enough to handle diverse and complex
tasks, yet simple enough for users to easily adopt. Conversely, overly simplified languages may lack
the expressive power needed to represent complex software engineering workflows. A complex
language that introduce a steep learning curve due to their syntax, hinder adoption, especially for
users who require simpler interfaces for prompt creation and modification. Balancing functionality
and usability will be another key research question to its success.
, Vol. 1, No. 1, Article . Publication date: July 2025.
LLM-Based Multi-Agent Systems for Software Engineering:
Literature Review, Vision and the Road Ahead
17
Additionally, this process may involve tailoring prompts specifically for different LLM models
and their versions, as variations in model architectures, training data, and capabilities can affect how
they interpret and respond to prompts. What works effectively for one model may not perform as
well for another, necessitating careful adjustments. Current prompting languages lack mechanisms
to easily adapt prompts across models, requiring manual adjustments and experimentation to
achieve consistent performance.
While AOP-based prompting may not be the final solution, it represents an important step
toward developing an AI-oriented language with grammar tailored specifically for LLMs. This new
approach could further refine communication with LLM-based agents, reducing misinterpretation
and significantly enhancing overall performance.
5.2

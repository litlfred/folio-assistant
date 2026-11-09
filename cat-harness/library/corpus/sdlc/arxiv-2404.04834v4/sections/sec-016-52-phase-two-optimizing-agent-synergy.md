---
doc_id: arxiv-2404.04834v4
doc_title: "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision and the Road Ahead"
section_id: sec-016-52-phase-two-optimizing-agent-synergy
section_title: "Phase Two: Optimizing Agent Synergy"
section_number: 5.2
pages: 17-22
source_pdf: arxiv-2404.04834v4.pdf
source_sha256: df742fea7776a7c0
toc_source: outline
---
In Phase Two, the spotlight turns towards optimizing agent synergy, underscoring the importance
of collaboration and how to leverage the diverse strengths of individual agents. This phase delves
into both the internal dynamics among agents and the role of external human intervention in
enhancing the efficacy of the LMA system. Key research questions guiding this phase include:
(3) How to best allocate tasks between humans and LLM-based agents?
(4) How can we quantify the impact of agent collaboration on overall task performance and outcome
quality?
(5) How to scale LMA systems for large-scale projects?
(6) What industrial organization mechanisms can be applied to LMA systems?
(7) What strategies allow LMA systems to dynamically adjust their approach?
(8) How to ensure security among private data sharing within LMA systems?
5.2.1
Human-Agent Collaboration.
Optimally distributing tasks between humans and LMA agents to leverage their respective
strengths is essential. Humans bring unparalleled creativity, critical thinking, ethical judgment,
and domain-specific knowledge [95]. In contrast, LLM-based agents excel at rapidly processing
large datasets, performing repetitive tasks with high accuracy, and detecting patterns that might
elude human observers.
Current State. Several LMA systems incorporate human-in-the-loop designs. For instance, AISD [162]
involves human input during requirement analysis and system validation, where users provide
feedback on use cases, system designs, and prototypes. Similarly, MARE [59] leverages human
assessment to refine generated requirements and specifications. Although these works demon-
strate the feasibility of human contributions, key research questions, including optimizing human
roles, enhancing feedback mechanisms, and identifying appropriate intervention points, are still
underexplored.
Opportunity. Developing role-specific guidelines that outline when and how human intervention
should occur is essential. These guidelines should assist in identifying critical decision points where
human judgment is indispensable, such as ethical considerations, conflict resolution, ambiguity
handling, and creative problem-solving. For example, ethical decisions necessitate human oversight
to ensure alignment with societal norms and values, and conflict resolution may require negotiation
skills that LLM-based agents lack.
To facilitate seamless collaboration, designing intuitive user-friendly interfaces and interaction
protocols is essential [133]. Natural language interfaces and adaptive visualization techniques can
make interactions more accessible. These interfaces should efficiently present agent outputs in
a digestible format and collect user feedback, while also managing the cognitive load on human
collaborators. It is important to note that these interfaces may need to be tailored differently for
, Vol. 1, No. 1, Article . Publication date: July 2025.
18
Junda He, Christoph Treude, and David Lo
each human role, as the needs of a project manager, a software developer, and a quality assurance
engineer will vary significantly.
Given the complexity of information generated during the agents’ workflows [60], designing
such interfaces poses challenges. For instance, presenting modifications suggested by an agent at
varying levels of abstraction ensures that each stakeholder can engage with the information at the
right depth. A project manager might focus on the broader implications, such as the high-level
impact on project timelines or deliverables, whereas a developer or architect might drill down into
specific implementation details. Role-specific interfaces will be key to ensuring each stakeholder
can effectively collaborate with the agents and extract the necessary information in a manner
suited to their specific responsibilities.
Additionally, developing predictive models to determine the optimal human-to-agent ratio across
different project types and stages is a fundamental concern. These models must assess factors
such as project complexity, time constraints, project priorities, and the specific capabilities and
limitations of both human participants and LMA agents. By doing so, tasks can be allocated in a
manner that fully harnesses both human ingenuity and agent efficiency throughout the project.
Machine learning techniques could also be leveraged to analyze historical project data to predict
effective collaboration strategies.
5.2.2
Evaluating the LMA systems.
Current State. Numerous complex benchmarks have been proposed to challenge the capabilities
of LLMs in critical aspects of software development, such as code generation [58, 84, 171]. While
these benchmarks have advanced the field by providing measurable metrics for individual tasks,
their focus on isolated problem-solving reveals limitations as software engineering projects become
more complex. Software engineering is inherently collaborative, with key activities like joint
requirements gathering, code integration, and peer reviews playing essential roles in the process.
Current benchmarks often overlook these aspects, failing to assess how well LLMs perform in tasks
that require cooperation and collective decision-making.
Opportunities. There is a growing need for benchmarks that evaluate the cooperative abilities
of LLMs in multi-agent settings, particularly for software engineering tasks. These benchmarks
should simulate real-world collaborative scenarios where LLM agents work together to achieve
common development goals.
Such benchmarks should include tasks where agents must:
(1) Participate in collaborative design: Agents should contribute ideas, propose design solutions,
and converge on a unified architecture that balances trade-offs.
(2) Delegate and coordinate tasks: Effective task division is crucial. Agents should assign respon-
sibilities based on expertise, manage dependencies, and adjust as the project evolves.
(3) Identify conflicts and negotiate: In collaborative settings, disagreements are inevitable. First,
LLMs often struggle to identify conflicts in real time unless explicitly guided to do so [1].
Therefore, agents should be evaluated on their ability to recognize these conflicts—whether
in logic, goals, or execution. Moreover, agents should be tested on their ability to handle
conflicts constructively. This includes proposing compromises, engaging in constructive
negotiation, and ensuring that the team remains aligned with the overarching objectives.
Evaluations should focus on the agents’ capacity to balance competing priorities, mitigate
misunderstandings, and foster consensus, all while maintaining progress toward shared goals.
(4) Integrate components and perform peer reviews: Agents should seamlessly integrate their work,
review each other’s code for quality assurance, and provide constructive feedback.
(5) Proactive Clarification Request : Agents should not assume complete understanding when
uncertainty arises. Instead, they should preemptively ask for additional information or
, Vol. 1, No. 1, Article . Publication date: July 2025.
LLM-Based Multi-Agent Systems for Software Engineering:
Literature Review, Vision and the Road Ahead
19
clarification to avoid potential errors or misunderstandings. Evaluating agents on this ability
ensures they are capable of identifying gaps in their knowledge or instructions and can
actively seek out the necessary context or data to complete tasks effectively.
To develop such benchmarks, we need to create realistic project scenarios that require multi-agent
collaboration over extended periods. These scenarios should reflect common software development
challenges, such as evolving requirements and tight deadlines. Additionally, platforms or sandboxes
must be built to provide controlled environments where collaborative interactions between agents
can be observed and measured. These platforms should establish clear interaction rules, including
languages, formats, and communication channels, to facilitate effective information exchange.
Most importantly, comprehensive metrics must be developed to assess not just the final output,
but also the collaboration process itself. These metrics could measure communication efficiency,
ambiguity resolution, conflict management, adherence to best practices, and overall project success.
5.2.3
Scaling Up for Complex Projects.
As software projects become more complex, a single LLM-based agent may hit its performance
limits. Inspired by the scaling properties of neural models [10], LMA systems can potentially
enhance performance by increasing the number of agents within the system. While adding more
agents can provide some benefits, handling more complex projects introduces challenges that
require more refined solutions.
Current State. Existing LMA systems face significant challenges when scaling up to handle complex
software projects. Our case studies illustrate these limitations clearly. For instance, ChatDev was
unable to autonomously develop a functional Tetris game. In real-world projects with higher
complexity, this limitation becomes even more pronounced.
Opportunities. First, as software projects grow in size and complexity, breaking down high-level
requirements into manageable sub-tasks becomes more difficult. It is not just about handling
more tasks but also managing the intricate interdependencies between them. A hierarchical task
decomposition approach can help, where higher-level agents oversee broader objectives and delegate
specific tasks to lower-level agents. This structure streamlines planning and makes global task
allocation more efficient.
Second, as the number of agents increases, so does the complexity of communication. Coordinat-
ing multiple agents can lead to communication bottlenecks and information overload. Additionally,
large-scale software projects challenge the memory capacity of individual agents, making it harder
to store and process the extensive information required. Efficient communication protocols and mes-
sage prioritization are crucial to mitigating these issues. For instance, agents can use summarized
updates instead of detailed reports, reducing communication overhead and memory usage. From
the outset, the system should be designed with scalability in mind, ensuring that both software and
hardware resources can expand efficiently as the number of agents increases.
Moreover, with more agents comes the risk of inconsistencies and conflicts in the shared infor-
mation. A centralized knowledge repository or shared blackboard system can ensure that all agents
have access to consistent, up-to-date information, acting as a single source of truth and minimizing
the spread of misinformation. Robust error handling mechanisms should also be implemented to
detect and correct issues autonomously before they escalate into significant failures.
Finally, as the number of agents grows, so do the rounds of discussion and decision-making,
which can slow down progress. To avoid this, decision-making hierarchies or consensus algorithms
can streamline the process. For example, only a subset of agents responsible for a specific module
may need to reach a consensus, rather than involving the entire agent network.
5.2.4
Leveraging Industry Principles.
, Vol. 1, No. 1, Article . Publication date: July 2025.
20
Junda He, Christoph Treude, and David Lo
As LLM-based agents can closely mimic human developers in SE tasks, they can greatly benefit
from adopting established industry principles and management strategies. By emulating organi-
zational frameworks used by successful companies, LMA systems can improve their design and
optimization processes. These industrial mechanisms enable LMA systems to remain agile, efficient,
and effective, even as project complexities grow.
Current State. As we described in Section 3, numerous works [5, 48, 101, 109] are designed
using popular process models like the Waterfall and Agile. For example, ChatDev [109] emulates a
traditional Waterfall approach, breaking tasks into distinct phases (e.g., requirement analysis, design,
implementation, testing), with agents dedicated to each phase. AgileCoder [101] incorporates the
Agile methodologies, leveraging iterative development, continuous feedback loops, and collaborative
sprints.
Opportunities. However, current LMA systems often do not leverage more specialized and modern
industry practices, such as Value Stream Mapping, Design Thinking, or Model-Based Systems
Engineering (MBSE). Additionally, frameworks like Domain-Driven Design (DDD), Behavior-Driven
Development (BDD), and Team Topologies remain underutilized. These methodologies emphasize
aligning development with business goals, improving user-centric design, and optimizing team
structures—key components that could further enhance the efficiency, adaptability, and effectiveness
of LMA systems.
Leadership and governance structures from industrial organizations provide valuable insights
for designing LMA systems. Project management tools and practices, essential for coordinating
large development teams, can be applied to LMA systems to enhance their operational efficiency.
Using established project management frameworks, LMA systems can monitor progress, allocate
resources, and manage timelines effectively. Agents can dynamically update task boards, report
milestones, and adjust workloads in real-time based on project data. This not only improves
transparency but also allows for early detection of bottlenecks or delays, ensuring projects stay on
track.
Incorporating design patterns and software architecture best practices further strengthens LMA
systems [70]. By adhering to these principles, agents can produce well-structured, maintainable
code that is scalable and reusable. This reduces technical debt and ensures that the solutions
developed by LMA systems are easier to integrate, maintain, and expand in the future.
5.2.5
Dynamic Adaptation.
In the context of software development, predicting the optimal configuration for LMA systems
at the outset is unrealistic due to the inherent complexity and variability of tasks [71]. The dynamic
nature of software requirements and the unpredictable challenges that arise during development
necessitate systems that can adapt on the fly [88]. For example, a sudden shift in project requirements
or unexpected delays caused by dependencies on external components. Therefore, LMA systems
must be capable of dynamically adjusting their scale, strategies, and structures throughout the
development process.
Current State. Most existing LMA systems [48, 109] operate with static architectures characterized
by fixed agent roles and predefined communication patterns. Recent research efforts [89, 157] have
introduced mechanisms for adaptive agent team selection and task-specific collaboration strategies.
These methods enable the selection of suitable agent team configurations for specific tasks, however,
they still fall short of true dynamic adaptation and lack the capability to adjust to real-time changes.
To the best of our knowledge, no previous work addresses the need for on-the-fly adjustments in
response to evolving project demands.
Opportunities. To minimize redundant work, LMA systems should continuously evaluate exist-
ing solutions [136], identifying reusable elements for new requirements. By learning from each
, Vol. 1, No. 1, Article . Publication date: July 2025.
LLM-Based Multi-Agent Systems for Software Engineering:
Literature Review, Vision and the Road Ahead
21
development cycle, the system can recognize patterns of efficiency and inefficiency, enabling it to
make informed decisions when handling similar tasks in the future or adapting existing solutions
to new requirements.
A key element of dynamic adaptation is the ability to automatically adjust the number of agents
involved in a project [41]. This includes not only scaling the number of agents up or down as needed
but also generating new agents with new specialized roles to meet emerging task requirements,
ensuring both efficiency and responsiveness. Additionally, the system can replicate agents in
existing roles to manage increased workloads. Furthermore, LMA systems can generate new
agents that come equipped with contextual knowledge of the project—such as its history, current
state, and objectives—by accessing shared knowledge bases, project documentation, and recent
communications. This allows new agents to integrate smoothly and contribute effectively right
from the start, reducing onboarding time and minimizing disruptions.
Another key component is the dynamic redefinition of agent roles [61]. As the project evolves,
certain roles may become obsolete while new ones emerge. LMA systems should be capable of
reassigning roles to agents or modifying their responsibilities to better align with current project
needs. This flexibility enhances the system’s ability to adapt to changing requirements and priorities.
Dynamic adaptation also involves the reallocation of memory and computational resources. As
agents are added or removed and tasks shift in complexity, the system must efficiently distribute
resources to where they are most needed. This may include scaling computational power for agents
handling intensive tasks or increasing memory allocation for agents processing large datasets.
Effective resource management ensures that the system operates optimally without unnecessary
strain on infrastructure.
Finally, the uncertainty of the software development process makes it challenging to define
effective termination conditions [119]. Relying solely on predefined criteria may result in infinite
loops or premature task completion. To address this, LMA systems must incorporate real-time
monitoring and feedback loops to continuously evaluate progress. Machine learning techniques
can help predict optimal stopping points by analyzing historical data and current performance
metrics, allowing for informed adjustments to task completion criteria as the project evolves.
5.2.6
Privacy and Partial Information.
In multi-organizational software development projects, data often resides in silos due to privacy
concerns, proprietary restrictions, and regulatory compliance requirements [103]. Each entity may
have its own data governance policies and competitive considerations that limit data sharing. This
fragmentation poses significant challenges in enabling agents to access necessary information
while ensuring that privacy is maintained. Moreover, a lack of transparency in data sources and
processes can exacerbate the risk of privacy violations, which may go unnoticed if data handling
activities are not fully visible to all parties [27].
Current State. The challenge of ensuring privacy while managing partial information has been
extensively studied in the field of computer security. [11, 30]. To the best of our knowledge, existing
research has yet to provide a solution to these challenges for LMA systems in SE.
Opportunities. To address these challenges, robust and fine-grained access control mechanisms
must be implemented across organizational boundaries. It is essential to prevent unauthorized
access while still accommodating the varied data access needs of the system. Traditional models
like Role-Based Access Control (RBAC) [116] and Attribute-Based Access Control (ABAC) [52] may
need to be extended to handle the dynamic nature of multi-agent systems effectively. Establishing
protocols that allow agents to share insights derived from sensitive data, without exposing the
data itself, is critical. Advanced privacy-preserving techniques like Differential Privacy [34], Secure
, Vol. 1, No. 1, Article . Publication date: July 2025.
22
Junda He, Christoph Treude, and David Lo
Multi-Party Computation (SMPC) [40], Federated Learning [62], or Homomorphic Encryption [153]
can be leveraged to ensure that agents collaborate without compromising data privacy.
Moreover, compliance with data protection laws such as the General Data Protection Regulation
(GDPR) [130] in the EU and the California Consumer Privacy Act (CCPA) [104] in the U.S. is
crucial. LMA systems should follow privacy-by-design principles, ensuring that data subjects’
rights are upheld, and that data processing activities remain transparent and lawful. This includes
implementing mechanisms for data minimization, consent management, and honoring the right to
be forgotten.
For non-sensitive data, integrated data storage solutions can reduce redundancy, improve data
consistency, and increase efficiency. This can be achieved through distributed databases accessible
to authorized agents, along with data synchronization mechanisms to ensure agents have up-to-date
information in real time. Additionally, using technologies like blockchain [167] and distributed
ledgers [122] can enhance transparency, traceability, and tamper-resistance in recording agent
transactions and data access events, fostering greater trust among collaborating entities.
6

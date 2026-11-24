---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-006-32-fault-propagation-traces-proposal
section_title: "Fault Propagation Traces Proposal"
section_number: 3.2
pages: 3-5
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Since issue descriptions rarely pinpoint exact modification loca-
tions, agents need to identify the fault propagation trace for issue
resolution. To enable competitive fault localization, our algorithm
generates multiple candidate fault propagation traces as localiza-
tion proposals, followed by a competitive multi-agent debate to
select the most promising trace. A fault propagation trace refers
to a structured chain of code entities (e.g., classes, methods, func-
tions, variables) that reflect how defects may propagate through
the codebase.
Dependency Graph Construction. The algorithm begins by
building a static dependency graph 𝐺= (𝑉, 𝐸), where the node
set 𝑉represents code entities and the edge set 𝐸captures their de-
pendency relationships including function calls, class inheritance,
module imports, and variable references. This graph serves as the
structural backbone for tracing potential fault propagation traces,
allowing agents to explore the codebase in a systematic way.
Conference’17, July 2017, Washington, DC, USA
Li et al.
InitialEnitity1：
get_foo_bar_display
InitialEnitityk-1:
FooBar
InitialEnitityk：
get_FIELD_display
Debate
Round1
Round2
Round3
Modification Plan Debate
<plan>
***stage 1***
instruction: 
Modify the contribute_to_class
method in 
db/models/fields/__init__.py to 
check for existing 
get_FIELD_display method 
before setting the default 
implementation
context: 
db/models/fields/__init__.py:Fi
eld.contribute_to_class, lines 
765-767
***stage 2***
……
</plan>
Extract Initial Entities
Fault Propagation Traces Proposal
Localization Chain Selection
Synthesize Modification Plan
Entity
Contain
Inherit
Import
Invoke
Chain 1
Chain 2
Chain 3
Chain N
Editor
Patch
Environment
MCTS
Issue django-11999：
Cannot override get_FOO_display() 
in Django 2.2+.
Description
I cannot override the 
get_FIELD_display function on 
models since version 2.2. It works in 
version 2.1.
Example:
class FooBar(models.Model):
foo_bar = models.CharField(_("foo"), 
choices=[(1, 'foo'), (2, 'bar')])
def __str__(self):
return self.get_foo_bar_display() 
# This returns 'foo' or 'bar' in 2.2, 
but 'something' in 2.1
def get_foo_bar_display(self):
return "something"
What I expect is that I should be 
able to override this function.
Best Chain
Figure 2: Overview of SWE-Debate framework.
Identifying Entry Nodes via Semantic Matching. Next, the
algorithm identifies the top-𝐾entities 𝐸𝑝= 𝑒1, . . . ,𝑒𝐾that are
most relevant to the issue description through semantic matching.
We employ a language model-based approach to extract structural
identifiers that are explicitly referenced in the issue text from the
dependency graph represented as an adjacency matrix and entity
metadata. These entities encompass specific code-level structural
elements such as class names, function names, parameter names,
or error names (e.g., "UserSession", "Redis", "wholesale") that ap-
pear directly in the issue description. The extraction process priori-
tizes such structural identifiers while maintaining diversity through
deduplication mechanisms. To ensure precision, the selection is con-
strained to only include entities with direct textual correspondence
in the issue description, preventing the introduction of spurious en-
try points that could mislead subsequent chain construction. These
high-confidence entities act as entry points for subsequent chain
construction.
Chain Construction via Graph Traversal. To capture diverse
propagation patterns, we systematically traverse the dependency
graph using a two-phase strategy for each seed entity 𝑒𝑖∈𝐸𝑝: (1)
Breadth-First Expansion: We identify top-𝑊most issue-relevant
neighboring nodes based on semantic and structural relevance. We
first extract the top-K entities from the issue text, which are strongly
associated with the described problem. However, in many cases, the
root cause of an issue is not explicitly linked to specific functions
or components within the issue description. To address this, we
expand the context by retrieving code snippets related to each of
the top-K entities using the dependency graph. These code snippets,
along with the original issue, are then fed into the LLM individually.
This enriched context allows the model to identify more diverse
and informative entities as potential starting points for the localiza-
tion chain, effectively expanding the search space and improving
localization accuracy. (2) Depth-First Search: From each selected
neighbor, we perform a depth-limited traversal (maximum depth
of 𝐿), selecting the most promising next entity at each step. The
selection is guided by a composite scoring function that considers
both semantic similarity to the issue and structural importance
in the dependency graph. This process results in a total of top-𝐾
× top-𝑊localization chains, each representing a plausible fault
propagation path.
These localization chains capture fault propagation patterns
through dependency relationships—defects in one component af-
fecting dependent components via call chains, inheritance hierar-
chies, or data flow. This structured approach efficiently identifies
propagation paths that would require extensive exploration to dis-
cover through search-based methods, enabling the competitive
debate process described next.
3.3
Multi-Agent Debate
With the localization chains identified through graph-guided anal-
ysis, we synthesize a consolidated fix plan through a competitive
multi-agent debate. This requires evaluating competing architec-
tural approaches—some chains may target core system components
while others suggest more localized fixes, each with different impli-
cations for maintainability and system robustness. Our competitive
debate forces agents to propose, defend, and refine their modifi-
cation plans, ultimately converging on the most consolidated fix
plan.
Localization Chain Selection. From the 𝐾×𝑊candidate chains,
we form a diverse set by selecting the longest chain plus the (𝑚−
1) most distinct chains computed based on semantic embeddings.
Multiple specialized agents then engage in competitive ranking,
where each agent independently evaluates and ranks these𝑚chains
based on their analytical perspective. Through this localization-
level debate, agents must defend their chain preferences against
alternatives, revealing structural insights that single-agent selection
SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution
Conference’17, July 2017, Washington, DC, USA
would miss. We select the chain with the highest aggregate vote as
the optimal localization path, which serves as the foundation for
the subsequent modification plan debate.
Modification Plan Proposal. Based on the selected localization
chain from the competitive debate, we generate a comprehensive
modification plan, which systematically specifies the exact code
locations requiring changes, the types of modifications needed, and
their implementation priorities.
The transformation from localization chains to modification pro-
posals is implemented through a specialized prompt-driven analysis
framework. Given a localization chain 𝐶= {𝑒1,𝑒2, ...,𝑒𝑘} and issue
description 𝐼, each agent applies a structured analysis prompt that
guides the examination of each entity 𝑒𝑖in the chain. The prompt
instructs agents to: (1) analyze code structure and functionality, (2)
identify specific modification targets, (3) determine modification
types (fix_bug, add_feature, refactor, optimize), (4) assess prior-
ity levels, and (5) provide implementation reasoning. The output
is a structured JSON specification that maps each chain entity to
concrete modification targets with precise location descriptions,
priority rankings, and implementation strategies.
We use 𝑁such agents to form a pool of 𝑁diverse modification
proposals. This multi-agent approach ensures comprehensive cover-
age of potential modification strategies as each agent contributes its
unique analytical viewpoint to form a diverse pool of modification
proposals.
Competitive Strategy Refinement. Each agent reviews all pro-
posals from the independent analysis phase and engages in struc-
tured argumentation to defend their approach while critically evalu-
ating alternatives. This competitive refinement phase addresses the
limitation of independent analysis by forcing agents to explicitly
justify their reasoning against competing perspectives, revealing
hidden assumptions and identifying potential weaknesses in initial
proposals. Agents generate refined modification plans that incor-
porate insights from cross-agent critique while maintaining their
specialized analytical focus, driving deeper understanding of the
fault localization.
Synthesize modification plan. Based on the refined proposals
from the competitive refinement phase, a discriminator agent syn-
thesizes insights from all refined proposals to produce a coherent,
actionable modification plan with prioritized steps and rationale.
This final selection phase is essential because competitive refine-
ment may produce multiple valid but incompatible strategies that
require unified resolution for practical implementation. The dis-
criminator evaluates trade-offs between competing architectural
approaches, considers implementation complexity and risk factors,
and generates a structured plan that guides downstream repair
processes with both strategic direction and tactical specificity.
This competitive process addresses the limitations of agents’
limited individual observation and exploration scope by leveraging
diverse specialized perspectives and finding architecturally sound
solutions through argumentative rigor. The debate produces a struc-
tured modification plan with strategic insights, and this high-level
plan can then be leveraged to guide the subsequent repair process.
3.4

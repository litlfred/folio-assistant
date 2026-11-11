---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-003-pipeline
section_title: "Pipeline"
section_number: null
pages: 2-4
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
fined role cards in Section 2.3, and the design of
the QA-Checker in Sec 2.4.
2.1
Tasks
We define CA, VA, FA, and CR in as following:
CA (Zhang et al., 2022): Consistency analysis be-
tween code change and commit message; the task
is to detect cases where the commit message ac-
curate describes (in natural language) the intent of
code changes (in programming language).
VA (Braz et al., 2022): Vulnerability analysis; the
task is to identify cases where the code change in-
troduces a vulnerability in the code.
FA (Han et al., 2020): Format consistency analysis
between commit and original files; the task is to
Commit Message
Pull Request
I prossess a piece of code that might contain some bugs. Could you assist in
inspecting it for any issues? If problems are found, I would appreciate the
provision of a corrected version. I am seeking an in-depth review of the
code, specially focusing on the following aspect:......
CodeAgent
Phases：
Basic Info Sync；
Document
N
## Output
document
Code
modality
Language
Role Definition:
##Conversations
Basic Info Sync Document
Your main responsibilities include being an
active decision-maker on code review.....
User
CEO
Reviewer
CPO
Coder
Team Roles
CTO
Check in loop
N
N
##Files
N
Phases：
Basic Info Sync
N
## Output
modality
Language
Role Definition:
##Conversations
Basic Info Sync
You are CTO of CodeAgent, you are fimiliar to virous
programming languages and  good at overarching....
Phases：
Code Review;
Code Alignment;
Document
N
Role Definition:
##Conversations
Document
Your main responsibilities include being an
active decision-maker on code review.....
N
N
##Revised codes
## Action Analysis
To address this potential bug, I recommend using the
"Objects.equals" method instead of directly calling "equals" on the
"expected" object. This will ensure a null-safe and consistent
comparison.
Code
Alignment
Code
Review
##Files
Code
Log
Role Definition:
##Conversations
You are a Code reviewer at CodeAgent collaborating to
ensure software quality by assessing code for defects,
vulnerabilities, and consistency issues, fixing bugs, and
suggesting improvements...
Phases：
Code Review;
Code Alignment
N
N
Code
Alignment
Code
Review
##Consistency  Analysis
... I found that there is a lack of semantic consistency between
them. The commit message does not accurately reflect the
changes mad in the code. This inconsistency
##Security  Analysis
... I did not find nay modifications in the code that could introduce
security vulnerabilities, attacks, or bugs....However, it is always
recommended to conduct a thorough security review of the entire
codebase to ensure ....
## Format Analysis
The format of the code snippet does not align with the writing
style and format of the original file. Inconsistent formatting can
negatively impact the readability and maintainability of the
project. It is important to maintain a consistent coding....
## Revision Suggestions
I recommend aligning the code snippet with the writing style. I suggest revising the code to fix the
potential risk
Phases：
Document
Role Definition:
##Conversations
You are a CPO woking in codeagent, you are responsible for
assisting CEO and coder to summary code review reports...
##Files
N
Document
N
document
code
original file
conversation
CEO
CTO
Reviewer
Coder
CPO
Figure 1: A Schematic diagram of role data cards of simulated code review team and their conversations
within CodeAgent. We have six characters in CodeAgent across four phases, including “Basic Info Sync",
“Code Review", “Code Alignment", and “Document". Code review is a kind of collaboration work, where we
design conversations between every two roles for every step to complete the task.
validate that the code change formatting style is
not aligned with the target code.
CR (Zhou et al., 2023): Code revisions; this task
attempts to automatically suggest rewrites of the
code change to address any issue discovered.
2.2
Pipeline
We defined six characters and four phases for the
framework.
The roles of the characters are il-
lustrated in Figure 1. Each phase contains mul-
tiple conversations, and each conversation hap-
pens between agents.
The four phases consist
of 1) Basic Info Sync, containing the roles of
chief executive officer (CEO), chief technology
officer (CTO), and Coder to conduct modality and
language analysis; 2) Code Review, asking the
Coder and Reviewer for actual code review (i.e.,
target sub-tasks); 3) Code Alignment, supporting
the Coder and Reviewer to correct the commit
through code revision and suggestions to the au-
thor; and 4) Document, finalizing by synthesiz-
ing the opinions of the CEO, CPO (Chief Prod-
uct Officer), Coder, and Reviewer to provide the
final comments. In addition to six defined roles,
the proposed architecture of CodeAgent consists
of phase-level and conversation-level components.
The waterfall model breaks the code review pro-
cess at the phase level into four sequential phases.
At the conversation level, each phase is divided
into atomic conversations. These atomic conver-
sations involve task-oriented role-playing between
two agents, promoting collaborative communica-
tion. One agent works as an instructor and the
other as an assistant. Communication follows an
instruction-following style, where agents interact
to accomplish a specific subtask within each con-
versation, and each conversation is supervised by
QA-Checker.
QA-Checker is used to align the
Basic Info Sync
Code Review
Code Alignment
Document
Instructor
Assistor
Modality
Language
Code/Doc
Code/Doc
Reviews
Commit Message
Pull Request
code
original file
looped conversations
N
Code/Doc
N
N
N
N
N
N
N
N
User
CEO
Reviewer
CPO
Coder
CTO
Roles
Figure 2: CodeAgent’s pipeline/scenario of a full conversation during the code review process among different
roles. “Basic Info Sync” demonstrates the basic information confirmation by the CEO, CTO, and Coder; “Code
Review” shows the actual code review process; “Code Alignment” illustrates the potential code revision; and
“Document” represents the summarizing and writing conclusion for all the stakeholders. All the conversations
are being ensured by the Quality Assurance checker until they reach the maximum dialogue turns or meet all the
requirements.
consistency of questions and answers between the
instructor and the assistant in a conversation to
avoid digression. QA-Checker will be introduced
in Section 2.4.
Figure 2 shows an illustrative example of the
CodeAgent pipeline. CodeAgent receives the
request to do the code review with the submitted
commit, commit message, and original files. In
the first phase, CEO, CTO, and Coder will co-
operate to recognize the modality of input (e.g.,
document, code) and language (e.g., Python, Java
and Go). In the second phase, with the help of
Coder, Reviewer will write an analysis report on
consistency analysis, vulnerability analysis, for-
mat analysis and suggestions for code revision. In
the third phase, based on analysis reports, Coder
will align or revise the code if any incorrect snip-
pets are identified with assistance from Reviewer.
Coder cooperates with CPO and CEO to summa-
rize the document and codes about the whole code
review in the final phase.
2.3

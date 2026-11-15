---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-005-self-improving-cot-with-qa-checker
section_title: "Self-Improving CoT with QA Checker"
section_number: null
pages: 4-5
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
1
instructor
assistor
question (instruction)
answer
2
N
q0
a0
QA
checker
q1
CB(q0+ aai0)
a1
QA
checker
q2
CB(q1+ aai1)
...
an
QA
checker
influence
shared
memory
 q
a
CB
aai
Combination
function
added adjusted
instruction
Figure 3: This diagram shows the architecture of our
designed Chain-of-Thought (CoT): Question-Answer
Checker (QA-Checker).
QA-Checker is an instruct-driven agent, de-
signed to fine-tune the question inside a conver-
sation to drive the generated answer related to
the question.
As shown in Figure 3, the initial
question (task instruction) is represented as q0,
and the first answer of the conversation between
Reviewer and Coder is represented as a0. If QA-
Checker identifies that a0 is inappropriate for q0,
it generates additional instructions attached to the
original question (task instruction) and combines
them to ask agents to further generate a different
answer. The combination in Figure 3 is defined
as q1 = CB(q0 + aai0), where aai0 is the addi-
tional instruction attached. The conversation be-
tween two agents is held until the generated an-
swer is judged as appropriate by QA-Checker or it
reaches the maximum number of dialogue turns.
Theoretical Analysis of QA-Checker in Di-
alogue Refinement
The QA-Checker is an
instruction-driven agent, crucial in refining ques-
tions and answers within a conversation to ensure
relevance and precision. Its operation can be un-
derstood through the following lemma and proof
in Appendix A.
3

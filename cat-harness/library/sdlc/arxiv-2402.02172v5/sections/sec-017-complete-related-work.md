---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-017-complete-related-work
section_title: "Complete Related Work"
section_number: null
pages: 13-15
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
15
C Experimental Details
15
C.1
Role Definition . . . . . . . . . .
15
C.2
Execute Time Across Languages .
16
D Comparative Analysis of QA-Checker
AI
System
and
Recursive
Self-
Improvement Systems
17
D.1
Comparison Table . . . . . . . . .
17
D.2
Differences and Implications . . .
17
D.3
Importance of QA-Checker in
Role Conversations . . . . . . . .
17
D.4
Conclusion
. . . . . . . . . . . .
17
E
Capabilities
Analysis
between
CodeAgent and Other Methods
17
F
Dataset
17
G Key Factors Leading to Vulnerabilities
19
H Data Leakage Statement
19
I
Algorithmic Description of CodeAgent
Pipeline with QA-Checker
19
J
Detailed Performance of CodeAgent in
Various Languages on VA task
21
K More detailed experimental results on
CA and FA tasks
21
L
Case Study
21
L.1
Performance on 9 languages
. . .
21
L.2
Difference of CodeAgent-3.5
and CodeAgent-4.0 . . . . . . .
21
M Ablation study
21
N Cost statement
24
O Tool
35
A
Details of QA-Checker Algorithm
Lemma A.1. Let Q(Qi, Ai) denote the quality
assessment function of the QA-Checker for the
question-answer pair (Qi, Ai) in a conversation
at the i-th iteration.
Assume Q is twice differ-
entiable and its Hessian matrix H(Q) is positive
definite. If the QA-Checker modifies the question
Qi to Qi+1 by attaching an additional instruc-
tion aaii, and this leads to a refined answer Ai+1,
then the sequence {(Qi, Ai)} converges to an opti-
mal question-answer pair (Q∗, A∗), under specific
regularity conditions.
Proof. The QA-Checker refines the question and
answers using the rule:
Qi+1 = Qi + aaii,
Ai+1 = Ai −αH(Q(Qi, Ai))−1∇Q(Qi, Ai),
where α is the learning rate.
To analyze con-
vergence, we consider the Taylor expansion of Q
around (Qi, Ai):
Q(Qi+1, Ai+1) ≈Q(Qi, Ai) + ∇Q(Qi, Ai)
· (Qi+1 −Qi, Ai+1 −Ai)
+ 1
2(Qi+1 −Qi, Ai+1 −Ai)T
H(Q(Qi, Ai))(Qi+1 −Qi, Ai+1 −Ai).
Substituting the update rule and rearranging, we
get:
Q(Qi+1, Ai+1) ≈Q(Qi, Ai)
−α∇Q(Qi, Ai)T H(Q(Qi, Ai))−1
∇Q(Qi, Ai)
+ α2
2 ∇Q(Qi, Ai)T H(Q(Qi, Ai))−1
∇Q(Qi, Ai).
For sufficiently small α, this model suggests an
increase in Q, implying convergence to an optimal
question-answer pair (Q∗, A∗) as i →∞. The
convergence relies on the positive definiteness of
H(Q) and the appropriate choice of α, ensuring
each iteration moves towards an improved quality
of the question-answer pair.
In practical terms, this lemma and its proof un-
derpin the QA-Checker’s ability to refine answers
iteratively.
The QA-Checker assesses the qual-
ity of each answer concerning the posed question,
employing advanced optimization techniques that
are modeled by the modified Newton-Raphson
method to enhance answer quality. This frame-
work ensures that, with each iteration, the system
moves closer to the optimal answer, leveraging
both first and second-order derivatives for efficient
and effective learning.
Further Discussion
The QA-Checker computes
Q(Qi, Ai) at each iteration i and compares it to a
predefined quality threshold τ. If Q(Qi, Ai) <
τ, the QA-Checker generates an additional in-
struction aaii to refine the question to Qi+1 =
Qi+aaii, prompting the agents to generate an im-
proved answer Ai+1.
First, we assume that the quality assessment
function Q(Qi, Ai) is twice differentiable with re-
spect to the question Qi. This assumption is rea-
sonable given the smooth nature of the component
functions (relevance, specificity, and coherence)
and the use of continuous word embeddings. Next,
we apply the second-order Taylor approximation
to Q(Qi+1, Ai+1) around the point (Qi, Ai):
Q(Qi+1, Ai+1) ≈Q(Qi, Ai) + ∇Q(Qi, Ai)T ∆Qi
+ 1
2∆QT
i H(Q(Qi, Ai))∆Qi + R2(∆Qi)
where ∆Qi = Qi+1 −Qi, H(Q(Qi, Ai)) is
the Hessian matrix of Q evaluated at (Qi, Ai), and
R2(∆Qi) is the remainder term.
Assuming that the remainder term R2(∆Qi)
is negligible and that the Hessian matrix is posi-
tive definite, we can approximate the optimal step
∆Q∗
i as:
∆Q∗
i ≈−H(Q(Qi, Ai))−1∇Q(Qi, Ai).
Substituting this approximation into the Taylor
expansion and using the fact that Qi+1 = Qi +
α∆Q∗
i (where α is the learning rate), we obtain:
Q(Qi+1, Ai+1) ≈Q(Qi, Ai) −α∇Q(Qi, Ai)T
· H(Q(Qi, Ai))−1∇Q(Qi, Ai)
+ α2
2 ∇Q(Qi, Ai)T H(Q(Qi, Ai))−1
· ∇Q(Qi, Ai).
The assumptions of twice differentiability, neg-
ligible remainder term, and positive definite Hes-
sian matrix provide a more solid foundation for
the approximation in Lemma 3.1.
For suffi-
ciently small α, this approximation suggests an in-
crease in Q, implying convergence to an optimal
question-answer pair (Q∗, A∗) as i →∞. The
convergence relies on the positive definiteness of
H(Q) and the appropriate choice of α, ensuring
each iteration moves towards an improved quality
of the question-answer pair.
The quality assessment function Q used by the
QA-Checker is defined as:
Q(Qi, Ai) = α · Relevance(Qi, Ai)
+ β · Specificity(Ai)
+ γ · Coherence(Ai)
where:
• Qi and Ai represent the question and answer
at the i-th iteration of the conversation.
• Relevance(Qi, Ai) measures how well the
answer Ai addresses the key points and intent
of the question Qi, computed as:
Relevance(Qi, Ai) =⃗Qi ·⃗Ai
|⃗Qi||⃗Ai|
where⃗Qi and⃗Ai are vector representations
of Qi and Ai.
• Specificity(Ai) assesses how specific and de-
tailed the answer Ai is, calculated as:
Ai =
P
t∈ContentWords(Ai) TechnicalityScore(t)
Length(Ai)
where
ContentWords(Ai)
is
the
set
of
substantive
content
words
in
Ai,
TechnicalityScore(t)
is
a
measure
of
how technical or domain-specific the term
t is, and Length(Ai) is the total number of
words in Ai.
• Coherence(Ai) evaluates the logical flow and
structural coherence of the answer Ai, com-
puted as:
Coherence(Ai) =α · DiscourseConnectives(Ai)
+ β · CoreferenceConsistency(Ai)
+ γ · AnswerPatternAdherence(Ai)
where
DiscourseConnectives(Ai)
is
the
density of discourse connectives in Ai,
CoreferenceConsistency(Ai) measures the
consistency of coreference chains in Ai,
and AnswerPatternAdherence(Ai) assesses
how well Ai follows the expected structural
patterns for the given question type.
α, β, and γ are non-negative weights that sum
to 1, with α = β = γ.
B
Complete Related Work
Automating Code Review Activities Our focus
included detecting source code vulnerabilities, en-
suring style alignment, and maintaining commit
message and code consistency. Other studies ex-
plore various aspects of code review.
Hellen-
doorn et al. (Hellendoorn et al., 2021) addressed
the challenge of anticipating code change posi-
tions. Siow et al. (Siow et al., 2020) introduced
CORE, employing multi-level embeddings for
code modification semantics and retrieval-based
review suggestions. Hong et al. (Hong et al., 2022)
proposed COMMENTFINDER, a retrieval-based
method for suggesting comments during code re-
views.
Tufano et al. (Tufano et al., 2021) de-
signed T5CR with SentencePiece, enabling work
with raw source code without abstraction. Li et
al. (Li et al., 2022) developed CodeReviewer, fo-
cusing on code diff quality, review comment gen-
eration, and code refinement using the T5 model.
Recently, large language models have been in-
corporated; Lu et al. (Lu et al., 2023) fine-tuned
LLama with prefix tuning for LLaMA-Reviewer,
using parameter-efficient fine-tuning and instruc-
tion tuning in a code-centric domain.
Collaborative AI Collaborative AI refers to artifi-
cial intelligent systems designed to achieve shared
goals with humans or other AI systems. Previ-
ous research extensively explores the use of mul-
tiple LLMs in collaborative settings, as demon-
strated by Talebirad et al. (Talebirad and Nadiri,
2023) and Qian et al. (Qian et al., 2023). These
approaches rely on the idea that inter-agent in-
teractions enable LLMs to collectively enhance
their capabilities, leading to improved overall
performance.
The research covers various as-
pects of multi-agent scenarios, including collec-
tive thinking, conversation dataset curation, soci-
ological phenomenon exploration, and collabora-
tion for efficiency.
Collective thinking aims to
boost problem-solving abilities by orchestrating
discussions among multiple agents. Researchers
like Wei et al. (Wei et al., 2023) and Li et al. (Li
et al., 2023a) have created conversational datasets
through role-playing methodologies.
Sociologi-
cal phenomenon investigations, such as Park et
al. (Park et al., 2023)’s work, involve creating vir-
tual communities with rudimentary language in-
teractions and limited cooperative endeavors. In
contrast, Akata et al. (Akata et al., 2023) scruti-
nized LLM cooperation through orchestrated re-
peated games. Collaboration for efficiency, pro-
posed by Cai et al. (Cai et al., 2023), introduces
a model for cost reduction through large mod-
els as tool-makers and small models as tool-users.
Zhang et al. (Zhang et al., 2023) established a
framework for verbal communication and collab-
oration, enhancing overall efficiency. However, Li
et al. (Li et al., 2023a) and Qian et al. (Qian et al.,
2023), presenting a multi-agent framework for
software development, primarily relied on natural
language conversations, not standardized software
engineering documentation, and lacked advanced
human process management expertise. Challenges
in multi-agent cooperation include maintaining
coherence, avoiding unproductive loops, and fos-
tering beneficial interactions. Our approach em-
phasizes integrating advanced human processes,
like code review in software maintenance, within
multi-agent systems.
C

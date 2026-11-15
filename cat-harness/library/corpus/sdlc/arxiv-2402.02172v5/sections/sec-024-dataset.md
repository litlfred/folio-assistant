---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-024-dataset
section_title: "Dataset"
section_number: null
pages: 17-19
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
Previous
Dataset
As
shown
in
Zhou
et
al.
(2023),
our
study
incorporates
three
distinct
datasets
for
evaluating
the
perfor-
mance
of
CodeAgent:
Trans-Reviewdata,
AutoTransformdata,
and
T5-Reviewdata.
Trans-Reviewdata,
compiled
by
Tufano
et
al. (Tufano et al., 2021), derives from Gerrit
and GitHub projects, excluding noisy or overly
lengthy comments and review data with new
tokens in revised code not present in the initial
submission.
AutoTransformdata, collected by
Table 6: Comparative Overview of QA-Checker AI System and Recursive Self-Improvement Systems
Feature/System
QA-Checker AI System
Recursive Self-Improvement System
Application Focus
Specialized for QA tasks with
precise task execution
Broad scope, covering various dimensions like
software development and learning algorithms
Learning Mechanism
Advanced optimization techniques
for iterative improvement in QA
Multi-level learning: learning, meta-learning,
and recursive self-improvement
Scope of Improvement
Focused on individual capability
in specific QA tasks
Enhances the entire system, including multi-agent
interactions and communication protocols
Experience Integration
Based on mathematical models
to optimize answer quality
Utilizes experiences from past projects to improve
overall performance
Table 7: Comparison of capabilities for CodeAgent and other approaches. ‘✓’ indicates the presence of a specific
feature in the corresponding framework, ‘✗is absence. ChatDev and MetaGPT are two representative multi-agent
frameworks, GPT is a kind of single-agent framework, and CodeBert is a representative pre-trained model.
Approaches
Consistency Analysis Vulnerability Analysis Format Analysis Code Revision COT QA-Checker
ChatDev (Qian et al., 2023)
✗
✗
✗
✗
✓
✗
MetaGPT (Hong et al., 2023)
✗
✗
✗
✗
✓
✗
GPT (OPENAI, 2022)
✓
✓
✓
✓
✗
✗
CodeBert (Feng et al., 2020)
✓
✓
✓
✓
✗
✗
CodeAgent
✓
✓
✓
✓
✓
✓
Thongtanunam et al. (Thongtanunam et al., 2022)
from three Gerrit repositories, comprises only
submitted and revised codes without review com-
ments. Lastly, T5-Reviewdata, gathered by Tufano
et al. (Tufano et al., 2022) from Java projects
on GitHub, filters out noisy, non-English, and
duplicate comments. These datasets are employed
for Code Revision Before Review (CRB) and
Code Revision After Review (CRA) tasks, with
the exception of AutoTransformdata for CRA and
Review Comment Generation (RCG) due to its
lack of review comments.
New Dataset Design and Collection
To en-
hance our model evaluation and avoid data leak-
age, we curated a new dataset, exclusively col-
lecting data from repositories created after April
2023. This approach ensures the evaluation of our
CodeAgent model on contemporary and relevant
data, free from historical biases. The new dataset
is extensive, covering a broad spectrum of soft-
ware projects across nine programming languages.
Dataset Description
Our dataset, illustrated in
Fig. 8, encapsulates a detailed analysis of consis-
tency and format detection in software develop-
ment, spanning various programming languages.
It includes CA (consistency between commit and
commit message (See Sec 2.1)) and FA (format
consistency between commit and original (See
Sec 2.1)) data, segmented into positive and neg-
ative samples based on the merged and closed sta-
tus of pull requests. For example, in Python, the
dataset comprises 254 merged and 35 closed neg-
ative CA samples, alongside 803 merged and 213
closed positive CA samples, with corresponding
distributions for other languages like Java, Go,
C++, and more. Similarly, the FA data follows
this pattern of positive and negative samples across
languages.
Figure 7 graphically represents this
data, highlighting the distribution and compari-
son of merged versus closed samples in both CA
and FA categories for each language. This com-
prehensive dataset, covering over 3,545 commits
and nearly 2,933 pull requests from more than 180
projects, was meticulously compiled using a cus-
tom crawler designed for GitHub API interactions,
targeting post-April 2023 repositories to ensure
up-to-date and diverse data for an in-depth anal-
ysis of current software development trends.
Table 8: Statistics of Studied Datasets.
Dataset Statistics
#Train
#Valid
#Test
Trans-Review
13,756
1,719
1,719
AutoTransform
118,039
14,750
14,750
T5-Review
134,239
16,780
16,780
Merged
Closed
0
100
200
300
400
500
600
700
800
Sample Count
254
803
35
213
Python
Negative
Positive
Merged
Closed
0
50
100
150
200
250
Sample Count
40
247
8
89
Java
Negative
Positive
Merged
Closed
0
20
40
60
80
100
Sample Count
19
114
18
56
Go
Negative
Positive
Merged
Closed
0
20
40
60
80
100
Sample Count
36
102
10
46
C++
Negative
Positive
Merged
Closed
0
50
100
150
200
Sample Count
45
235
11
101
JavaScript
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
Sample Count
14
100
20
126
C
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
140
160
Sample Count
37
169
10
52
C#
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
140
Sample Count
24
149
13
92
PHP
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
140
160
Sample Count
32
170
10
45
Ruby
Negative
Positive
(a) Positive and negative data of both merged and closed com-
mits across 9 languages on CA task (Sec 2.1).
Merged
Closed
0
200
400
600
800
Sample Count
190
867
35
213
Python
Negative
Positive
Merged
Closed
0
50
100
150
200
250
Sample Count
11
276
5
92
Java
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
Sample Count
16
117
7
67
Go
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
Sample Count
19
119
5
51
C++
Negative
Positive
Merged
Closed
0
50
100
150
200
250
Sample Count
28
252
7
105
JavaScript
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
Sample Count
18
96
18
128
C
Negative
Positive
Merged
Closed
0
25
50
75
100
125
150
175
Sample Count
29
177
5
57
C#
Negative
Positive
Merged
Closed
0
20
40
60
80
100
120
140
160
Sample Count
17
156
6
99
PHP
Negative
Positive
Merged
Closed
0
25
50
75
100
125
150
175
Sample Count
24
178
6
49
Ruby
Negative
Positive
(b) Positive and negative data of both merged and closed com-
mits across 9 languages on FA task (Sec 2.1).
Figure 7: Distribution of positive, negative of both merged and closed data across 9 languages, including ‘python’,
‘java’, ‘go’, ‘c++’, ‘javascript’, ‘c’, ‘c#’, ‘php’, ‘ruby’.
Python
Java
Go
C++
JavaScript
C
C#
PHP
Ruby
0
200
400
600
800
1000
Number
1057
287
133
138
280
114
206
173
202
248
97
74
56
112
146
62
105
55
Merged and Closed Issues in Different Programming Languages with Values
Merged
Closed
Figure 8: Comparative Visualization of Merged and
Closed Commit Counts Across Various Programming
Languages
G

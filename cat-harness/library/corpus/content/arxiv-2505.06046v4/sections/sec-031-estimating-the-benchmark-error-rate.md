---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-031-estimating-the-benchmark-error-rate
section_title: "Estimating the benchmark error rate"
section_number: null
pages: 18-20
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Assessing MCQA sample validity is a challenging annotation task. For a question to be valid,
judging the level of context (e.g subpopulation, geography, time period etc.) that is required for the
question to be answerable can involve a significant degree of subjectivity. For the options to be valid,
the boundary between when a challenging distractor option crosses over into being a potentially
equally valid answer to the specified correct answer, rendering the question ambiguous, is also
subjective. Therefore, we followed a two round annotation process.
In the first round, pairs of human experts were assigned a total of 150 MCQA samples for double
review. Any discrepancies in annotations between reviewers were then assessed by all reviewers
and the correct final annotation agreed. This enabled us to identify and rectify inconsistencies in
the application of the annotation protocol. In the second round, the remaining 650 MCQA samples
were then annotated by single reviewers who participated in the first round.
We provide the Wilson score 95% confidence interval for a binomial proportion. The full instructions
provided to reviewers are shown in the box below:
18
Preprint.
Protocol for Manual Review of Exam Questions
This protocol provides structured criteria for assessing the validity of guidance LLM benchmark
questions and answer options into three categories: Good, Acceptable, and Incorrect.
1. Good Questions
Criteria:
1. Question Valid: The question is answerable and clearly aligned with the guidance docu-
ment.
2. Best Answer Clearly Identifiable: The correct answer is evidently the ‘best’ choice com-
pared to the other options and is similar to a hypothetical ‘gold standard’ answer.
3. Other Options Incorrect but Not Trivially Wrong: At least some of the other incorrect
options are plausible, not wrong by definition, or so obviously wrong that an uninformed
member of the public could say that is not something guidance would ever say.
4. Informative Value: The LLM’s performance on this question adds meaningful informa-
tion about the LLM’s knowledge of the guidance.
2. Acceptable Questions
Definition: Questions in this category are valid but have limitations that reduce their overall quality
or informativeness. These questions are still useful but might not be as robust as ”Good” questions.
Criteria:
1. Question Valid but Some Ambiguity: The question can be understood and is answerable,
but it may be missing some context, contain uncommon acronyms, or may assume a high
degree of knowledge.
2. Gaps in Correct Answer but Still the Best Option: The correct answer is the best choice
from the options provided, but may not be the perfect gold standard answer, may lack some
detail or nuance from the guidance, and may be poorly phrased.
3. Other Options Incorrect but Potentially Trivially Wrong: All incorrect options are
worse options than the correct answer but they may be incorrect trivially, making the
correct answer easy to guess.
4. Some Relevance but Lower Informative Value: The LLM’s performance on this ques-
tion has some relevance (even if minor) but may test less critical aspects of the guidance, or
the question may cover overlapping points with others in the dataset. Very easy questions
would also be acceptable.
5. Not Directly Aligned with the Chunk Provided: In some cases, the question may relate
to text found either side of the intended chunk of guidance in the document. This is
acceptable so long as the question still meets the criteria above.
3. Invalid Questions
Definition: Questions in this category cannot be answered due to material errors and are unsuitable
for use in the evaluation.
Criteria:
1. Invalidity: The question is not answerable due to ambiguity, misinterpretation of guid-
ance, or grammatical errors.
2. Misleading Answer Options: The correct answer option provided is either:
(a) Not a valid answer to the question, or
(b) Clearly a less accurate answer than one or more of the distractor options.
3. Errors in Construction: The question has structural or logical flaws that render it unus-
able.
19
Preprint.
A.4.2

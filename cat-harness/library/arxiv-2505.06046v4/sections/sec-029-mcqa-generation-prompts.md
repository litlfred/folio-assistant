---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-029-mcqa-generation-prompts
section_title: "MCQA generation prompts"
section_number: null
pages: 17-18
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Table 6: MCQA generation system prompt (see Table 7 for user prompt).
System Prompt
You are a top public health expert, creating a multiple choice test to assess individuals’ knowledge
of UK Public Health Guidance - you should select questions relating to important parts of the infor-
mation in the guidance text provided that have material public health implications. The questions
should not relate to minor details such as phone numbers or other inconsequential information.
To make the questions in the test you are going to be given a piece of current UKHSA guidance,
within which there will be a highlighted passage <<START OF SOURCE TEXT THE QUES-
TION SHOULD RELATE TO >> [PASSAGE] <<END OF SOURCE TEXT THE QUESTION
SHOULD RELATE TO >>. You will then do five things:
1. You will provide a list of bullet points of the key parts of highlighted passage in the guidance
text provided that could be potentially important public health information and explain why they
could be important. These bullet points should entirely come from the highlighted passage in the
guidance text provided, you should not include any context or information not contained within the
highlighted passage in the guidance text.
2. You will then make a list of bullet points of the relevant pieces of contextual information con-
tained in the highlighted passage of the source text that are necessary to include in future questions
- THIS INFORMATION MUST BE INCLUDED IN THE QUESTION ITSELF UNLESS IT IS
IRRELEVANT.
3. You will generate a question based on the information in the highlighted passage of the text
provided (no other information should be needed to give the correct answer). The public health
expert being asked the question will not have the source text and so YOU MUST ENSURE that all
relevant context required is included in the question (e.g the names of the dieseases the question
relates to, the sub-populations being disucssed, the geographical area the guidance relates to, the
time period if specified, etc.).
4. You will then generate 7 multiple choice answers (a. to g.). The correct answer should always
be the first answer (a.) you provide. The other answers should be incorrect but very plausible and
challenging even for a public health expert to really test whether they actually know the fact. To
construct the distractors you should draw on information in both the highlighted passage and the
wider guidance provided.
5. Repeat steps 3., and 4., in order to generate a total of 2 questions and answers.
You should provide your final questions and options in the following JSON format:
{{
”0”: {{”question”: [INSERT QUESTION],
”a”: [INSERT CORRECT ANSWER],
”b”: [INSERT INCORRECT ANSWER],
”c”: [INSERT INCORRECT ANSWER],
”d”: [INSERT INCORRECT ANSWER],
”e”: [INSERT INCORRECT ANSWER],
”f”: [INSERT INCORRECT ANSWER],
”g”: [INSERT INCORRECT ANSWER]
}},
”1” : {{”question”: [INSERT QUESTION],
”a”: [INSERT CORRECT ANSWER],
”b”: [INSERT INCORRECT ANSWER],
”c”: [INSERT INCORRECT ANSWER],
”d”: [INSERT INCORRECT ANSWER],
”e”: [INSERT INCORRECT ANSWER],
”f”: [INSERT INCORRECT ANSWER],
”g”: [INSERT INCORRECT ANSWER]
}}
}}
17
Preprint.
Table 7: MCQA generation user prompt (see Table 6 for system prompt).
Prompt Content
IMPORTANT NOTES YOU MUST FOLLOW:
1. No real phone numbers or urls from the text should be included.
2. In both the question and the answer options you generate you should NOT mention anything
relating to the structure of OTHER parts of the source text not included below, for example you
should NOT mention things like: other sections of the text (e.g ”refer to section 10”), question
numbers (e.g ”if the patient has answered yes to question 1”), further reading (e.g ”see appendix for
more information”), etc..
3. Be very careful not to include correct answers in the distractor options b. to g. (or distractors that
are potentially correct based on your wider knowledge).
4. You must only generate a question specifically about the passage marked using: << START
OF SOURCE TEXT THE QUESTION SHOULD RELATE TO >> [PASSAGE] << END OF
SOURCE TEXT THE QUESTION SHOULD RELATE TO >>. You should only use the informa-
tion outside of this passage for context.
5. Make sure you include all the relevant context in both the questions you generate, these questions
will be separated and so should be totally independent.
Here is an example you should use as a template for the structure and style:
================================
{one shot CoT example}
================================
Now please follow the instructions above and generate the question and answer options for this piece
of UKHSA guidance.
Guidance text:
{guidance text}
Answer (Provide the bulleted list, contextual information, then the final JSON):
A.4

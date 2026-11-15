---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-003-burden
section_title: "Burden"
section_number: null
pages: 3-5
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
The range of data used in our evaluation is also broad, because potentially relevant health
information is found in a diverse range of sources: academic literature, electronic health
records, public health guidance, social media, news articles, and questionnaire responses
[22]. Details of all the tasks, datasets, and annotations are shown in Table 1.
Figure 2: Evaluation Tasks by Public Health Area. A summary of different tasks which we use to
evaluate the LLMs, grouped by public health area. See 2.1.1, 2.1.2, and 2.1.3 for full descriptions.
3
2.1.1
Burden
Public health aims to mitigate adverse health outcomes in the population, which requires
gathering information on health burden such as reports of symptoms, injuries, cases, mor-
bidity, or mortality [23]. Systematic data collection on burden is critical for developing
evidence-based public health measures [24, 25, 26]. We use the following tasks to evaluate
LLMs in this sub-domain:
1. NCBI Disease Extraction: To evaluate an LLM’s ability to identify and extract diseases
from free text, we use the NCBI disease corpus [27] of PubMed article abstracts annotated
with the diseases mentioned and their associated MeSH (Medical Subject Headings)
and OMIM (genes and genetic disorders) codes. This task involves prompting the LLM
to extract a structured comma separated list of diseases from the free text. In order to
relieve some of the issues observed in the literature around exact matching of output
strings [28, 29, 30], we first map all extracted disease mentions to their respective codes
and assess performance on the de-duplicated set of MeSH and OMIM codes.
2. Gastrointestinal Illness Classification: To evaluate an LLM’s ability to identify potential
illness or disease within non-technical social media free text, we use the Yelp Open
Dataset [31] of restaurant reviews. To annotate the dataset, we first filter to those reviews
that contain at least one of a comprehensive list of GI illness related keywords. We
then take a random sample of approximately 3000 restaurant reviews and manually
annotate (Sec. 7) whether they refer to an instance of possible GI illness using an agreed
epidemiological protocol.
The LLM is prompted to provide a binary classification of GI illness ("yes" or "no") for
each review. This is an adversarial task as all reviews manually annotated as "no" do
contain at least one keyword associated with possible GI illness.
3. Gastrointestinal Illness Symptom Extraction: To evaluate an LLM’s ability to extract
possible symptoms from non-technical social media free text, we use the same annotated
Yelp review dataset as in 2. but filter to only those annotated as referring to possible GI
illness. We then annotate (Sec. 7) these reviews with all symptoms mentioned within
the free text. The LLM is then prompted to extract all symptoms as a structured comma
separated list.
4. ICD-10 Description Classification: In order to evaluate an LLM’s ability to identify
infections and conditions attributed to infections, we use descriptions of abnormal find-
ings, signs of illness and symptoms from the International Statistical Classification of
Diseases and Related Health Problems (ICD) [32] classification system. Using a protocol,
two research analysts with relevant expertise separately annotate ICD-10 Version:2019
descriptions (Sec. 7) with whether they directly refer to an infection or to a disease with a
primarily infectious aetiology. We use a balanced sample of infection and non-infection
disease descriptions. The LLM is then prompted to provide a binary classification of
whether an ICD-10 code description relates to an infection, using the description and a
4
summary of the classification protocol.
5. News Headline Classification: We evaluate an LLM’s ability to identify references to
infectious diseases within non-technical free text using a manually annotated (Sec. 7)
dataset of news headlines with possible references to avian influenza collected from the
GDELT Project [33]. The LLM is prompted with a set of 5 news headlines and asked to
provide a structured JSON output with its classifications. A secondary purpose of this task
is to evaluate the LLM’s ability to generate correctly formatted JSON strings consistently.
6. **Removed** - MMLU Virology: In our initial evaluations we used the MMLU Virol-
ogy [34] subset to assess an LLM’s basic knowledge of virology. However, subsequent
research into the error rate and quality of this subset [35] means we no longer include it.
Task Name
Dataset
Task Type
Test Set Size
Text Type
Text Len
Example Labels
Public
Rows
Labels
(Avg char)
NCBI Disease Extraction
NCBI Disease Cor-
pus
Extraction
475
907
Academic
1276
["non-hereditary
(sporadic)
breast
cancer", "br...
Yes
Gastro-intestinal Illness Classifi-
cation
Yelp Open Dataset
Classification
2456
2456
Social Media
635
"Yes"
No
Gastro-intestinal Illness Symp-
tom Extraction
Yelp Open Dataset
Extraction
400
461
Social Media
464
["nausea"]
No
ICD-10 Description Classifica-
tion
ICD-10
Classification
2226
2226
Academic
36
"Yes"
No
News Headline Classification
GDELT
Classification
353
353
News Articles
70
"Yes"
No
Contact Type Classification
Synthetic Question-
naires
Classification
254
254
Questionnaire
86
"Rule 2"
No
Country Disambiguation
GP
Registration
Forms
Classification
8000
8000
Questionnaire
14
"Brazil"
No
Food Extraction
Yelp Open Dataset
Extraction
400
602
Social Media
464
["fish", "fruit"]
No
MMLU Genetics
MMLU
Classification
93
93
Multiple Choice
-
"C"
Yes
MMLU Nutrition
MMLU
Classification
276
276
Multiple Choice
-
"C"
Yes
Guidance Topic Classification
UKHSA
Classification
265
265
Guidance
456
"4"
No
Guidance Recommendation Clas-
sification
UKHSA
Classification
392
392
Guidance
794
"Yes"
No
Health Advice Classification
HealthAdvice
Classification
8676
8676
Academic
144
"2"
Yes
Health Causal Claims Classifica-
tion
CausalRelation
Classification
2448
2448
Academic
125
"1"
Yes
PubMedQA
PubMedQA
Classification
800
800
Academic
1330
"Yes"
Yes
BioDex Drugs Extraction
BioDex
Extraction
1247
4429
Academic
c.6000
["flucloxacillin",
"midazolam"]
Yes
Table 1: Overview of Public Health Evaluation Tasks. In order to capture a broad range of free
text, the 16 tasks we use draw on 13 distinct datasets from internal and external sources. "Text
length" refers to the average number of characters in the free text (excluding the prompt template and
question). "Public" refers to whether the annotations are available online.
2.1.2

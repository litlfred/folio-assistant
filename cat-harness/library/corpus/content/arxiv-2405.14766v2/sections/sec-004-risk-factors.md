---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-004-risk-factors
section_title: "Risk Factors"
section_number: null
pages: 5-7
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Epidemiological risk factors are environmental, behavioral, or biological factors that increase
a person’s likelihood of developing disease or injury [36]. Risk factor surveillance is essential
for quantifying these risks and developing evidence-based interventions to reduce them [37].
Addressing risk factors directly may provide a more effective strategy than treating diseases
once they arise [38, 39]. We use the following tasks to evaluate LLMs in this sub-domain:
1. Contact Type Classification: A key challenge during outbreak and pandemic response is
5
often rapidly implementing and scaling contact tracing [40]. One important aspect of this
is identifying the type of contact that has occurred in order to assess the risk of onward
transmission. To evaluate an LLM’s ability to identify contact types from representative
free text, we generate and manually annotate (Sec. 7) an entirely new synthetic dataset
created using GPT-4 via the OpenAI API [41], designed to reflect the style, content and
structure of the answers provided within the enhanced surveillance questionnaires for
contacts submitted during the mpox outbreak response [42]. We prompt the LLM to
classify the type of contact based on an epidemiological protocol.
This task is challenging for two reasons. First, it requires the LLM to apply a detailed
protocol provided within the prompt, rather than drawing on existing knowledge pro-
vided during pre-training. Second, this particular dataset was chosen because the text
often contains discussion of sexual activity, which is an important risk factor for certain
infections [43]. However, many LLM pre-training [44] and fine-tuning datasets [45] are
designed to avoid text about sexual activity and so evaluating performance on this type of
free text is essential if using LLMs for certain disease areas in public health.
2. Country Disambiguation: Different pathogens are endemic to different regions of the
world [36]. As such, understanding the risk profile of an individual often requires
understanding their recent travel history or previous countries where they have lived.
Identifying geographies within free text is often an important task to help determine an
individual’s risk of infection or other exposure [46]. To evaluate an LLM’s knowledge
and understanding of geographic locations, we use a manually annotated dataset (Sec. 7)
of anonymised free text responses from GP registration form place of birth fields where
the location cannot be identified using existing automated matching. The main reasons
matches fail is people supply place names within countries (without reporting the country)
and typographical errors. The LLM is prompted to either disambiguate the country the
free text refers to or identify it as unknown. The LLM response is then post-processed to
a standardised list of countries using the country-converter Python package [47].
3. Food Extraction: To evaluate an LLM’s ability to generate structured data on risk factors
from social media free text, we use the same filtered annotated Yelp review dataset as
in Gastrointestinal Illness Symptom Extraction (3.). We then manually annotate these
reviews with all the foods mentioned within the free text. The LLM is prompted to extract
all references to food or meals as a structured comma separated list. Foods are very
challenging to disambiguate, so we use a large lookup table of foods based on the FoodEx
2 database [48] to disambiguate the foods the LLM extracts into a list of 27 potential
labels that are relevant to public health foodborne illness investigation.
4. MMLU Genetics: To evaluate an LLM’s basic knowledge of genetics, we use the Medical
Genetics subset of the MMLU benchmark [34] (Sec. 6.2.3). The LLM is prompted to
provide the answer to multiple choice questions on a range of topics within medical
genetics.
6
5. MMLU Nutrition: Similarly, to evaluate an LLM’s basic knowledge of nutrition, we use
the Nutrition subset of the MMLU benchmark [34] (Sec. 6.2.3). The LLM is prompted to
provide the answer to multiple choice questions on a range of topics within nutrition.
2.1.3

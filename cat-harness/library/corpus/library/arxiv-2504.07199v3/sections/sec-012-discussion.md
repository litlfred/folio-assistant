---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-012-discussion
section_title: "Discussion"
section_number: null
pages: 10-10
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
To
establish
a
reference
point
for
the
LLMs4Subjects
shared
task,
we
developed
a baseline system using OpenAI’s GPT-4o
via the Assistant API.14 Two assistants were
configured—one for all-subjects and another for
13The silp_nlp team output was not evaluated qualitatively
as it was submitted after the deadline.
14https://platform.openai.com/docs/
api-reference/assistants
tib-core—each equipped with the respective GND
subject taxonomies stored in OpenAI’s vector
stores. For each TIBKAT record, the assistants
embedded the title and abstract and queried the
vector store to retrieve 50 GND subjects.
Both assistants followed an identical prompt that
defined their role as a subject matter expert in a
technical library using the GND taxonomy. The
prompt instructed them to select exactly 50 valid,
semantically relevant subject tags based on the in-
put title and abstract, and return them in a strict
JSON format. It also enforced constraints such as
avoiding duplicates and non-matching entries, and
supported bilingual input in German and English.
Despite using a GPT LLM and a well-structured
prompt, the Assistant API presented reliability is-
sues: for some records, the output JSON was incon-
sistent with the schema, or contained improperly
formatted GND codes, requiring repeated runs to
obtain usable results. The Assistant API is still
in beta, and its stability at scale remains uncertain.
This baseline ranked below participant submissions
as shown on the leaderboard. These findings high-
light that while a general-purpose LLM with vector
retrieval and prompt engineering—accessed via
the Assistant API interface—offers quick prototyp-
ing, effective subject tagging requires more spe-
cialized and robust approaches, as shown by the
top-performing teams.
9

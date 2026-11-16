---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-008-ai-assisted-schema-matching-and-mapping
section_title: "AI-assisted Schema Matching and Mapping"
section_number: null
pages: 3-4
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
Schema mapping is performed using human-defined map-
ping rules or scripts, traditional automated approaches [23],
[25] and recently also using LLMs [26]. We propose and im-
plement a new approach, which transforms a JSON document
to satisfy a given target schema by first generating schema
mapping rules with the help of a LLM and then executing
these deterministically. Aside from JSON, MetaConfigurator
supports the data formats YAML and XML and has a function
to import CSV documents (by conversion to JSON). Therefore,
data from any of these formats are supported and can be
transformed using the approach.
"Create a schema about MOF synthesis in chemistry. We
have a list of synthesis experiments. Each experiment
has a metal salt and a ligand and also creator, date,
temperature, duration, product_purity (boolean). Ligand
and metal salt should be objects which each have name,
mass, inchi as properties."
⇓
Fig. 1: Example of natural language schema creation: The user
provides a prompt (top), which is translated into a structured
visual schema (bottom).
"The metal salt and ligand both have the same structure,
both are compounds. Instead of having two different
definitions, create one compound class with their
properties and then make metal_salt and ligand both refer
to this compound class."
⇓
Fig. 2: Example of schema modification through natural lan-
guage: The user requests schema changes using a prompt (top),
which results in the updated schema (bottom).
As schema mapping language, we use JSONata. It is very
expressive and supports complex features, such as numeric,
path, boolean and comparison operators, sorting, grouping, ag-
gregation, functions and expressions, functional programming
and higher order functions.
To perform the schema matching and mapping (data model
transformation), the user provides an input JSON document
and a target JSON schema. First, a source schema is in-
ferred for the provided JSON document instance, using the
jsonhero/schema-infer7 library. Next, the prompt for the LLM
is constructed. It consists of mapping instructions (giving
the LLM a personality, describing the overall tasks and de-
tailed mapping rules), a mapping example (example input and
expected output files) and the user input. To improve the
quality of the generated JSONata expressions, a detailed set
of instructions and JSONata specifications8 is included.
7https://github.com/triggerdotdev/schema-infer, acc. 25/06/05.
8Our set of JSONata instructions: https://doi.org/10.18419/DARUS-5157
Because the user input JSON document might be large,
we perform a recursive array and properties truncation to
shorten the document while maintaining its overall structure.
The algorithm iteratively trims all arrays and object prop-
erties to a maximum length n and 8 ∗n respectively, until
either the target document size of 64KB or the minimum
nmin = 2 is reached. The value n starts at 64 and ev-
ery iteration it is divided by 2. Properties of objects are
trimmed more conservatively than array items, to a length
of 8 ∗n, as they are usually all relevant and different
(except for schemas with additionalProperties or
patternProperties), contrary to arrays items, which
tend to follow the same schema. Possible information loss is
constrained by including the JSON schema inferred from the
complete JSON document in the prompt. Because of including
the whole document schema in the prompt, there is an upper
boundary of document complexity which is supported.
After the prompt is constructed, sent to the LLM and a
response is received, a post-processing algorithm is executed
on the response. The response might be surrounded by a code
fence, often with a language hint (jsonata). If applicable,
it is removed. Finally, the resulting suggested schema map-
ping is presented to the user in an interactive code editor.
It is automatically validated for syntactical correctness (not
semantics) using the JSONata library9 and validation errors
are shown to the user. The user can make any changes of their
choice and can only apply the mapping once it is recognized as
valid. Figure 3 shows an example schema mapping input, the
generated JSONata expression and the transformation result.

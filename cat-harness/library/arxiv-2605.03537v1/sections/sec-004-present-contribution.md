---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-004-present-contribution
section_title: "Present Contribution"
section_number: null
pages: 2-3
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
The existing literature reveals a consistent pattern: AI systems
can identify relevant topics in a document, but they struggle to
translate those topics into properly constructed LCSH strings
that comply with the Subject Headings Manual. The accu-
racy failures documented by Chow et al. (2024), Brzustowicz
(2023), and Tang & Jiang (2025) are not primarily failures of
topic identification—they are failures of rule application. The
models produce unauthorized heading forms, omit required sub-
divisions, use deprecated subfield practices, and fail to verify
headings against authority files.
A key observation is that every prior LLM-based study treats
subject assignment as a single-step task. Brzustowicz (2023)
and Chow et al. (2024) both use direct instruction prompts that
ask the model to go from a title and abstract to finished MARC
fields in one pass, with no intermediate reasoning stages. None
of the existing studies employ chain-of-thought (CoT) prompt-
ing or any form of structured multi-step reasoning, despite
the well-documented effectiveness of CoT techniques for im-
proving LLM performance on complex, multi-step tasks. Yet
subject indexing is precisely such a task: Holley & Joudrey
(2021) describe aboutness determination and conceptual anal-
ysis as cognitive processes that precede heading selection in
professional practice. A subject cataloger does not jump from
reading a title page to producing MARC fields; they move
through distinct stages—identifying what a work is about, de-
ciding which topics warrant headings, verifying those headings
against authority files, and constructing properly subdivided
strings. Collapsing this multi-stage cognitive process into a
single computational step explains why current systems fail at
rule application even when they succeed at topic identification.
This paper addresses that structural mismatch by decompos-
ing the subject indexing workflow into discrete agent skills—
modular, reusable instruction sets that guide an LLM through
one well-defined stage of the process, passing structured out-
put to the next stage. The pipeline can be understood as an
externalized, architecturally enforced form of chain-of-thought
reasoning: rather than relying on the model to internally reason
2
through each stage, the system produces explicit intermediate
outputs—a concept list, a filtered set of candidate headings,
validated authority forms—that are inspectable and correctable
at each step before proceeding to the next. This design provides
the transparency and auditability that a single-prompt approach
cannot.
Unlike the XMTC approaches of Asula et al. (2021) and
Suominen et al. (2025), the system does not require training
data or corpus-level pattern learning. Unlike the single-prompt
LLM approaches of Brzustowicz (2023) and Chow et al. (2024),
it explicitly encodes SHM rules at each stage rather than rely-
ing on the model’s internalized knowledge of LCSH conven-
tions. And unlike the validation-only approach of Tang & Jiang
(2025), it decomposes the entire subject indexing workflow—
from conceptual analysis through MARC field construction—
into auditable, policy-grounded stages.
The system described here was developed using Claude Code
(Anthropic) and its agent skill framework. Four skills were
authored by translating the normative content of eleven Library
of Congress policy documents and one academic review article
into machine-executable instructions. The skills were then
evaluated on a corpus of ten books spanning the humanities,
social sciences, sciences, and fiction.
2

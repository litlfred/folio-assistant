---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-001-related-work
section_title: "Related Work"
section_number: null
pages: 3-3
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Autoformalization with LLMs Autoformalization is the task of automatically converting informal
theorems and proofs into machine-verifiable formats (Wang et al., 2018; Szegedy, 2020). Early
approaches employed neural machine translation methods to translate texts into the Mizar lan-
guage (Wang et al., 2020). Recent advancements in LLMs have opened up new possibilities for
autoformalization. Researchers have explored using few-shot prompting to enable LLMs to translate
mathematical problems into formal formats, including Isabelle and Lean (Wu et al., 2022; Gadgil
et al., 2022). Other studies have adopted a more structured approach to this task. Notably, the DSP
system (Jiang et al., 2023c) utilizes LLMs to draft informal proofs and map them into formal sketches,
with automated theorem-proving systems employed to fill in the missing details in the proof sketch.
Additionally, a line of research has focused on training LLMs on large-scale datasets containing both
informal and formal mathematical data to evaluate their performance in autoformalization (Azerbayev
et al., 2023a;b; Jiang et al., 2023a; Ying et al., 2024c). Unlike existing efforts that often neglect the
detailed compilation information available in ITPs, our proposed method utilizes process feedback
from the Lean 4 compiler to further improve the autoformalization abilities of LLMs.
Process and Outcome Supervision Recent efforts explore enhancing the reasoning capabilities of
LLMs by using verifiers to select the best answer from multiple candidates. There are two main types
of verifiers: the Outcome-Supervised Verifier (OSV) and the Process-Supervised Verifier (PSV). OSV
is supervised with a signal based on the final answer (Cobbe et al., 2021; Yu et al., 2023a), while PSV
is with detailed feedback which requires evaluating individual reasoning steps (Uesato et al., 2022;
Li et al., 2023; Lightman et al., 2024; Ma et al., 2023). Despite the time-consuming annotation cost,
PSV offers several advantages that make it preferable to OSV. PSV can provide fine-grained feedback
by pinpointing the location of errors, which is valuable for reinforcement learning and automatic
correction (Lightman et al., 2024; Wu et al., 2023). To alleviate the extensive human annotation,
recent efforts (Wang et al., 2023a; 2024) propose a machine annotation framework using Monte Carlo
Tree Search (Coulom, 2006; Silver et al., 2016). This annotation process demands a lot of computing
resources, potentially imposing a limitation on the usage. PDA leverages formal languages that can
naturally provide precise feedback on the reasoning process, enabling automatic process annotation
without substantial human or machine annotation costs.
3

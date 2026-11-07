---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-3
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Autoformalization is the automatic conversion of natural language mathematics into formal lan-
guages (Wang et al., 2018; Szegedy, 2020). It reduces the high cost of formalization and bridges
the gap between automated mathematical reasoning research and the vast body of natural language
mathematical knowledge (Wu et al., 2022; Jiang et al., 2023c).
Recent advancements in large language models (LLMs) showed promising capabilities for various
tasks (Achiam et al., 2023; Anthropic, 2024; Meta, 2024), opening up possibilities for LLM-based
autoformalization. While researchers have explored using few-shot prompting (Wu et al., 2022;
Gadgil et al., 2022) or training LLMs on large-scale datasets containing both informal and formal
data (Azerbayev et al., 2023a;b; Jiang et al., 2023a; Ying et al., 2024c;a), existing efforts are limited
to formal languages with a substantial online corpus, e.g., Lean 3 (de Moura et al., 2015).
Recently, due to the improved performance and advanced compilation features, the community
has pivoted towards Lean 4 (de Moura & Ullrich, 2021), a next-generation theorem prover and
programming language. This transition has created a pressing need for comprehensive datasets
and models tailored specifically to Lean 4 (Ullrich & de Moura, 2022b;a; Nawrocki et al., 2023).
Meanwhile, the rapid evolution of Lean 4 poses significant challenges for autoformalization efforts
due to its complex syntax and extensive lemma corpora. This underscores the need for methods that
focus on the semantic aspects of mathematical theorems, an area previously underexplored due to
difficulties in automated assessment (Lu et al., 2024b). Addressing these semantic elements could
enhance autoformalization techniques to better adapt to Lean 4’s ongoing development.
To address key gaps in autoformalization for Lean 4, we introduce Formalization for Lean 4
(FORML4), an extensive dataset for training and evaluating LLMs’ autoformalization capabilities.
∗Leading co-authors with equal contribution.
†Corresponding Author.
1
arXiv:2406.01940v2  [cs.CL]  14 Oct 2024
Work in progress
Process-Supervised Verifier
Natural Language
[Statement]:
Given two non-negative real numbers, prove that taking the real number
minimum of the two by considering them as both non-negative real numbers is
the same as taking the minimum of the two by only considering them as both
real numbers.
[Proof]: 
1. Given two non-negative real numbers, `x` and `y`:
We can consider them as non-negative real numbers; 
We can also consider them as regular real numbers.
2. Since the value order is preserved when viewing a non-negative real number
as a real number, the order relationship between `x` and `y` remains the same
whether we view them as non-negative real numbers or real numbers.
3. Because this order is preserved, the minimum of `x` and `y` is the same.
Compiled Feedback
'severity': 'error',
'pos': {'line': 613, 'column': 3}, 
'endPos': {'line': 613, 'column': 26}, 
'data': 'type mismatch
Monotone.map_min coe_mono has type
↑(min ?m.78355 ?m.78356) = min ↑?
m.78355 ↑?m.78356 : Prop
but is expected to have type
min (↑x) y = min (↑x) y : Prop'
Lean 4 Compiler
Compiler-Guided
Process Annotation
[Statement & Proof]:
theorem coe_min : 
((min (x : ℝ≥0) y : ℝ) : ℝ) = min (x : ℝ)
b := 
NNReal.coe_mono.map_min
Compile error
Successful
Process-Driven Autoformalization
Informalization
Formal Language
[Imported Theorem Env]:
(...)
lemma coe_mono : Monotone ((↑) : ℝ≥0 →
ℝ) := 
fun _ _ => NNReal.coe_le_coe.2
[Statement]:
theorem coe_min : 
((min (x : ℝ≥0) y : ℝ) : ℝ) = min (x : ℝ)
y :=
[Proof]:
NNReal.coe_mono.map_min
Mathlib4 Library
[Statement]:
theorem coe_min (x y : ℝ≥0) :
((min x y : ℝ≥0) : ℝ) = min (x : ℝ) (y : ℝ) :=
[Proof]:
NNReal.coe_mono.map_min
Verified Formal Language
[Statement]:
theorem coe_min (x y : ℝ≥0) :
((min x y : ℝ≥0) : ℝ) = min (x : ℝ) (y : ℝ) :=
[Proof]:
NNReal.coe_mono.map_min
Figure 1: An overview of PDA trained on FORML4. It is important to note that the goal of PDA is
statement autoformalization, and does not include the translation of proof per se (Jiang et al., 2023a).
The reason for including proof steps throughout our framework is to enable the compiler to better
assess the semantic and logical aspects of autoformalized statements by compiling statements and
proof steps together. As illustrated, while the statement passes the compiler as grammatically correct,
an error is detected in the proof step, indicating an incorrect autoformalization. This process-level
feedback helps PDA refine the autoformalized statement effectively.
FORML4 is derived from Mathlib 4 theorems, automatically informalized, and then rigorously quality-
checked manually. In addition, we propose a Process-Driven Autoformalization (PDA) framework
for iterative performance improvement and automated assessment. As illustrated in Figure 1, PDA
begins with training an autoformalization model on FORML4. The model’s output is then processed
by the Lean 4 Compiler, generating automated feedback. This feedback generates process-level
annotations for the autoformalization output, utilized to train a process-supervised verifier (PSV).
The autoformalization model is then fine-tuned based on the verifier’s feedback. This iterative cycle
enables mutual improvement between autoformalization and verifier models.
The unique strength of FORML4 lies in its inclusion of both statements and their corresponding
proofs in natural and formal languages. This approach enables a comprehensive evaluation of model
autoformalization outputs, contrasting with existing datasets (Jiang et al., 2023a; Ying et al., 2024a),
which focus solely on statements. There are three key reasons for appending proofs to theorem
statements in FORML4, each contributing to improved data quality, evaluation granularity, and
process-driven enhancement. First, including proofs provides valuable context that aids in the
generation of higher-quality statements during the dataset construction phase. This context also
serves as a prompt, potentially enhancing the performance of autoformalization models.
More importantly, formal languages offer syntactic rigidity that allows for automatic assessment by
compilers. These compilers deliver detailed feedback on generated proofs, eliminating ambiguity in
formal language generation (Yang et al., 2023a). By utilizing both statements and proofs, FORML4
facilitates comprehensive feedback from the Lean 4 compiler1, enabling strict assessments of syntax
and semantic integrity in reasoning logic. Lastly, we can leverage the precise feedback naturally
provided by Lean 4 compilers to improve autoformalization. Building on FORML4, our PDA
is distinct from existing informal mathematical reasoning methods that rely heavily on human or
machine annotation (Lightman et al., 2024; Wang et al., 2023a).
Extensive experiments demonstrate that PDA significantly enhances autoformalization in Lean 4,
achieving better results with less training data. When fine-tuned with higher-quality data, PDA
utilizes this information effectively, leading to further improvements. Our key contributions are:
1Details of the Lean 4 compiler are provided in Appendix I.3.
2
Work in progress
• We construct an extensive pioneer dataset FORML4 for evaluating autoformalization in Lean
4, encompassing the complete process from natural language questions to formal proofs.
• We propose a process-driven framework PDA that leverages formal languages to provide
process feedback on reasoning, enhancing the autoformalization capabilities of LLMs.
• We conduct a comprehensive study featuring robust quantitative and qualitative analysis,
along with human evaluation. We fully open-source FORML4 and PDA to facilitate research.
2

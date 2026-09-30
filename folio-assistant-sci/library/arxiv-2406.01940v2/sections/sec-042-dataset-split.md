---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-042-dataset-split
section_title: "Dataset Split"
section_number: null
pages: 30-31
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
The basic test and the real test set are the two added test set data in FORML4 for a more domain-
inclusive evaluation of autoformalization. They are collected from distinctive sources compared to
the random test set or training data and aimed at assessing nuanced domains of autofomalization
capability. Below are detailed descriptions of their features, content, and data creation processes.
Basic Test
It assesses the model’s ability to autoformalize basic theorems with minimal reliance on
prior knowledge or established lemmas. These theorems typically appear in files like Mathlib/
Geometry/Euclidean/Basic.lean, which establish fundamental geometrical concepts and
prove simple results about real inner product spaces and Euclidean affine spaces. Conversely,
theorems with more intricate proofs or richer geometrical content are usually found in separate files,
like Mathlib/Geometry/Euclidean/Triangle.lean, and are excluded from the Basic
Test.
From all the Basic.lean files across various mathematical subjects (like geometry and algebra),
we extract roughly 10,000 theorems. After removing the sampled training and random test sets from
this pool, we randomly select theorems to create the Basic Test. This ensures that the Basic Test
remains entirely exclusive from the training and random test sets.
6https://github.com/leanprover-community/mathport
7We tried tracking and appending the definitions of custom lemmas to the model input as contexts. This did
not significantly improve the models’ informalization outcomes.
30
Work in progress
Real Test
To evaluate our models’ ability to handle real-world scenarios, we constructed a real test
set by collecting natural language math questions and answers from LI et al. (2024). This real test set
assesses how well our models can automatically formalize natural language expressions, providing a
more comprehensive evaluation metric.
Since this set is derived from real math questions, we do not preprocess them using GPT-4 for
informalization. It’s important to note that this real test set lacks any inherent dependencies on
predefined lemmas or basic Lean 4 terms, unlike the environment we typically use for Lean 4
programming. We follow the setting of the Lean 4 version of LeanDojo (Yang et al., 2023a) and
employ its predefined theorem environment as shown in https://github.com/yangky11/
miniF2F-lean4/blob/MiniF2F/Minif2fImport.lean for all real test examples.
O.3

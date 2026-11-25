---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-008-verification-model
section_title: "Verification Model"
section_number: null
pages: 6-7
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
of the Lean 4 compiler (Section 4.2).
4.1
VERIFICATION MODEL
We propose to train the verifier by leveraging the granular, process-level feedback provided by the
Lean 4 compiler. This method diverges from previous approaches (Wu et al., 2022) that rely solely
on binary compilation outcomes. Instead, we employ a more nuanced strategy that assigns labels
to each step in the training data based on the “first error location” principle introduced by Uesato
et al. (2022). Our labeling strategy is as follows: steps preceding the first compiler-detected error are
labeled as “correct”, while subsequent steps are labeled as “incorrect”. This approach allows us to
incorporate rich, step-wise information throughout the compilation process, in contrast to traditional
result-centered methods that use rejected sampling or apply binary outcomes to train reward or verifier
models. The parameters and variables used in our verifier models are summarized in Table 3. To
evaluate the efficacy of our process-supervised training, we compare two models:
1. Outcome-Supervised Verifier (OSV): This model is trained using step-level loss with a uniform
label based on the final compilation outcome. Following Lightman et al. (2024) and Wang et al.
(2023a), we train the OSV model using cross-entropy loss:
[ht]LOSV(q, S, Y, θ) = −1
n
n
X
i=1
1
mi
mi
X
t=1

yi log(rt
i) + (1 −yi) log(1 −rt
i)

,
6
Work in progress
Table 3: Parameters and variables used in verifier models.
Symbol
Description
q
Question
S = {S1, . . . , Sn}
Set of samples
S(1:t)
i
Subsequence of steps up to the tth step of sample Si
Y = {Y1, . . . , Yn}
Label set for the samples
yi ∈{0, 1}
Outcome-level label across all steps based on final compilation outcome
yt
i ∈{0, 1}
Step-level label for the tth solution step within the ith sample Si.
n
Total number of samples
mi
Number of steps in Si
rt
i = fθ(q; S(1:t)
i
)
Predicted probability of correct class at step t
θ
Model parameters
2. Process-Supervised Verifier (PSV): This model is trained using the "first error location" labeling
strategy with step-level loss. The loss function is structurally similar to that of the OSV model, but it
uses step-wise labels yt
i based on the “first error location” strategy:
LPSV(q, S, Y, θ) = −1
n
n
X
i=1
1
mi
mi
X
t=1

yt
i log(rt
i) + (1 −yt
i) log(1 −rt
i)

,
To ensure a fair comparison between PSV and OSV, both models are trained within a standard
language modeling framework. We introduce two special tokens to represent the “correct” and
“incorrect” labels during training. By leveraging the process feedback from the Lean 4 compiler, we
hypothesize that our method is more suitable and efficient for the task of autoformalization, as it
captures the nuanced progression of the proof construction process rather than relying solely on the
outcome. The comparative performance analysis of these models is presented in Table 5.
4.2

---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-029-case-visualization-in-comparision-with-existing
section_title: "Case Visualization in Comparision with existing datasets"
section_number: null
pages: 25-25
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
In addition to the summarized comparison of dataset features in 2, below we also provide a visualiza-
tion comparison through a data example with the same statement in both our FORML4 training set
and existing training sets (Jiang et al., 2023a; Ying et al., 2024a). As shown in Table 8, our FORML4
incorporates both the informal statement and its proof as input for our autoformalization process,
making it a complete autoformalization task. In contrast, the MMA, one of the existing datasets,
requires the model to output only the statement, without the proof.
Our task requires the model to not only understand the basic Lean 4 syntax rules but also comprehend
the logical relationships present in the proof process, such as dependencies illustrated in the example.
When compiling our output examples using the Lean 4 compiler, we require a complete theorem
output. Therefore, the feedback from the Lean 4 compiler is more comprehensive, providing syntax
checking for both statements and proofs, coupled with reasoning checking to validate the proofs.
This comprehensive feedback is crucial for guiding the enhancement of autoformalization within our
framework, as described in Section 5.1. The ’tactic’ feedback indicates that our example successfully
verifies the goal of proving that the cosine of the angle π (pi), when measured in radians, is equal to
-1. In the MMA case, due to the absence of a proof, the Lean 4 compiler can only return a warning
that the theorem is incomplete.
In summary, the feedback from the Lean 4 compiler provides syntax checking and reasoning veri-
fication for both statements and proofs, which is essential for improving autoformalization in our
framework. In contrast, the feedback from the existing dataset is limited to syntax checking of
statements, lacking the depth of reasoning verification.
H

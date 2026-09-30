---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-039-autoformalization-on-real-world-mathematical-rea
section_title: "Autoformalization on Real-World Mathematical Reasonings"
section_number: null
pages: 29-30
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
In this section, We list the results of using the SFT model trained in Appendix M, to perform
autoformalization based on questions and answers in GSM8K and MATH training sets. The results
are presented in the following Table 14.
29
Work in progress
Table 14: Comparison of the SFT model’s autoformalization performance, measured by compilation
rate (%), on the GSM8K and MATH training sets.
Model
MATH
GSM8K
Mistral
0.0 %
0.0 %
Mistral (5K)
0.55 %
3.28 %
Mistral (Full)
0.65 %
8.16 %
The results in Table 14 demonstrate that despite fine-tuning with training sets provided by FORML4,
the model’s performance on autoformalization tasks for GSM8K and MATH was still not satisfactory.
To address this weakness, we employed Mistral (Full) to conduct the autoformalization task on training
sets from GSM8K and MATH. For each example, we generated 10 samples with a temperature of
0.7. The outputs that were successfully compiled by the Lean 4 compiler were then used to further
fine-tune a final baseline model utilized in Section 5.1.2.
O

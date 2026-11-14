---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-025-file-structure
section_title: "File Structure"
section_number: null
pages: 23-24
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
You are given two model output .json files (sample size = 10). In the file, each sample contains five
items:
• "nl": (past informalized output. Ignore)
• "formal": formal statement and proof in Lean 4 (i.e., Theorem)
• "gemini_output" / gpt4o_output: complete model output
• "nl_problem": extracted from model output (i.e., Problem)
• "nl_explanation": extracted from model output (i.e., Explanation)
• "nl_proof": extracted from model output (i.e., Proof)
Among them, your annotations focus on the quality of "nl_problem" and "nl_proof" per sample.
23
Work in progress
E.1.3
TASK
For both model output .json files, you need to annotate three items:
1. Informalization Success (T/F): whether the translation from "formal" to "nl_problem"
and "nl_proof" is semantically equivalent. The natural-language translation should accu-
rately convey the same logical structure and content as the original statement and proof in
Lean 4.
2. Informal Proof Correctness (T/F): whether the informalized proof "nl_proof" success-
fully proves the problem statement "nl_problem", and can be independently understood
without prior knowledge of Lean 4.
3. Model Preference (T/F): Compare the informalization output (i.e., "nl_problem" +
"nl_proof") between gemini and gpt4o, choose which one is preferable based on the
criteria described below. Label T if preferred, F if not.
E.1.4

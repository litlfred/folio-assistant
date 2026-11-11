---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-009-state-of-the-art-tools-and-models
section_title: "State-of-the-Art Tools and Models"
section_number: null
pages: 5-6
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
Our study evaluates various tools and models for
code revision and modeling. Trans-Review (Tu-
fano et al., 2021) employs src2abs for code ab-
straction, effectively reducing vocabulary size.
AutoTransform (Thongtanunam et al., 2022)
uses Byte-Pair Encoding for efficient vocabulary
management in pre-review code revision.
T5-
Review (Tufano et al., 2022) leverages the T5 ar-
chitecture, emphasizing improvement in code re-
view through pre-training on code and text data.
In handling both natural and programming lan-
guages, CodeBERT (Feng et al., 2020) adopts a
bimodal approach, while GraphCodeBERT (Guo
et al., 2021) incorporates code structure into its
modeling.
CodeT5 (Wang et al., 2021), based
on the T5 framework, is optimized for identi-
fier type awareness, aiding in generation-based
Table 2: The number of vulnerabilities found by CodeAgent and other approaches. As described in Appendix-
Section F, we have 3,545 items to evaluate. Ratecr represents the confirmed number divided by the number of
findings while Rateca is the confirmed number divided by the total evaluated number. CodeAgent w/o indicates
the version without QA-Checker.
CodeBERT
GPT-3.5
GPT-4.0
COT
ReAct
CodeAgent
CodeAgent w/o
Find
1,063
864
671
752
693
483
564
Confirm
212
317
345
371
359
449
413
Ratecr
19.94%
36.69%
51.42%
49.34%
51.80%
92.96%
73.23%
Rateca
5.98%
8.94%
9.73%
10.46%
10.13%
12.67%
11.65%
The values in gray ( nn.nn ) denote the greatest values for the confirmed number of vulnerabilities and the
rates.
tasks. Additionally, we compare these tools with
GPT (OPENAI, 2022) by OpenAI, notable for
its human-like text generation capabilities in nat-
ural language processing.
Finally, we involve
COT (Wei et al., 2022) and ReAct (Yao et al.,
2022), of which COT is a method where lan-
guage models are guided to solve complex prob-
lems by generating and following a series of in-
termediate reasoning steps and ReAct synergis-
tically enhances language models by interleav-
ing reasoning and action generation, improving
task performance and interpretability across var-
ious decision-making and language tasks.
4

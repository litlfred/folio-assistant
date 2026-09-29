---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Work in progress
PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4
Jianqiao Lu1∗, Yingjia Wan2∗, Zhengying Liu3, Yinya Huang4, Jing Xiong1,
Chengwu Liu5, Jianhao Shen6, Hui Jin3, Jipeng Zhang8, Haiming Wang7,
Zhicheng Yang9, Jing Tang8,9, Zhijiang Guo3†
1The University of Hong Kong
2University of Cambridge
3Huawei Noah’s Ark Lab
4City University of Hong Kong
5Peking University
6Huawei Hisilicon
7Sun Yat-sen University
8Hong Kong University of Science and Technology
9Hong Kong University of Science and Technology (Guangzhou)
jqlu@cs.hku.hk, {yingjiawan.alisa, cartusguo}@gmail.com
ABSTRACT
Autoformalization, the conversion of natural language mathematics into formal
languages, offers significant potential for advancing mathematical reasoning. How-
ever, existing efforts are limited to formal languages with substantial online corpora
and struggle to keep pace with rapidly evolving languages like Lean 4. To bridge
this gap, we propose a large-scale dataset Formalization for Lean 4 (FORML4) de-
signed to comprehensively evaluate the autoformalization capabilities of large lan-
guage models (LLMs), encompassing both statements and proofs in natural and for-
mal languages. Additionally, we introduce the Process-Driven Autoformalization
(PDA) framework that leverages the precise feedback from Lean 4 compilers to
enhance autoformalization. Extensive experiments demonstrate that PDA improves
autoformalization, enabling higher compiler accuracy and human-evaluation scores
using less filtered training data. Moreover, when fine-tuned with data containing
detailed process information, PDA exhibits enhanced data utilization, resulting in
more substantial improvements in autoformalization for Lean 4.
1

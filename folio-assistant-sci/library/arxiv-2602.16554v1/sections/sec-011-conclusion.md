---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-011-conclusion
section_title: "Conclusion"
section_number: null
pages: 7-9
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
We have presented MerLean, a fully automated bidirectional framework for formalizing mathematical
research papers from LATEX into verified Lean 4 libraries. Our evaluation on three papers in theoretical
quantum computation, covering stabilizer codes, fault-tolerant protocols, balanced product codes,
and homological algebra, produced over 2,000 Lean declarations across 41,000+ lines of verified
code, demonstrating that fully automated formalization of frontier research is feasible. The iterative
compile-fix-verify loop effectively produces faithful formalizations without human intervention,
while the autoinformalization pipeline enables domain experts to review semantic alignment without
formal methods expertise.
Looking ahead, while theoretical quantum computing serves as an effective testbed, its mathematical
substrate, being primarily linear algebra and functional analysis, benefits from mature Mathlib support.
We plan to extend our evaluation to other scientific domains and branches of pure mathematics
characterized by deeper dependency chains or different foundational structures, such as algebraic
geometry and number theory, to fully establish the framework’s generalizability.
We also plan to evaluate MerLean on existing autoformalization benchmarks to enable direct com-
parison with prior work. However, current benchmarks (e.g., miniF2F, ProofNet) focus primarily
on isolated theorem statements rather than full paper formalization with interconnected definitions,
lemmas, and theorems. In the future, we intend to create a dedicated benchmark comprising di-
verse research papers across multiple mathematical domains, enabling systematic evaluation of
autoformalization systems at the level of frontier research.
LLM USAGE DISCLOSURE
In accordance with ICLR 2026 policy, we disclose the following uses of large language models in
this work:
Research.
MerLean uses Claude (Opus 4.5) as its core reasoning engine for both autoformalization
and autoinformalization. The LLM performs statement extraction from LATEX, Lean code generation,
error diagnosis and repair, and natural language translation of formal code. All experimental results
reported in this paper were produced by this LLM-based system. The authors have verified and
validated all research contributions.
Writing.
Claude Code was used as a writing assistant for editing portions of this manuscript,
including fixing typos and improving grammar. All content was reviewed, verified, and revised by
the human authors, who take full responsibility for the accuracy and integrity of the final submission.
REFERENCES
arXiv. arXiv quantum physics submission statistics. https://arxiv.org/year/quant-ph,
2025.
Benjamin Breen, Marco Del Tredici, Jacob McCarran, Javier Aspuru Mijares, Weichen Winston
Yin, Kfir Sulimany, Jacob M. Taylor, Frank H. L. Koppens, and Dirk Englund. Ax-Prover: A
Deep Reasoning Agentic Framework for Theorem Proving in Mathematics and Quantum Physics,
November 2025. URL http://arxiv.org/abs/2510.12787. arXiv:2510.12787 [cs].
7
Nikolas P Breuckmann and Jens Niklas Eberhardt. Balanced product quantum codes. IEEE Transac-
tions on Information Theory, 67(10):6653–6674, 2021.
Albert Q. Jiang, Sean Welleck, Jin Peng Zhou, Wenda Li, Jiacheng Liu, Mateja Jamnik, Timoth´ee
Lacroix, Yuhuai Wu, and Guillaume Lample. Draft, Sketch, and Prove: Guiding Formal Theo-
rem Provers with Informal Proofs, November 2022. URL http://arxiv.org/abs/2210.
12283. arXiv:2210.12283 [cs].
Adarsh Kumarappan, Mo Tiwari, Peiyang Song, Robert Joseph George, Chaowei Xiao, and Anima
Anandkumar. LeanAgent: Lifelong Learning for Formal Theorem Proving, March 2025. URL
http://arxiv.org/abs/2410.06209. arXiv:2410.06209 [cs].
Zenan Li, Yifan Wu, Zhaoyu Li, Xinming Wei, Xian Zhang, Fan Yang, and Xiaoxing Ma. Autofor-
malize Mathematical Statements by Symbolic Equivalence and Semantic Consistency. November
2024. URL https://openreview.net/forum?id=8ihVBYpMV4.
Yong Lin, Shange Tang, Bohan Lyu, Ziran Yang, Jui-Hui Chung, Haoyu Zhao, Lai Jiang, Yihan
Geng, Jiawei Ge, Jingruo Sun, Jiayun Wu, Jiri Gesi, Ximing Lu, David Acuna, Kaiyu Yang,
Hongzhou Lin, Yejin Choi, Danqi Chen, Sanjeev Arora, and Chi Jin. Goedel-prover-v2: Scaling
formal theorem proving with scaffolded data synthesis and self-correction, 2025. URL https:
//arxiv.org/abs/2508.03613.
Junqi Liu, Zihao Zhou, Zekai Zhu, Marco Dos Santos, Weikun He, Jiawei Liu, Ran Wang, Yunzhou
Xie, Junqiao Zhao, Qiufeng Wang, Lihong Zhi, Jia Li, and Wenda Li. Numina-lean-agent:
An open and general agentic reasoning system for formal mathematics, 2026. URL https:
//arxiv.org/abs/2601.14027.
Qi Liu, Xinhao Zheng, Xudong Lu, Qinxiang Cao, and Junchi Yan. RETHINKING AND IMPROV-
ING AUTOFORMALIZATION: TOWARDS A FAITHFUL METRIC AND A DEPENDENCY
RETRIEVAL-BASED APPROACH. 2025.
Alex Meiburg, Leonardo A Lessa, and Rodolfo R Soldati. A formalization of the generalized quantum
stein’s lemma in lean. arXiv preprint arXiv:2510.08672, 2025.
Leonardo de Moura and Sebastian Ullrich. The Lean 4 Theorem Prover and Programming Language.
In Automated Deduction – CADE 28: 28th International Conference on Automated Deduction,
Virtual Event, July 12–15, 2021, Proceedings, pp. 625–635, Berlin, Heidelberg, July 2021. Springer-
Verlag. ISBN 978-3-030-79875-8. doi: 10.1007/978-3-030-79876-5 37. URL https://doi.
org/10.1007/978-3-030-79876-5_37.
Logan Murphy, Kaiyu Yang, Jialiang Sun, Zhaoyu Li, Anima Anandkumar, and Xujie Si. Autofor-
malizing Euclidean Geometry, May 2024. URL http://arxiv.org/abs/2405.17216.
arXiv:2405.17216 [cs].
Lawrence C. Paulson (ed.). Isabelle, volume 828 of Lecture Notes in Computer Science. Springer-
Verlag, Berlin/Heidelberg, 1994. ISBN 978-3-540-58244-1. doi: 10.1007/BFb0030541. URL
http://link.springer.com/10.1007/BFb0030541.
Zhongyuan Peng, Yifan Yao, Kaijing Ma, Shuyue Guo, Yizhe Li, Yichi Zhang, Chenchen Zhang,
Yifan Zhang, Zhouliang Yu, Luming Li, Minghao Liu, Yihang Xia, Jiawei Shen, Yuchen Wu, Yixin
Cao, Zhaoxiang Zhang, Wenhao Huang, Jiaheng Liu, and Ge Zhang. CriticLean: Critic-Guided
Reinforcement Learning for Mathematical Formalization, July 2025. URL http://arxiv.
org/abs/2507.06181. arXiv:2507.06181 [cs].
Christian Szegedy (ed.).
A Promising Path Towards Autoformalization and General Artificial
Intelligence, 2020.
Guillem Tarrach, Albert Q. Jiang, Daniel Raggi, Wenda Li, and Mateja Jamnik. More Details,
Please: Improving Autoformalization with More Detailed Proofs. June 2024. URL https:
//openreview.net/forum?id=AkJvzpYMvK.
The Coq Development Team. The Coq Proof Assistant, June 2024. URL https://zenodo.
org/records/11551307. Language: eng.
8
Joseph Tooby-Smith. Heplean: Digitalising high energy physics, 2024. URL https://arxiv.
org/abs/2405.08863.
Ke Weng, Lun Du, Sirui Li, Wangyue Lu, Haozhe Sun, Hengyu Liu, and Tiancheng Zhang. Aut-
oformalization in the Era of Large Language Models: A Survey, May 2025.
URL http:
//arxiv.org/abs/2505.23486. arXiv:2505.23486 [cs].
Dominic J. Williamson and Theodore J. Yoder. Low-overhead fault-tolerant quantum computation by
gauging logical operators, 2024. URL https://arxiv.org/abs/2410.02213.
Yuhuai Wu, Albert Q. Jiang, Wenda Li, Markus N. Rabe, Charles Staats, Mateja Jamnik, and
Christian Szegedy. Autoformalization with Large Language Models, May 2022. URL http:
//arxiv.org/abs/2205.12615. arXiv:2205.12615 [cs].
Huajian Xin, Daya Guo, Zhihong Shao, Zhizhou Ren, Qihao Zhu, Bo Liu, Chong Ruan, Wenda Li,
and Xiaodan Liang. Deepseek-prover: Advancing theorem proving in llms through large-scale
synthetic data, 2024. URL https://arxiv.org/abs/2405.14333.
Yichen Xu and Martin Odersky. Agentic Proof Automation: A Case Study, January 2026. URL
http://arxiv.org/abs/2601.03768. arXiv:2601.03768 [cs].
Hanning Zhang, Ruida Wang, Rui Pan, Wenyuan Wang, Bingxu Meng, and Tong Zhang. PhysProver:
Advancing Automatic Theorem Proving for Physics, January 2026. URL http://arxiv.org/
abs/2601.15737. arXiv:2601.15737 [cs].
Lan Zhang, Marco Valentino, and Andre Freitas. Autoformalization in the Wild: Assessing LLMs
on Real-World Mathematical Definitions, September 2025. URL http://arxiv.org/abs/
2502.12065. arXiv:2502.12065 [cs].
A

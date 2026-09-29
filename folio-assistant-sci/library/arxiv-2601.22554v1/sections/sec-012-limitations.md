---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-012-limitations
section_title: "Limitations"
section_number: null
pages: 9-11
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
LeanArchitect introduces a new integration point between Lean and blueprint workflows and has several
limitations. First, authoring LATEX inside Lean files is currently unergonomic: mainstream Lean IDE support
provides neither syntax highlighting nor interactive feedback for embedded LATEX in .lean files, and existing
keybindings interfere with natural LATEX input. Second, LeanArchitect supports a many-to-one correspondence
from Lean declarations to blueprint nodes: multiple Lean declarations may correspond to the same blueprint
node, but a given Lean declaration cannot correspond to more than one blueprint node, which limits
expressiveness in cases where the same lemma appears in the blueprint multiple times. Third, the additional
build steps of LeanArchitect deepen the build pipeline and increase the possibility for build and CI failures.
Finally, blueprint nodes that exist only in the informal LATEX layer must still be managed manually until a
corresponding Lean declaration is introduced. These limitations primarily reflect tooling and infrastructure
gaps rather than fundamental design constraints.
Acknowledgements
Work partially supported by NSF Grant DMS-2434614 and a gift from Convergent Research.
References
[1] Tudor Achim, Alex Best, Alberto Bietti, Kevin Der, Mathïs Fédérico, Sergei Gukov, Daniel Halpern-
Leistner, Kirsten Henningsgard, Yury Kudryashov, Alexander Meiburg, et al. Aristotle: IMO-Level
Automated Theorem Proving. arXiv preprint, 2025. doi: 10.48550/arXiv.2510.01346. URL https:
//doi.org/10.48550/arXiv.2510.01346.
[2] Lars Becker, María Inés de Frutos-Fernández, Leo Diedering, Floris van Doorn, Sébastien Gouëzel, Asgar
Jamneshan, Evgenia Karunus, Edward van de Meent, Pietro Monticone, Jasper Mulder-Sohn, et al. A
Blueprint for the Formalization of Carleson’s Theorem on Convergence of Fourier Series. arXiv preprint,
2025. doi: 10.48550/arXiv.2405.06423. URL https://doi.org/10.48550/arXiv.2405.06423.
[3] Matthew Bolan, Joachim Breitner, Jose Brox, Nicholas Carlini, Mario Carneiro, Floris van Doorn, Martin
Dvorak, Andrés Goens, Aaron Hill, Harald Husum, Hernán Ibarra Mejia, Zoltan A. Kocsis, Bruno
Le Floch, Amir Livne Bar-on, Lorenzo Luccioli, Douglas McNeil, Alex Meiburg, Pietro Monticone, Pace P.
Nielsen, Emmanuel Osalotioman Osazuwa, Giovanni Paolini, Marco Petracci, Bernhard Reinke, David
Renshaw, Marcus Rossel, Cody Roux, Jérémy Scanvic, Shreyas Srinivas, Anand Rao Tadipatri, Terence
Tao, Vlad Tsyrklevich, Fernando Vaquerizo-Villar, Daniel Weber, and Fan Zheng. The Equational
Theories Project: Advancing Collaborative Mathematical Research at Scale. arXiv preprint, 2025. doi:
10.48550/arXiv.2512.07087. URL https://doi.org/10.48550/arXiv.2512.07087.
[4] Kevin Buzzard and Richard Taylor. FLT: An Ongoing Lean Formalisation of the Proof of Fermat’s Last
Theorem, 2023. URL https://github.com/ImperialCollegeLondon/FLT.
LeanArchitect
10
[5] Jiangjie Chen, Wenxiang Chen, Jiacheng Du, Jinyi Hu, Zhicheng Jiang, Allan Jie, Xiaoran Jin, Xing
Jin, Chenggang Li, Wenlei Shi, et al.
Seed-Prover 1.5: Mastering Undergraduate-Level Theorem
Proving via Learning from Experience. arXiv preprint, 2025. doi: 10.48550/arXiv.2512.17260. URL
https://doi.org/10.48550/arXiv.2512.17260.
[6] Luoxin Chen, Jinming Gu, Liankai Huang, Wenhao Huang, Zhicheng Jiang, Allan Jie, Xiaoran Jin, Xing
Jin, Chenggang Li, Kaijing Ma, et al. Seed-Prover: Deep and Broad Reasoning for Automated Theorem
Proving. arXiv preprint, 2025. doi: 10.48550/arXiv.2507.23726. URL https://doi.org/10.48550/arX
iv.2507.23726.
[7] Leonardo de Moura and Sebastian Ullrich. The Lean 4 Theorem Prover and Programming Language. In
Automated Deduction – CADE 28, volume 12699 of Lecture Notes in Computer Science, pages 625–635.
Springer, 2021. doi: 10.1007/978-3-030-79876-5_37. URL https://doi.org/10.1007/978-3-030-798
76-5_37.
[8] Leonardo de Moura, Soonho Kong, Jeremy Avigad, Floris van Doorn, and Jakob von Raumer. The Lean
Theorem Prover (System Description). In Automated Deduction – CADE-25, volume 9195 of Lecture
Notes in Computer Science, pages 378–388. Springer, 2015. doi: 10.1007/978-3-319-21401-6_26. URL
https://doi.org/10.1007/978-3-319-21401-6_26.
[9] Rémy Degenne, David Ledvinka, Etienne Marion, and Peter Pfaffelhuber. Formalization of Brownian
Motion in Lean. arXiv preprint, 2025. doi: 10.48550/arXiv.2511.20118. URL https://doi.org/10.485
50/arXiv.2511.20118.
[10] Google DeepMind. Formal Conjectures: A Collection of Formalized Statements of Conjectures in Lean,
2025. URL https://github.com/google-deepmind/formal-conjectures.
[11] Jiewen Hu, Thomas Zhu, and Sean Welleck. miniCTX: Neural Theorem Proving with (Long-)Contexts.
In The Thirteenth International Conference on Learning Representations, 2025. URL https://openre
view.net/forum?id=KIgaAqEFHW.
[12] Thomas Hubert, Rishi Mehta, Laurent Sartran, Miklós Z. Horváth, Goran Žužić, Eric Wieser, Aja Huang,
Julian Schrittwieser, Yannick Schroecker, Hussain Masoom, et al. Olympiad-Level Formal Mathematical
Reasoning with Reinforcement Learning. Nature, 2025. doi: 10.1038/s41586-025-09833-y. URL
https://doi.org/10.1038/s41586-025-09833-y.
[13] Alex Kontorovich and Terence Tao. Prime Number Theorem and More, 2024. URL https://github.c
om/AlexKontorovich/PrimeNumberTheoremAnd.
[14] Yong Lin, Shange Tang, Bohan Lyu, Jiayun Wu, Hongzhou Lin, Kaiyu Yang, Jia Li, Mengzhou Xia,
Danqi Chen, Sanjeev Arora, et al. Goedel-Prover: A Frontier Model for Open-Source Automated Theorem
Proving. arXiv preprint, 2025. doi: 10.48550/arXiv.2502.07640. URL https://doi.org/10.48550/arX
iv.2502.07640.
[15] Yong Lin, Shange Tang, Bohan Lyu, Ziran Yang, Jui-Hui Chung, Haoyu Zhao, Lai Jiang, Yihan Geng,
Jiawei Ge, Jingruo Sun, et al. Goedel-Prover-V2: Scaling Formal Theorem Proving with Scaffolded
Data Synthesis and Self-Correction. arXiv preprint, 2025. doi: 10.48550/arXiv.2508.03613. URL
https://doi.org/10.48550/arXiv.2508.03613.
[16] Patrick Massot. leanblueprint: plasTeX Plugin to Build Formalization Blueprints, 2020. URL https:
//github.com/PatrickMassot/leanblueprint.
[17] Auguste Poiroux, Antoine Bosselut, and Viktor Kunčak. RLMEval: Evaluating Research-Level Neural
Theorem Proving. In Findings of the Association for Computational Linguistics: EMNLP 2025, 2025.
doi: 10.48550/arXiv.2510.25427. URL https://doi.org/10.48550/arXiv.2510.25427.
[18] Z. Z. Ren, Zhihong Shao, Junxiao Song, Huajian Xin, Haocheng Wang, Wanjia Zhao, Liyue Zhang, Zhe
Fu, Qihao Zhu, Dejian Yang, et al. DeepSeek-Prover-V2: Advancing Formal Mathematical Reasoning via
Reinforcement Learning for Subgoal Decomposition. arXiv preprint, 2025. doi: 10.48550/arXiv.2504.21801.
URL https://doi.org/10.48550/arXiv.2504.21801.
LeanArchitect
11
[19] Emily Riehl and Dominic Verity. Infinity Cosmos: A Blueprint for a Formalization of Infinity-Cosmos
Theory in Lean, 2024. URL https://github.com/emilyriehl/infinity-cosmos.
[20] The mathlib Community. The Lean Mathematical Library. In Proceedings of the 9th ACM SIGPLAN
International Conference on Certified Programs and Proofs, CPP ’20, pages 367–381. ACM, 2020. doi:
10.1145/3372885.3373824. URL https://doi.org/10.1145/3372885.3373824.
[21] Haiming Wang, Mert Unsal, Xiaohan Lin, Mantas Baksys, Junqi Liu, Marco Dos Santos, Flood Sung,
Marina Vinyes, Zhenzhe Ying, Zekai Zhu, et al. Kimina-Prover Preview: Towards Large Formal Reasoning
Models with Reinforcement Learning. arXiv preprint, 2025. doi: 10.48550/arXiv.2504.11354. URL
https://doi.org/10.48550/arXiv.2504.11354.
[22] Huajian Xin, Daya Guo, Zhihong Shao, Zhizhou Ren, Qihao Zhu, Bo Liu, Chong Ruan, Wenda Li, and
Xiaodan Liang. DeepSeek-Prover: Advancing Theorem Proving in LLMs through Large-Scale Synthetic
Data. arXiv preprint, 2024. doi: 10.48550/arXiv.2405.14333. URL https://doi.org/10.48550/arXiv
.2405.14333.
[23] Huajian Xin, Z. Z. Ren, Junxiao Song, Zhihong Shao, Wanjia Zhao, Haocheng Wang, Bo Liu, Liyue Zhang,
Xuan Lu, Qiushi Du, et al. DeepSeek-Prover-V1.5: Harnessing Proof Assistant Feedback for Reinforcement
Learning and Monte-Carlo Tree Search. arXiv preprint, 2024. doi: 10.48550/arXiv.2408.08152. URL
https://doi.org/10.48550/arXiv.2408.08152.
[24] Kaiyu Yang, Aidan Swope, Alex Gu, Rahul Chalamala, Peiyang Song, Shixing Yu, Saad Godil, Ryan J.
Prenger, and Animashree Anandkumar. LeanDojo: Theorem Proving with Retrieval-Augmented Language
Models. Advances in Neural Information Processing Systems, 36:21573–21612, 2023.
[25] Kunhao Zheng, Jesse Michael Han, and Stanislas Polu. miniF2F: A Cross-System Benchmark for
Formal Olympiad-Level Mathematics. arXiv preprint, 2021. doi: 10.48550/arXiv.2109.00110. URL
https://doi.org/10.48550/arXiv.2109.00110.
[26] Thomas Zhu, Joshua Clune, Jeremy Avigad, Albert Qiaochu Jiang, and Sean Welleck. Premise Selection
for a Lean Hammer. arXiv preprint, 2025. doi: 10.48550/arXiv.2506.07477. URL https://doi.org/10
.48550/arXiv.2506.07477.
A

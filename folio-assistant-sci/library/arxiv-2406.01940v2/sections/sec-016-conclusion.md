---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-016-conclusion
section_title: "Conclusion"
section_number: null
pages: 11-19
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
In the current study, we introduce a new benchmark FORML4 specifically designed to assess the
autoformalization capabilities of LLMs in Lean 4, and propose a processs-drive autoformalization
(PDA) training pipeline with iterative process-level feedback. Unlike the existing dataset focuses
on translating questions to statements, FORML4 focuses on tapping each statement’s proof steps to
implement a more comprehensive, fine-grained, and effective evaluation of autoformalized statement.
Importantly, PDA leverages the precise feedback naturally provided by Lean 4 compilers to improve
autoformalization, significantly enhancing performance and enabling more effective utilization of
high-quality training data. For future work, we plan to extend our benchmark and apply our method
to more formal languages such as Isabelle, HOL Light, and Coq.
REFERENCES
Josh Achiam, Steven Adler, Sandhini Agarwal, Lama Ahmad, Ilge Akkaya, Florencia Leoni Aleman,
Diogo Almeida, Janko Altenschmidt, Sam Altman, Shyamal Anadkat, et al. Gpt-4 technical report.
arXiv preprint arXiv:2303.08774, 2023.
Anthropic. Introducing the next generation of claude, 2024. URL https://www.anthropic.
com/news/claude-3-family.
Zhangir Azerbayev, Bartosz Piotrowski, Hailey Schoelkopf, Edward W. Ayers, Dragomir Radev, and
Jeremy Avigad. Proofnet: Autoformalizing and formally proving undergraduate-level mathematics.
CoRR, abs/2302.12433, 2023a. doi: 10.48550/ARXIV.2302.12433. URL https://doi.org/
10.48550/arXiv.2302.12433.
Zhangir Azerbayev, Hailey Schoelkopf, Keiran Paster, Marco Dos Santos, Stephen McAleer, Albert Q.
Jiang, Jia Deng, Stella Biderman, and Sean Welleck. Llemma: An open language model for
mathematics. CoRR, abs/2310.10631, 2023b. doi: 10.48550/ARXIV.2310.10631. URL https:
//doi.org/10.48550/arXiv.2310.10631.
Yuntao Bai, Saurav Kadavath, Sandipan Kundu, Amanda Askell, Jackson Kernion, Andy Jones,
Anna Chen, Anna Goldie, Azalia Mirhoseini, Cameron McKinnon, Carol Chen, Catherine Olsson,
Christopher Olah, Danny Hernandez, Dawn Drain, Deep Ganguli, Dustin Li, Eli Tran-Johnson,
Ethan Perez, Jamie Kerr, Jared Mueller, Jeffrey Ladish, Joshua Landau, Kamal Ndousse, Kamile
Lukosiute, Liane Lovitt, Michael Sellitto, Nelson Elhage, Nicholas Schiefer, Noemí Mercado,
Nova DasSarma, Robert Lasenby, Robin Larson, Sam Ringer, Scott Johnston, Shauna Kravec,
Sheer El Showk, Stanislav Fort, Tamera Lanham, Timothy Telleen-Lawton, Tom Conerly, Tom
Henighan, Tristan Hume, Samuel R. Bowman, Zac Hatfield-Dodds, Ben Mann, Dario Amodei,
Nicholas Joseph, Sam McCandlish, Tom Brown, and Jared Kaplan. Constitutional AI: harmlessness
from AI feedback. CoRR, abs/2212.08073, 2022. doi: 10.48550/ARXIV.2212.08073. URL
https://doi.org/10.48550/arXiv.2212.08073.
Bruno Barras, Samuel Boutin, Cristina Cornes, Judicaël Courant, Jean-Christophe Filliâtre, Eduardo
Giménez, Hugo Herbelin, Gérard P. Huet, César A. Muñoz, Chetan R. Murthy, Catherine Parent,
Christine Paulin-Mohring, Amokrane Saïbi, and Benjamin Werner. The coq proof assistant
: reference manual, version 6.1. 1997. URL https://api.semanticscholar.org/
CorpusID:54117279.
Andrej Bauer, Matej Petkovic, and Ljupco Todorovski. MLFMF: data sets for machine learning for
mathematical formalization. In Alice Oh, Tristan Naumann, Amir Globerson, Kate Saenko, Moritz
Hardt, and Sergey Levine (eds.), Advances in Neural Information Processing Systems 36: Annual
Conference on Neural Information Processing Systems 2023, NeurIPS 2023, New Orleans, LA, USA,
December 10 - 16, 2023, 2023. URL http://papers.nips.cc/paper_files/paper/
2023/hash/9efe8db7fab57e19eed25718abedbbd2-Abstract-Datasets_
and_Benchmarks.html.
Jiaqi Chen, Tong Li, Jinghui Qin, Pan Lu, Liang Lin, Chongyu Chen, and Xiaodan Liang. Unigeo:
Unifying geometry logical reasoning via reformulating mathematical expression. In Yoav Goldberg,
Zornitsa Kozareva, and Yue Zhang (eds.), Proceedings of the 2022 Conference on Empirical
Methods in Natural Language Processing, EMNLP 2022, Abu Dhabi, United Arab Emirates,
11
Work in progress
December 7-11, 2022, pp. 3313–3323. Association for Computational Linguistics, 2022. doi:
10.18653/V1/2022.EMNLP-MAIN.218. URL https://doi.org/10.18653/v1/2022.
emnlp-main.218.
Mark Chen, Jerry Tworek, Heewoo Jun, Qiming Yuan, Henrique Pondé de Oliveira Pinto, Jared
Kaplan, Harrison Edwards, Yuri Burda, Nicholas Joseph, Greg Brockman, Alex Ray, Raul Puri,
Gretchen Krueger, Michael Petrov, Heidy Khlaaf, Girish Sastry, Pamela Mishkin, Brooke Chan,
Scott Gray, Nick Ryder, Mikhail Pavlov, Alethea Power, Lukasz Kaiser, Mohammad Bavarian,
Clemens Winter, Philippe Tillet, Felipe Petroski Such, Dave Cummings, Matthias Plappert, Fotios
Chantzis, Elizabeth Barnes, Ariel Herbert-Voss, William Hebgen Guss, Alex Nichol, Alex Paino,
Nikolas Tezak, Jie Tang, Igor Babuschkin, Suchir Balaji, Shantanu Jain, William Saunders,
Christopher Hesse, Andrew N. Carr, Jan Leike, Joshua Achiam, Vedant Misra, Evan Morikawa,
Alec Radford, Matthew Knight, Miles Brundage, Mira Murati, Katie Mayer, Peter Welinder, Bob
McGrew, Dario Amodei, Sam McCandlish, Ilya Sutskever, and Wojciech Zaremba. Evaluating
large language models trained on code. CoRR, abs/2107.03374, 2021. URL https://arxiv.
org/abs/2107.03374.
Karl Cobbe, Vineet Kosaraju, Mohammad Bavarian, Mark Chen, Heewoo Jun, Lukasz Kaiser,
Matthias Plappert, Jerry Tworek, Jacob Hilton, Reiichiro Nakano, Christopher Hesse, and John
Schulman. Training verifiers to solve math word problems. CoRR, abs/2110.14168, 2021. URL
https://arxiv.org/abs/2110.14168.
Rémi Coulom. Efficient selectivity and backup operators in monte-carlo tree search. In H. Jaap van den
Herik, Paolo Ciancarini, and H. H. L. M. Donkers (eds.), Computers and Games, 5th International
Conference, CG 2006, Turin, Italy, May 29-31, 2006. Revised Papers, volume 4630 of Lecture
Notes in Computer Science, pp. 72–83. Springer, 2006. doi: 10.1007/978-3-540-75538-8\_7. URL
https://doi.org/10.1007/978-3-540-75538-8_7.
Leonardo de Moura and Sebastian Ullrich. The lean 4 theorem prover and programming language.
In André Platzer and Geoff Sutcliffe (eds.), Automated Deduction - CADE 28 - 28th International
Conference on Automated Deduction, Virtual Event, July 12-15, 2021, Proceedings, volume
12699 of Lecture Notes in Computer Science, pp. 625–635. Springer, 2021.
doi: 10.1007/
978-3-030-79876-5\_37. URL https://doi.org/10.1007/978-3-030-79876-5_
37.
Leonardo Mendonça de Moura, Soonho Kong, Jeremy Avigad, Floris van Doorn, and Jakob von
Raumer. The lean theorem prover (system description). In Amy P. Felty and Aart Middeldorp
(eds.), Automated Deduction - CADE-25 - 25th International Conference on Automated Deduction,
Berlin, Germany, August 1-7, 2015, Proceedings, volume 9195 of Lecture Notes in Computer
Science, pp. 378–388. Springer, 2015. doi: 10.1007/978-3-319-21401-6\_26. URL https:
//doi.org/10.1007/978-3-319-21401-6_26.
Siddhartha Gadgil, Anand Rao Tadipatri, Ayush Agrawal, Ashvni Narayanan, and Navin Goyal.
Towards automating formalisation of theorem statements using large language models. In 36th
Conference on Neural Information Processing Systems (NeurIPS 2022) Workshop on MATH-AI,
2022.
Luyu Gao, Zhuyun Dai, Panupong Pasupat, Anthony Chen, Arun Tejasvi Chaganty, Yicheng Fan,
Vincent Y. Zhao, Ni Lao, Hongrae Lee, Da-Cheng Juan, and Kelvin Guu. RARR: researching
and revising what language models say, using language models. In Anna Rogers, Jordan L. Boyd-
Graber, and Naoaki Okazaki (eds.), Proceedings of the 61st Annual Meeting of the Association
for Computational Linguistics (Volume 1: Long Papers), ACL 2023, Toronto, Canada, July 9-14,
2023, pp. 16477–16508. Association for Computational Linguistics, 2023. doi: 10.18653/V1/2023.
ACL-LONG.910. URL https://doi.org/10.18653/v1/2023.acl-long.910.
Zhibin Gou, Zhihong Shao, Yeyun Gong, Yelong Shen, Yujiu Yang, Nan Duan, and Weizhu
Chen. CRITIC: large language models can self-correct with tool-interactive critiquing. CoRR,
abs/2305.11738, 2023. doi: 10.48550/ARXIV.2305.11738. URL https://doi.org/10.
48550/arXiv.2305.11738.
Suriya Gunasekar, Yi Zhang, Jyoti Aneja, Caio César Teodoro Mendes, Allie Del Giorno, Sivakanth
Gopi, Mojan Javaheripi, Piero Kauffmann, Gustavo de Rosa, Olli Saarikivi, Adil Salim, Shital
12
Work in progress
Shah, Harkirat Singh Behl, Xin Wang, Sébastien Bubeck, Ronen Eldan, Adam Tauman Kalai,
Yin Tat Lee, and Yuanzhi Li. Textbooks are all you need. CoRR, abs/2306.11644, 2023. doi: 10.
48550/ARXIV.2306.11644. URL https://doi.org/10.48550/arXiv.2306.11644.
Jesse Michael Han, Jason Rute, Yuhuai Wu, Edward W. Ayers, and Stanislas Polu. Proof artifact
co-training for theorem proving with language models. In The Tenth International Conference on
Learning Representations, ICLR 2022, Virtual Event, April 25-29, 2022. OpenReview.net, 2022.
URL https://openreview.net/forum?id=rpxJc9j04U.
John Harrison. HOL Light: A tutorial introduction. In Mandayam K. Srivas and Albert John Camilleri
(eds.), Formal Methods in Computer-Aided Design, First International Conference, FMCAD ’96,
Palo Alto, California, USA, November 6-8, 1996, Proceedings, volume 1166 of Lecture Notes in
Computer Science, pp. 265–269. Springer, 1996.
Dan Hendrycks, Collin Burns, Saurav Kadavath, Akul Arora, Steven Basart, Eric Tang,
Dawn Song,
and Jacob Steinhardt.
Measuring mathematical problem solving with
the MATH dataset.
In Joaquin Vanschoren and Sai-Kit Yeung (eds.), Proceedings
of the Neural Information Processing Systems Track on Datasets and Benchmarks
1, NeurIPS Datasets and Benchmarks 2021, December 2021, virtual, 2021.
URL
https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/
hash/be83ab3ecd0db773eb2dc1b0a17836a1-Abstract-round2.html.
Daniel Huang, Prafulla Dhariwal, Dawn Song, and Ilya Sutskever. Gamepad: A learning environment
for theorem proving. In 7th International Conference on Learning Representations, ICLR 2019,
New Orleans, LA, USA, May 6-9, 2019. OpenReview.net, 2019. URL https://openreview.
net/forum?id=r1xwKoR9Y7.
Dong Huang, Jianbo Dai, Han Weng, Puzhen Wu, Yuhao Qing, Jie M Zhang, Heming Cui, and
Zhijiang Guo. Soap: Enhancing efficiency of generated code via self-optimization. arXiv preprint
arXiv:2405.15189, 2024a.
Yinya Huang, Xiaohan Lin, Zhengying Liu, Qingxing Cao, Huajian Xin, Haiming Wang, Zhenguo
Li, Linqi Song, and Xiaodan Liang. MUSTARD: mastering uniform synthesis of theorem and
proof data. CoRR, abs/2402.08957, 2024b. doi: 10.48550/ARXIV.2402.08957. URL https:
//doi.org/10.48550/arXiv.2402.08957.
Albert Q. Jiang, Wenda Li, and Mateja Jamnik. Multilingual mathematical autoformalization. CoRR,
abs/2311.03755, 2023a. doi: 10.48550/ARXIV.2311.03755. URL https://doi.org/10.
48550/arXiv.2311.03755.
Albert Q. Jiang, Alexandre Sablayrolles, Arthur Mensch, Chris Bamford, Devendra Singh Chaplot,
Diego de Las Casas, Florian Bressand, Gianna Lengyel, Guillaume Lample, Lucile Saulnier,
Lélio Renard Lavaud, Marie-Anne Lachaux, Pierre Stock, Teven Le Scao, Thibaut Lavril, Thomas
Wang, Timothée Lacroix, and William El Sayed. Mistral 7b. CoRR, abs/2310.06825, 2023b.
doi: 10.48550/ARXIV.2310.06825. URL https://doi.org/10.48550/arXiv.2310.
06825.
Albert Qiaochu Jiang, Sean Welleck, Jin Peng Zhou, Timothée Lacroix, Jiacheng Liu, Wenda Li,
Mateja Jamnik, Guillaume Lample, and Yuhuai Wu. Draft, sketch, and prove: Guiding formal
theorem provers with informal proofs. In The Eleventh International Conference on Learning
Representations, ICLR 2023, Kigali, Rwanda, May 1-5, 2023. OpenReview.net, 2023c. URL
https://openreview.net/pdf?id=SMa9EAovKMC.
Jaehun Jung, Lianhui Qin, Sean Welleck, Faeze Brahman, Chandra Bhagavatula, Ronan Le Bras, and
Yejin Choi. Maieutic prompting: Logically consistent reasoning with recursive explanations. In
Yoav Goldberg, Zornitsa Kozareva, and Yue Zhang (eds.), Proceedings of the 2022 Conference
on Empirical Methods in Natural Language Processing, EMNLP 2022, Abu Dhabi, United Arab
Emirates, December 7-11, 2022, pp. 1266–1279. Association for Computational Linguistics,
2022. doi: 10.18653/V1/2022.EMNLP-MAIN.82. URL https://doi.org/10.18653/
v1/2022.emnlp-main.82.
13
Work in progress
Takeshi Kojima,
Shixiang Shane Gu,
Machel Reid,
Yutaka Matsuo,
and Yusuke Iwa-
sawa.
Large language models are zero-shot reasoners.
In Sanmi Koyejo, S. Mo-
hamed, A. Agarwal, Danielle Belgrave, K. Cho, and A. Oh (eds.), Advances in Neural
Information Processing Systems 35:
Annual Conference on Neural Information Process-
ing Systems 2022, NeurIPS 2022, New Orleans, LA, USA, November 28 - December 9,
2022, 2022.
URL http://papers.nips.cc/paper_files/paper/2022/hash/
8bb0d291acd4acf06ef112099c16f326-Abstract-Conference.html.
Woosuk Kwon, Zhuohan Li, Siyuan Zhuang, Ying Sheng, Lianmin Zheng, Cody Hao Yu, Joseph
Gonzalez, Hao Zhang, and Ion Stoica. Efficient memory management for large language model
serving with pagedattention. In Jason Flinn, Margo I. Seltzer, Peter Druschel, Antoine Kaufmann,
and Jonathan Mace (eds.), Proceedings of the 29th Symposium on Operating Systems Principles,
SOSP 2023, Koblenz, Germany, October 23-26, 2023, pp. 611–626. ACM, 2023. doi: 10.1145/
3600006.3613165. URL https://doi.org/10.1145/3600006.3613165.
Jia LI, Edward Beeching, Lewis Tunstall, Ben Lipkin, Roman Soletskyi, Shengyi Costa Huang,
Kashif Rasul, Longhui Yu, Albert Jiang, Ziju Shen, Zihan Qin, Bin Dong, Li Zhou, Yann Fleureau,
Guillaume Lample, and Stanislas Polu.
Numinamath.
[https://huggingface.
co/AI-MO/NuminaMath-CoT](https://github.com/project-numina/
aimo-progress-prize/blob/main/report/numina_dataset.pdf), 2024.
Wenda Li, Lei Yu, Yuhuai Wu, and Lawrence C. Paulson. Isarstep: a benchmark for high-level
mathematical reasoning. In 9th International Conference on Learning Representations, ICLR 2021,
Virtual Event, Austria, May 3-7, 2021. OpenReview.net, 2021. URL https://openreview.
net/forum?id=Pzj6fzU6wkj.
Yifei Li, Zeqi Lin, Shizhuo Zhang, Qiang Fu, Bei Chen, Jian-Guang Lou, and Weizhu Chen. Making
language models better reasoners with step-aware verifier. In Anna Rogers, Jordan L. Boyd-
Graber, and Naoaki Okazaki (eds.), Proceedings of the 61st Annual Meeting of the Association
for Computational Linguistics (Volume 1: Long Papers), ACL 2023, Toronto, Canada, July 9-14,
2023, pp. 5315–5333. Association for Computational Linguistics, 2023. doi: 10.18653/V1/2023.
ACL-LONG.291. URL https://doi.org/10.18653/v1/2023.acl-long.291.
Hunter Lightman, Vineet Kosaraju, Yuri Burda, Harrison Edwards, Bowen Baker, Teddy Lee, Jan
Leike, John Schulman, Ilya Sutskever, and Karl Cobbe. Let’s verify step by step. In The Twelfth
International Conference on Learning Representations, 2024. URL https://openreview.
net/forum?id=v8L0pN6EOi.
Chengwu Liu, Jianhao Shen, Huajian Xin, Zhengying Liu, Ye Yuan, Haiming Wang, Wei Ju,
Chuanyang Zheng, Yichun Yin, Lin Li, Ming Zhang, and Qun Liu. FIMO: A challenge formal
dataset for automated theorem proving. CoRR, abs/2309.04295, 2023a. doi: 10.48550/ARXIV.
2309.04295. URL https://doi.org/10.48550/arXiv.2309.04295.
Chengwu Liu, Jianhao Shen, Huajian Xin, Zhengying Liu, Ye Yuan, Haiming Wang, Wei Ju,
Chuanyang Zheng, Yichun Yin, Lin Li, et al. Fimo: A challenge formal dataset for automated
theorem proving. arXiv preprint arXiv:2309.04295, 2023b.
Jianqiao Lu, Wanjun Zhong, Wenyong Huang, Yufei Wang, Fei Mi, Baojun Wang, Weichao Wang,
Lifeng Shang, and Qun Liu. SELF: language-driven self-evolution for large language model.
CoRR, abs/2310.00533, 2023. doi: 10.48550/ARXIV.2310.00533. URL https://doi.org/
10.48550/arXiv.2310.00533.
Jianqiao Lu, Zhiyang Dou, Hongru Wang, Zeyu Cao, Jianbo Dai, Yingjia Wan, Yinya Huang, and
Zhijiang Guo. Autocv: Empowering reasoning with automated process labeling via confidence
variation, 2024a.
Jianqiao Lu, Yingjia Wan, Yinya Huang, Jing Xiong, Zhengying Liu, and Zhijiang Guo. Formalalign:
Automated alignment evaluation for autoformalization. 2024b.
Jianqiao Lu, Wanjun Zhong, Yufei Wang, Zhijiang Guo, Qi Zhu, Wenyong Huang, Yanlin Wang, Fei
Mi, Baojun Wang, Yasheng Wang, et al. Yoda: Teacher-student progressive learning for language
models. arXiv preprint arXiv:2401.15670, 2024c.
14
Work in progress
Qianli Ma, Haotian Zhou, Tingkai Liu, Jianbo Yuan, Pengfei Liu, Yang You, and Hongxia Yang.
Let’s reward step by step: Step-level reward model as the navigators for reasoning. CoRR,
abs/2310.10080, 2023. doi: 10.48550/ARXIV.2310.10080. URL https://doi.org/10.
48550/arXiv.2310.10080.
Aman Madaan, Niket Tandon, Prakhar Gupta, Skyler Hallinan, Luyu Gao, Sarah Wiegr-
effe, Uri Alon, Nouha Dziri, Shrimai Prabhumoye, Yiming Yang, Shashank Gupta, Bod-
hisattwa Prasad Majumder, Katherine Hermann, Sean Welleck, Amir Yazdanbakhsh, and
Peter Clark.
Self-refine:
Iterative refinement with self-feedback.
In Alice Oh, Tristan
Naumann, Amir Globerson, Kate Saenko, Moritz Hardt, and Sergey Levine (eds.), Ad-
vances in Neural Information Processing Systems 36: Annual Conference on Neural Infor-
mation Processing Systems 2023, NeurIPS 2023, New Orleans, LA, USA, December 10 -
16, 2023, 2023. URL http://papers.nips.cc/paper_files/paper/2023/hash/
91edff07232fb1b55a505a9e9f6c0ff3-Abstract-Conference.html.
Meta. Introducing meta llama 3: The most capable openly available llm to date, 2024. URL
https://ai.meta.com/blog/meta-llama-3/.
Maciej Mikula, Szymon Antoniak, Szymon Tworkowski, Albert Qiaochu Jiang, Jin Peng Zhou,
Christian Szegedy, Lukasz Kucinski, Piotr Milos, and Yuhuai Wu. Magnushammer: A transformer-
based approach to premise selection. CoRR, abs/2303.04488, 2023. doi: 10.48550/ARXIV.2303.
04488. URL https://doi.org/10.48550/arXiv.2303.04488.
Subhabrata Mukherjee, Arindam Mitra, Ganesh Jawahar, Sahaj Agarwal, Hamid Palangi, and Ahmed
Awadallah. Orca: Progressive learning from complex explanation traces of GPT-4. CoRR,
abs/2306.02707, 2023. doi: 10.48550/ARXIV.2306.02707. URL https://doi.org/10.
48550/arXiv.2306.02707.
Wojciech Nawrocki, Edward W. Ayers, and Gabriel Ebner. An extensible user interface for lean 4.
In Adam Naumowicz and René Thiemann (eds.), 14th International Conference on Interactive
Theorem Proving, ITP 2023, July 31 to August 4, 2023, Białystok, Poland, volume 268 of LIPIcs,
pp. 24:1–24:20. Schloss Dagstuhl - Leibniz-Zentrum für Informatik, 2023. doi: 10.4230/LIPICS.
ITP.2023.24. URL https://doi.org/10.4230/LIPIcs.ITP.2023.24.
OpenAI. GPT-3.5 Turbo, 2023. URL https://platform.openai.com/docs/models/
gpt-3-5.
Long Ouyang, Jeffrey Wu, Xu Jiang, Diogo Almeida, Carroll L. Wainwright, Pamela Mishkin,
Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, John Schulman, Jacob Hilton, Fraser
Kelton, Luke Miller, Maddie Simens, Amanda Askell, Peter Welinder, Paul F. Christiano, Jan
Leike, and Ryan Lowe. Training language models to follow instructions with human feedback.
In Sanmi Koyejo, S. Mohamed, A. Agarwal, Danielle Belgrave, K. Cho, and A. Oh (eds.),
Advances in Neural Information Processing Systems 35: Annual Conference on Neural Information
Processing Systems 2022, NeurIPS 2022, New Orleans, LA, USA, November 28 - December
9, 2022, 2022. URL http://papers.nips.cc/paper_files/paper/2022/hash/
b1efde53be364a73914f58805a001731-Abstract-Conference.html.
Tom Reichel, R. Wesley Henderson, Andrew Touchet, Andrew Gardner, and Talia Ringer. Proof repair
infrastructure for supervised models: Building a large proof repair dataset. In Adam Naumowicz
and René Thiemann (eds.), 14th International Conference on Interactive Theorem Proving, ITP
2023, July 31 to August 4, 2023, Białystok, Poland, volume 268 of LIPIcs, pp. 26:1–26:20. Schloss
Dagstuhl - Leibniz-Zentrum für Informatik, 2023. doi: 10.4230/LIPICS.ITP.2023.26. URL
https://doi.org/10.4230/LIPIcs.ITP.2023.26.
Zhihong Shao, Peiyi Wang, Qihao Zhu, Runxin Xu, Junxiao Song, Mingchuan Zhang, Y. K. Li,
Y. Wu, and Daya Guo. Deepseekmath: Pushing the limits of mathematical reasoning in open
language models. CoRR, abs/2402.03300, 2024. doi: 10.48550/ARXIV.2402.03300. URL
https://doi.org/10.48550/arXiv.2402.03300.
Noah Shinn, Federico Cassano, Ashwin Gopinath, Karthik Narasimhan, and Shunyu Yao. Re-
flexion: language agents with verbal reinforcement learning.
In Alice Oh, Tristan Nau-
mann, Amir Globerson, Kate Saenko, Moritz Hardt, and Sergey Levine (eds.), Advances
15
Work in progress
in Neural Information Processing Systems 36:
Annual Conference on Neural Informa-
tion Processing Systems 2023, NeurIPS 2023, New Orleans, LA, USA, December 10 - 16,
2023, 2023.
URL http://papers.nips.cc/paper_files/paper/2023/hash/
1b44b878bb782e6954cd888628510e90-Abstract-Conference.html.
David Silver, Aja Huang, Chris J. Maddison, Arthur Guez, Laurent Sifre, George van den Driess-
che, Julian Schrittwieser, Ioannis Antonoglou, Vedavyas Panneershelvam, Marc Lanctot, Sander
Dieleman, Dominik Grewe, John Nham, Nal Kalchbrenner, Ilya Sutskever, Timothy P. Lillicrap,
Madeleine Leach, Koray Kavukcuoglu, Thore Graepel, and Demis Hassabis. Mastering the
game of go with deep neural networks and tree search. Nature, 529(7587):484–489, 2016. doi:
10.1038/NATURE16961. URL https://doi.org/10.1038/nature16961.
Christian Szegedy. A promising path towards autoformalization and general artificial intelligence. In
Christoph Benzmüller and Bruce R. Miller (eds.), Intelligent Computer Mathematics - 13th Interna-
tional Conference, CICM 2020, Bertinoro, Italy, July 26-31, 2020, Proceedings, volume 12236 of
Lecture Notes in Computer Science, pp. 3–20. Springer, 2020. doi: 10.1007/978-3-030-53518-6\_1.
URL https://doi.org/10.1007/978-3-030-53518-6_1.
Jonathan Uesato, Nate Kushman, Ramana Kumar, H. Francis Song, Noah Y. Siegel, Lisa Wang,
Antonia Creswell, Geoffrey Irving, and Irina Higgins. Solving math word problems with process-
and outcome-based feedback. CoRR, abs/2211.14275, 2022. doi: 10.48550/ARXIV.2211.14275.
URL https://doi.org/10.48550/arXiv.2211.14275.
Sebastian Ullrich and Leonardo de Moura. Counting immutable beans: Reference counting optimized
for purely functional programming. CoRR, abs/1908.05647, 2019. URL http://arxiv.org/
abs/1908.05647.
Sebastian Ullrich and Leonardo de Moura. ’do’ unchained: embracing local imperativity in a purely
functional language (functional pearl). Proc. ACM Program. Lang., 6(ICFP):512–539, 2022a. doi:
10.1145/3547640. URL https://doi.org/10.1145/3547640.
Sebastian Ullrich and Leonardo de Moura. Beyond notations: Hygienic macro expansion for theorem
proving languages. Logical Methods in Computer Science, 18, 2022b.
Peiyi Wang, Lei Li, Zhihong Shao, R. X. Xu, Damai Dai, Yifei Li, Deli Chen, Y. Wu, and Zhifang
Sui. Math-shepherd: Verify and reinforce llms step-by-step without human annotations. CoRR,
abs/2312.08935, 2023a. doi: 10.48550/ARXIV.2312.08935. URL https://doi.org/10.
48550/arXiv.2312.08935.
Qingxiang Wang, Cezary Kaliszyk, and Josef Urban. First experiments with neural translation of
informal to formal mathematics. In Florian Rabe, William M. Farmer, Grant O. Passmore, and
Abdou Youssef (eds.), Intelligent Computer Mathematics - 11th International Conference, CICM
2018, Hagenberg, Austria, August 13-17, 2018, Proceedings, volume 11006 of Lecture Notes in
Computer Science, pp. 255–270. Springer, 2018. doi: 10.1007/978-3-319-96812-4\_22. URL
https://doi.org/10.1007/978-3-319-96812-4_22.
Qingxiang Wang, Chad E. Brown, Cezary Kaliszyk, and Josef Urban. Exploration of neural machine
translation in autoformalization of mathematics in mizar. In Jasmin Blanchette and Catalin Hritcu
(eds.), Proceedings of the 9th ACM SIGPLAN International Conference on Certified Programs
and Proofs, CPP 2020, New Orleans, LA, USA, January 20-21, 2020, pp. 85–98. ACM, 2020. doi:
10.1145/3372885.3373827. URL https://doi.org/10.1145/3372885.3373827.
Xuezhi Wang, Jason Wei, Dale Schuurmans, Quoc V. Le, Ed H. Chi, Sharan Narang, Aakanksha
Chowdhery, and Denny Zhou. Self-consistency improves chain of thought reasoning in language
models. In The Eleventh International Conference on Learning Representations, ICLR 2023,
Kigali, Rwanda, May 1-5, 2023. OpenReview.net, 2023b. URL https://openreview.net/
pdf?id=1PL1NIMMrw.
Zihan Wang, Yunxuan Li, Yuexin Wu, Liangchen Luo, Le Hou, Hongkun Yu, and Jingbo Shang.
Multi-step problem solving through a verifier: An empirical analysis on model-induced process
supervision. CoRR, abs/2402.02658, 2024. doi: 10.48550/ARXIV.2402.02658. URL https:
//doi.org/10.48550/arXiv.2402.02658.
16
Work in progress
Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Brian Ichter, Fei Xia, Ed H. Chi,
Quoc V. Le, and Denny Zhou. Chain-of-thought prompting elicits reasoning in large language
models. In Sanmi Koyejo, S. Mohamed, A. Agarwal, Danielle Belgrave, K. Cho, and A. Oh (eds.),
Advances in Neural Information Processing Systems 35: Annual Conference on Neural Information
Processing Systems 2022, NeurIPS 2022, New Orleans, LA, USA, November 28 - December
9, 2022, 2022. URL http://papers.nips.cc/paper_files/paper/2022/hash/
9d5609613524ecf4f15af0f7b31abca4-Abstract-Conference.html.
Sean Welleck, Ximing Lu, Peter West, Faeze Brahman, Tianxiao Shen, Daniel Khashabi, and Yejin
Choi. Generating sequences by learning to self-correct. In The Eleventh International Conference
on Learning Representations, ICLR 2023, Kigali, Rwanda, May 1-5, 2023. OpenReview.net, 2023.
URL https://openreview.net/pdf?id=hH36JeQZDaO.
Makarius Wenzel, Lawrence C. Paulson, and Tobias Nipkow. The isabelle framework. In Otmane Aït
Mohamed, César A. Muñoz, and Sofiène Tahar (eds.), Theorem Proving in Higher Order Logics,
21st International Conference, TPHOLs 2008, Montreal, Canada, August 18-21, 2008. Proceed-
ings, volume 5170 of Lecture Notes in Computer Science, pp. 33–38. Springer, 2008. doi: 10.1007/
978-3-540-71067-7\_7. URL https://doi.org/10.1007/978-3-540-71067-7_7.
Jeff Wu, Long Ouyang, Daniel M. Ziegler, Nisan Stiennon, Ryan Lowe, Jan Leike, and Paul
Christiano. Recursively summarizing books with human feedback, 2021. URL https://
arxiv.org/abs/2109.10862.
Yuhuai Wu, Albert Qiaochu Jiang, Wenda Li, Markus N. Rabe, Charles Staats, Mateja Jam-
nik, and Christian Szegedy.
Autoformalization with large language models.
In Sanmi
Koyejo, S. Mohamed, A. Agarwal, Danielle Belgrave, K. Cho, and A. Oh (eds.), Advances
in Neural Information Processing Systems 35: Annual Conference on Neural Information
Processing Systems 2022, NeurIPS 2022, New Orleans, LA, USA, November 28 - December
9, 2022, 2022. URL http://papers.nips.cc/paper_files/paper/2022/hash/
d0c6bc641a56bebee9d985b937307367-Abstract-Conference.html.
Zeqiu Wu, Yushi Hu, Weijia Shi, Nouha Dziri, Alane Suhr, Prithviraj Ammanabrolu,
Noah A. Smith, Mari Ostendorf, and Hannaneh Hajishirzi.
Fine-grained human feed-
back gives better rewards for language model training.
In Alice Oh, Tristan Naumann,
Amir Globerson, Kate Saenko, Moritz Hardt, and Sergey Levine (eds.), Advances in
Neural Information Processing Systems 36:
Annual Conference on Neural Information
Processing Systems 2023, NeurIPS 2023, New Orleans, LA, USA, December 10 - 16,
2023, 2023.
URL http://papers.nips.cc/paper_files/paper/2023/hash/
b8c90b65739ae8417e61eadb521f63d5-Abstract-Conference.html.
Jing Xiong, Zixuan Li, Chuanyang Zheng, Zhijiang Guo, Yichun Yin, Enze Xie, Zhicheng Yang,
Qingxing Cao, Haiming Wang, Xiongwei Han, et al. Dq-lore: Dual queries with low rank
approximation re-ranking for in-context learning. arXiv preprint arXiv:2310.02954, 2023a.
Jing Xiong, Jianhao Shen, Ye Yuan, Haiming Wang, Yichun Yin, Zhengying Liu, Lin Li, Zhi-
jiang Guo, Qingxing Cao, Yinya Huang, Chuanyang Zheng, Xiaodan Liang, Ming Zhang, and
Qun Liu. TRIGO: benchmarking formal mathematical proof reduction for generative language
models. In Houda Bouamor, Juan Pino, and Kalika Bali (eds.), Proceedings of the 2023 Con-
ference on Empirical Methods in Natural Language Processing, EMNLP 2023, Singapore, De-
cember 6-10, 2023, pp. 11594–11632. Association for Computational Linguistics, 2023b. doi:
10.18653/V1/2023.EMNLP-MAIN.711. URL https://doi.org/10.18653/v1/2023.
emnlp-main.711.
Kaiyu Yang and Jia Deng. Learning to prove theorems via interacting with proof assistants. In
Kamalika Chaudhuri and Ruslan Salakhutdinov (eds.), Proceedings of the 36th International
Conference on Machine Learning, ICML 2019, 9-15 June 2019, Long Beach, California, USA,
volume 97 of Proceedings of Machine Learning Research, pp. 6984–6994. PMLR, 2019. URL
http://proceedings.mlr.press/v97/yang19a.html.
Kaiyu Yang, Aidan M. Swope, Alex Gu, Rahul Chalamala, Peiyang Song, Shixing Yu, Saad Godil,
Ryan J. Prenger, and Animashree Anandkumar. Leandojo: Theorem proving with retrieval-
augmented language models. In Alice Oh, Tristan Naumann, Amir Globerson, Kate Saenko, Moritz
17
Work in progress
Hardt, and Sergey Levine (eds.), Advances in Neural Information Processing Systems 36: Annual
Conference on Neural Information Processing Systems 2023, NeurIPS 2023, New Orleans, LA, USA,
December 10 - 16, 2023, 2023a. URL http://papers.nips.cc/paper_files/paper/
2023/hash/4441469427094f8873d0fecb0c4e1cee-Abstract-Datasets_
and_Benchmarks.html.
Kaiyu Yang, Aidan M. Swope, Alex Gu, Rahul Chalamala, Peiyang Song, Shixing Yu, Saad Godil,
Ryan J. Prenger, and Animashree Anandkumar. Leandojo: Theorem proving with retrieval-
augmented language models. In Alice Oh, Tristan Naumann, Amir Globerson, Kate Saenko, Moritz
Hardt, and Sergey Levine (eds.), Advances in Neural Information Processing Systems 36: Annual
Conference on Neural Information Processing Systems 2023, NeurIPS 2023, New Orleans, LA, USA,
December 10 - 16, 2023, 2023b. URL http://papers.nips.cc/paper_files/paper/
2023/hash/4441469427094f8873d0fecb0c4e1cee-Abstract-Datasets_
and_Benchmarks.html.
Yuxuan Yao, Han Wu, Zhijiang Guo, Biyan Zhou, Jiahui Gao, Sichun Luo, Hanxu Hou, Xiaojin Fu,
and Linqi Song. Learning from correctness without prompting makes llm efficient reasoner. arXiv
preprint arXiv:2403.19094, 2024.
Michihiro Yasunaga, Xinyun Chen, Yujia Li, Panupong Pasupat, Jure Leskovec, Percy Liang, Ed H.
Chi, and Denny Zhou. Large language models as analogical reasoners. CoRR, abs/2310.01714,
2023. doi: 10.48550/ARXIV.2310.01714. URL https://doi.org/10.48550/arXiv.
2310.01714.
Xi Ye and Greg Durrett. The unreliability of explanations in few-shot prompting for textual reasoning.
In Sanmi Koyejo, S. Mohamed, A. Agarwal, Danielle Belgrave, K. Cho, and A. Oh (eds.),
Advances in Neural Information Processing Systems 35: Annual Conference on Neural Information
Processing Systems 2022, NeurIPS 2022, New Orleans, LA, USA, November 28 - December
9, 2022, 2022. URL http://papers.nips.cc/paper_files/paper/2022/hash/
c402501846f9fe03e2cac015b3f0e6b1-Abstract-Conference.html.
Huaiyuan Ying, Zijian Wu, Yihan Geng, Jiayu Wang, Dahua Lin, and Kai Chen. Lean work-
book: A large-scale lean problem set formalized from natural language math problems. CoRR,
abs/2406.03847, 2024a. doi: 10.48550/ARXIV.2406.03847. URL https://doi.org/10.
48550/arXiv.2406.03847.
Huaiyuan Ying, Shuo Zhang, Linyang Li, Zhejian Zhou, Yunfan Shao, Zhaoye Fei, Yichuan Ma,
Jiawei Hong, Kuikun Liu, Ziyi Wang, Yudong Wang, Zijian Wu, Shuaibin Li, Fengzhe Zhou,
Hongwei Liu, Songyang Zhang, Wenwei Zhang, Hang Yan, Xipeng Qiu, Jiayu Wang, Kai Chen,
and Dahua Lin. Internlm-math: Open math large language models toward verifiable reasoning.
CoRR, abs/2402.06332, 2024b. doi: 10.48550/ARXIV.2402.06332. URL https://doi.org/
10.48550/arXiv.2402.06332.
Huaiyuan Ying, Shuo Zhang, Linyang Li, Zhejian Zhou, Yunfan Shao, Zhaoye Fei, Yichuan Ma,
Jiawei Hong, Kuikun Liu, Ziyi Wang, Yudong Wang, Zijian Wu, Shuaibin Li, Fengzhe Zhou,
Hongwei Liu, Songyang Zhang, Wenwei Zhang, Hang Yan, Xipeng Qiu, Jiayu Wang, Kai Chen,
and Dahua Lin. Internlm-math: Open math large language models toward verifiable reasoning.
CoRR, abs/2402.06332, 2024c. doi: 10.48550/ARXIV.2402.06332. URL https://doi.org/
10.48550/arXiv.2402.06332.
Fei Yu, Anningzhe Gao, and Benyou Wang. Outcome-supervised verifiers for planning in thematical
reasoning. CoRR, abs/2311.09724, 2023a. doi: 10.48550/ARXIV.2311.09724. URL https:
//doi.org/10.48550/arXiv.2311.09724.
Wenhao Yu, Zhihan Zhang, Zhenwen Liang, Meng Jiang, and Ashish Sabharwal. Improving language
models via plug-and-play retrieval feedback. CoRR, abs/2305.14002, 2023b. doi: 10.48550/
ARXIV.2305.14002. URL https://doi.org/10.48550/arXiv.2305.14002.
Zheng Yuan, Hongyi Yuan, Chengpeng Li, Guanting Dong, Chuanqi Tan, and Chang Zhou. Scaling re-
lationship on learning mathematical reasoning with large language models. CoRR, abs/2308.01825,
2023. doi: 10.48550/ARXIV.2308.01825. URL https://doi.org/10.48550/arXiv.
2308.01825.
18
Work in progress
Zhongshen Zeng, Yinhong Liu, Yingjia Wan, Jingyao Li, Pengguang Chen, Jianbo Dai, Yuxuan Yao,
Rongwu Xu, Zehan Qi, Wanru Zhao, Linling Shen, Jianqiao Lu, Haochen Tan, Yukang Chen,
Hao Zhang, Zhan Shi, Bailin Wang, Zhijiang Guo, and Jiaya Jia. Mr-ben: A comprehensive
meta-reasoning benchmark for large language models. CoRR, abs/2406.13975, 2024. URL
https://arxiv.org/abs/2406.13975.
Xiaokai Zhang, Na Zhu, Yiming He, Jia Zou, Qike Huang, Xiaoxiao Jin, Yanjun Guo, Chenyang
Mao, Zhe Zhu, Dengfeng Yue, Fangzhen Zhu, Yang Li, Yifan Wang, Yiwen Huang, Runan Wang,
Cheng Qin, Zhen Zeng, Shaorong Xie, Xiangfeng Luo, and Tuo Leng. Formalgeo: The first step
toward human-like imo-level geometric automated reasoning. ArXiv, abs/2310.18021, 2023. URL
https://api.semanticscholar.org/CorpusID:264555630.
Kunhao Zheng, Jesse Michael Han, and Stanislas Polu.
minif2f: a cross-system benchmark
for formal olympiad-level mathematics. In The Tenth International Conference on Learning
Representations, ICLR 2022, Virtual Event, April 25-29, 2022. OpenReview.net, 2022a. URL
https://openreview.net/forum?id=9ZPegFuFTFv.
Kunhao Zheng, Jesse Michael Han, and Stanislas Polu.
minif2f: a cross-system benchmark
for formal olympiad-level mathematics. In The Tenth International Conference on Learning
Representations, ICLR 2022, Virtual Event, April 25-29, 2022. OpenReview.net, 2022b. URL
https://openreview.net/forum?id=9ZPegFuFTFv.
Yongchao Zhou, Andrei Ioan Muresanu, Ziwen Han, Keiran Paster, Silviu Pitis, Harris Chan,
and Jimmy Ba. Large language models are human-level prompt engineers. In The Eleventh
International Conference on Learning Representations, ICLR 2023, Kigali, Rwanda, May 1-5,
2023. OpenReview.net, 2023. URL https://openreview.net/pdf?id=92gvk82DE-.
A

---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-015-conclusion
section_title: "Conclusion"
section_number: null
pages: 8-13
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
In this paper, we introduced CodeAgent, a novel
multi-agent framework that automates code re-
views.
CodeAgent leverages its novel QA-
Checker system to maintain focus on the re-
view’s objectives and ensure alignment. Our ex-
periments demonstrate CodeAgent’s effective-
ness in detecting vulnerabilities, enforcing code-
message consistency, and promoting uniform code
style. Furthermore, CodeAgent outperforms ex-
isting state-of-the-art solutions in code revision
suggestions.
By incorporating human-like con-
versational elements and considering the specific
characteristics of code review, CodeAgent sig-
nificantly improves both efficiency and accuracy.
We believe this work opens exciting new avenues
for research and collaboration practices in soft-
ware development.
Limitations
Firstly, the generalizability of the system across
different software development environments or
industries may require further validation and test-
ing. While the system has shown promising results
in the provided datasets, its applicability to other
contexts remains uncertain without additional em-
pirical evidence. This limitation suggests that the
findings may not be fully transferable to all set-
tings within the software development domain.
Secondly, the baseline test used in the study might
be insufficient. The current testing approach may
not fully capture the system’s performance, par-
ticularly in edge cases or more complex scenar-
ios. This could result in an overestimation of the
system’s capabilities and an underestimation of its
limitations. Further, more comprehensive testing
is needed to establish a more robust baseline and
to ensure that the system performs reliably across
a wider range of conditions.
Ethics Statements
This study was conducted in compliance with eth-
ical guidelines and standards for research.
The
research did not involve human participants, and
therefore, did not require informed consent or eth-
ical review from an institutional review board. All
data used in this study were publicly available, and
no personal or sensitive information was accessed
or processed. The development and evaluation of
the CodeAgent system were performed with a
focus on transparency, reproducibility, and the po-
tential positive impact on the software develop-
ment community.
References
Elif
Akata,
Lion
Schulz,
Julian
Coda-Forno,
Seong
Joon
Oh,
Matthias
Bethge,
and
Eric
Schulz. 2023.
Playing repeated games with large
language models. arXiv preprint.
Alberto Bacchelli and Christian Bird. 2013.
Expec-
tations, outcomes, and challenges of modern code
review.
In 2013 35th International Conference
on Software Engineering (ICSE), pages 712–721.
IEEE.
Amiangshu Bosu and Jeffrey C Carver. 2013. Impact
of peer code review on peer impression formation:
A survey. In 2013 ACM/IEEE International Sympo-
sium on Empirical Software Engineering and Mea-
surement, pages 133–142. IEEE.
Larissa Braz, Christian Aeberhard, Gül Çalikli, and Al-
berto Bacchelli. 2022. Less is more: supporting de-
velopers in vulnerability detection during code re-
view. In Proceedings of the 44th International Con-
ference on Software Engineering, pages 1317–1329.
Tianle Cai, Xuezhi Wang, Tengyu Ma, Xinyun Chen,
and Denny Zhou. 2023. Large language models as
tool makers. arXiv preprint.
Hyungjoo Chae, Yongho Song, Kai Tzu-iunn Ong,
Taeyoon
Kwon,
Minjin
Kim,
Youngjae
Yu,
Dongha Lee, Dongyeop Kang, and Jinyoung Yeo.
2023.
Dialogue chain-of-thought distillation for
commonsense-aware conversational agents.
arXiv
preprint arXiv:2310.09343.
Saikat Chakraborty, Rahul Krishna, Yangruibo Ding,
and Baishakhi Ray. 2021. Deep learning based vul-
nerability detection: Are we there yet? IEEE Trans-
actions on Software Engineering, 48(9):3280–3296.
Weize Chen, Yusheng Su, Jingwei Zuo, Cheng Yang,
Chenfei Yuan, Chen Qian, Chi-Min Chan, Yujia Qin,
Yaxi Lu, Ruobing Xie, et al. 2023.
Agentverse:
Facilitating multi-agent collaboration and explor-
ing emergent behaviors in agents.
arXiv preprint
arXiv:2308.10848.
Nicole Davila and Ingrid Nunes. 2021. A systematic
literature review and taxonomy of modern code re-
view. Journal of Systems and Software, 177:110951.
Victor Dibia, Adam Fourney, Gagan Bansal, Forough
Poursabzi-Sangdeh, Han Liu, and Saleema Amer-
shi. 2022.
Aligning offline metrics and human
judgments of value of ai-pair programmers. arXiv
preprint arXiv:2210.16494.
Yilun Du, Shuang Li, Antonio Torralba, Joshua B
Tenenbaum, and Igor Mordatch. 2023.
Improv-
ing factuality and reasoning in language mod-
els through multiagent debate.
arXiv preprint
arXiv:2305.14325.
Ahmed
Elgohary,
Christopher
Meek,
Matthew
Richardson,
Adam
Fourney,
Gonzalo
Ramos,
and Ahmed Hassan Awadallah. 2021.
NL-EDIT:
Correcting semantic parse errors through natural
language interaction.
In Proceedings of the 2021
Conference of the North American Chapter of the
Association for Computational Linguistics: Human
Language Technologies, pages 5599–5610, Online.
Association for Computational Linguistics.
Zhangyin Feng, Daya Guo, Duyu Tang, Nan Duan, Xi-
aocheng Feng, Ming Gong, Linjun Shou, Bing Qin,
Ting Liu, Daxin Jiang, and Ming Zhou. 2020. Code-
bert: A pre-trained model for programming and nat-
ural languages. In Findings of the Association for
Computational Linguistics: EMNLP 2020, Online
Event, 16-20 November 2020, volume EMNLP 2020
of Findings of ACL, pages 1536–1547. Association
for Computational Linguistics.
Cobus Greyling. 2023. Prompt drift and chaining.
Daya Guo, Shuo Ren, Shuai Lu, Zhangyin Feng,
Duyu Tang, Shujie Liu, Long Zhou, Nan Duan,
Alexey Svyatkovskiy, Shengyu Fu, Michele Tu-
fano, Shao Kun Deng, Colin B. Clement, Dawn
Drain, Neel Sundaresan, Jian Yin, Daxin Jiang, and
Ming Zhou. 2021.
Graphcodebert:
Pre-training
code representations with data flow. In 9th Inter-
national Conference on Learning Representations,
ICLR 2021, Virtual Event, Austria, May 3-7, 2021.
OpenReview.net.
DongGyun Han, Chaiyong Ragkhitwetsagul, Jens
Krinke, Matheus Paixao, and Giovanni Rosa. 2020.
Does code review really remove coding convention
violations? In 2020 IEEE 20th International Work-
ing Conference on Source Code Analysis and Ma-
nipulation (SCAM), pages 43–53. IEEE.
Vincent J Hellendoorn, Jason Tsay, Manisha Mukher-
jee, and Martin Hirzel. 2021. Towards automating
code review at scale.
In Proceedings of the 29th
ACM Joint Meeting on European Software Engi-
neering Conference and Symposium on the Founda-
tions of Software Engineering, pages 1479–1482.
Sirui Hong, Xiawu Zheng, Jonathan Chen, Yuheng
Cheng, Jinlin Wang, Ceyao Zhang, Zili Wang,
Steven Ka Shing Yau, Zijuan Lin, Liyang Zhou,
et al. 2023.
Metagpt:
Meta programming for
multi-agent collaborative framework. arXiv preprint
arXiv:2308.00352.
Yang Hong, Chakkrit Tantithamthavorn, Patanamon
Thongtanunam, and Aldeida Aleti. 2022.
Com-
mentfinder: a simpler, faster, more accurate code re-
view comments recommendation. In Proceedings of
the 30th ACM Joint European Software Engineering
Conference and Symposium on the Foundations of
Software Engineering, pages 507–519.
Mohammad Hossin and Md Nasir Sulaiman. 2015. A
review on evaluation metrics for data classification
evaluations. International journal of data mining &
knowledge management process, 5(2):1.
Guohao Li, Hasan Abed Al Kader Hammoud, Hani
Itani, Dmitrii Khizbullin, and Bernard Ghanem.
2023a. Camel: Communicative agents for" mind"
exploration of large scale language model society.
arXiv preprint arXiv:2303.17760.
Yuan Li, Yixuan Zhang, and Lichao Sun. 2023b.
Metaagents: Simulating interactions of human be-
haviors for llm-based task-oriented coordination via
collaborative generative agents.
arXiv preprint
arXiv:2310.06500.
Zhiyu Li, Shuai Lu, Daya Guo, Nan Duan, Shailesh
Jannu, Grant Jenks, Deep Majumder, Jared Green,
Alexey Svyatkovskiy, Shengyu Fu, et al. 2022.
Codereviewer: Pre-training for automating code re-
view activities. arXiv e-prints, pages arXiv–2203.
Tian Liang, Zhiwei He, Wenxiang Jiao, Xing Wang,
Yan Wang, Rui Wang, Yujiu Yang, Zhaopeng Tu,
and Shuming Shi. 2023.
Encouraging divergent
thinking in large language models through multi-
agent debate. arXiv preprint arXiv:2305.19118.
Junyi Lu, Lei Yu, Xiaojia Li, Li Yang, and Chun Zuo.
2023.
Llama-reviewer:
Advancing code review
automation with large language models through
parameter-efficient fine-tuning. In 2023 IEEE 34th
International Symposium on Software Reliability
Engineering (ISSRE), pages 647–658. IEEE.
Delano Oliveira, Reydne Santos, Fernanda Madeiral,
Hidehiko Masuhara, and Fernando Castor. 2023. A
systematic literature review on the impact of format-
ting elements on code legibility. Journal of Systems
and Software, 203:111728.
OPENAI. 2022. Chatgpt.
Sheena Panthaplackel, Junyi Jessy Li, Milos Glig-
oric, and Raymond J Mooney. 2021.
Deep just-
in-time inconsistency detection between comments
and source code. In Proceedings of the AAAI Con-
ference on Artificial Intelligence, volume 35, pages
427–435.
Joon Sung Park, Joseph O’Brien, Carrie Jun Cai,
Meredith Ringel Morris, Percy Liang, and Michael S
Bernstein. 2023. Generative agents: Interactive sim-
ulacra of human behavior.
In Proceedings of the
36th Annual ACM Symposium on User Interface
Software and Technology, pages 1–22.
Chen Qian, Xin Cong, Cheng Yang, Weize Chen,
Yusheng Su, Juyuan Xu, Zhiyuan Liu, and Maosong
Sun. 2023. Communicative agents for software de-
velopment. arXiv preprint arXiv:2307.07924.
Jing Kai Siow, Cuiyun Gao, Lingling Fan, Sen Chen,
and Yang Liu. 2020.
Core: Automating review
recommendation for code changes. In 2020 IEEE
27th International Conference on Software Analysis,
Evolution and Reengineering (SANER), pages 284–
295. IEEE.
Miroslaw Staron, Mirosław Ochodek, Wilhelm Med-
ing, and Ola Söder. 2020. Using machine learning
to identify code fragments for manual review.
In
2020 46th Euromicro Conference on Software Engi-
neering and Advanced Applications (SEAA), pages
513–516. IEEE.
Yashar Talebirad and Amirhossein Nadiri. 2023.
Multi-agent collaboration: Harnessing the power of
intelligent llm agents.
Xunzhu Tang, Zhenghan Chen, Kisub Kim, Haoye
Tian,
Saad Ezzini,
and Jacques Klein. 2023.
Just-in-time security patch detection–llm at the
rescue for data augmentation.
arXiv preprint
arXiv:2312.01241.
Patanamon Thongtanunam, Chanathip Pornprasit, and
Chakkrit Tantithamthavorn. 2022.
Autotransform:
Automated code transformation to support modern
code review process.
In Proceedings of the 44th
international conference on software engineering,
pages 237–248.
Haoye Tian, Weiqi Lu, Tsz On Li, Xunzhu Tang,
Shing-Chi Cheung, Jacques Klein, and Tegawendé F
Bissyandé. 2023. Is chatgpt the ultimate program-
ming assistant–how far is it?
arXiv preprint
arXiv:2304.11938.
Haoye Tian, Xunzhu Tang, Andrew Habib, Shang-
wen Wang, Kui Liu, Xin Xia, Jacques Klein, and
Tegawendé F Bissyandé. 2022. Is this change the
answer to that problem? correlating descriptions of
bug and code changes for evaluating patch correct-
ness. arXiv preprint arXiv:2208.04125.
Rosalia Tufano,
Simone Masiero,
Antonio Mas-
tropaolo, Luca Pascarella, Denys Poshyvanyk, and
Gabriele Bavota. 2022. Using pre-trained models to
boost code review automation.
In Proceedings of
the 44th International Conference on Software En-
gineering, pages 2291–2302.
Rosalia Tufano, Luca Pascarella, Michele Tufano,
Denys Poshyvanyk, and Gabriele Bavota. 2021. To-
wards automating code review activities. In 2021
IEEE/ACM 43rd International Conference on Soft-
ware Engineering (ICSE), pages 163–174. IEEE.
Yue Wang, Weishi Wang, Shafiq R. Joty, and Steven
C. H. Hoi. 2021. Codet5: Identifier-aware unified
pre-trained encoder-decoder models for code under-
standing and generation. In Proceedings of the 2021
Conference on Empirical Methods in Natural Lan-
guage Processing, EMNLP 2021, Virtual Event /
Punta Cana, Dominican Republic, 7-11 November,
2021, pages 8696–8708. Association for Computa-
tional Linguistics.
Zhenhailong Wang, Shaoguang Mao, Wenshan Wu,
Tao Ge, Furu Wei, and Heng Ji. 2023.
Unleash-
ing cognitive synergy in large language models:
A task-solving agent through multi-persona self-
collaboration. arXiv preprint arXiv:2307.05300.
Cody Watson, Nathan Cooper, David Nader Palacio,
Kevin Moran, and Denys Poshyvanyk. 2022. A sys-
tematic literature review on the use of deep learn-
ing in software engineering research. ACM Trans-
actions on Software Engineering and Methodology
(TOSEM), 31(2):1–58.
Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten
Bosma, Fei Xia, Ed Chi, Quoc V Le, Denny Zhou,
et al. 2022.
Chain-of-thought prompting elicits
reasoning in large language models.
Advances in
Neural Information Processing Systems, 35:24824–
24837.
Jimmy Wei, Kurt Shuster, Arthur Szlam, Jason Weston,
Jack Urbanek, and Mojtaba Komeili. 2023. Multi-
party chat: Conversational agents in group settings
with humans and models. arXiv preprint.
Zhiheng Xi, Wenxiang Chen, Xin Guo, Wei He, Yiwen
Ding, Boyang Hong, Ming Zhang, Junzhe Wang,
Senjie Jin, Enyu Zhou, et al. 2023.
The rise and
potential of large language model based agents: A
survey. arXiv preprint arXiv:2309.07864.
Aidan ZH Yang, Haoye Tian, He Ye, Ruben Mar-
tins, and Claire Le Goues. 2024a. Security vulnera-
bility detection with multitask self-instructed fine-
tuning of large language models.
arXiv preprint
arXiv:2406.05892.
Boyang Yang, Haoye Tian, Weiguo Pian, Haoran Yu,
Haitao Wang, Jacques Klein, Tegawendé F Bis-
syandé, and Shunfu Jin. 2024b.
Cref:
an llm-
based conversational software repair framework for
programming tutors.
In Proceedings of the 33rd
ACM SIGSOFT International Symposium on Soft-
ware Testing and Analysis, pages 882–894.
Xiaoyu Yang, Jie Lu, and En Yu. 2024c.
Adapt-
ing multi-modal large language model to concept
drift in the long-tailed open world. arXiv preprint
arXiv:2405.13459.
Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak
Shafran, Karthik Narasimhan, and Yuan Cao. 2022.
React: Synergizing reasoning and acting in language
models. arXiv preprint.
Hongxin Zhang, Weihua Du, Jiaming Shan, Qinhong
Zhou, Yilun Du, Joshua B Tenenbaum, Tianmin
Shu, and Chuang Gan. 2023.
Building coopera-
tive embodied agents modularly with large language
models. arXiv preprint.
Mengxi Zhang, Huaxiao Liu, Chunyang Chen, Yuzhou
Liu, and Shuotong Bai. 2022.
Consistent or not?
an investigation of using pull request template in
github.
Information and Software Technology,
144:106797.
Yuntong Zhang, Haifeng Ruan, Zhiyu Fan, and Ab-
hik Roychoudhury. 2024.
Autocoderover:
Au-
tonomous program improvement.
arXiv preprint
arXiv:2404.05427.
Jonathan Zheng, Alan Ritter, and Wei Xu. 2024.
Neo-bench:
Evaluating robustness of large lan-
guage models with neologisms.
arXiv preprint
arXiv:2402.12261.
Xin Zhou, Kisub Kim, Bowen Xu, DongGyun Han,
Junda He, and David Lo. 2023. Generation-based
code review automation: How far are we?
arXiv
preprint arXiv:2303.07221.
Contents (Appendix)

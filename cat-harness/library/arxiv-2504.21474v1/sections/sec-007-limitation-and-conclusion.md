---
doc_id: arxiv-2504.21474v1
doc_title: "Homa at SemEval-2025 Task 5: Aligning Librarian Records with OntoAligner for Subject Tagging"
section_id: sec-007-limitation-and-conclusion
section_title: "Limitation and Conclusion"
section_number: null
pages: 5-7
source_pdf: 2504.21474v1.pdf
source_sha256: 68a09fcd43927e7a
toc_source: outline
---
The quantitative evaluation results in Table 2 indi-
cate that, despite achieving a strong average recall
of 20.30%, the model struggles with low preci-
sion. The low precision suggests that the system re-
trieves a broad set of candidate subjects, but many
are not relevant. However, this is also evident in
qualitative results for case-2 where the precision
didn’t reach the same level as recall. This limita-
tion likely stems from the small fine-tuning dataset,
suggesting that further fine-tuning could enhance
performance, particularly for smaller LLMs. Ad-
ditionally, OntoAligner’s flexibility allows rapid
pipeline construction by handling embedding stor-
age, subject retrieval, and alignment efficiently.
This enables users to focus solely on optimizing the
LLM and retriever models, making it practical for
subject indexing with minimal resource demands.
In this work, we explored OntoAligner as a case
study for subject indexing, demonstrating its capa-
bility with minimal fine-tuning. The results high-
light its effectiveness in aligning subjects, reinforc-
ing its potential for real-world applications. How-
ever, further fine-tuning with additional computa-
tional resources and data is necessary to enhance its
precision and overall performance for the subject
indexing task.
Acknowledgments
The last author of this work is supported by the
TIB - Leibniz Information Centre for Science and
Technology, and the SCINEXT project (BMBF,
German Federal Ministry of Education and Re-
search, Grant ID: 01lS22070).
References
Hamed Babaei Giglou, Jennifer D’Souza, Felix Engel,
and Sören Auer. 2025. Llms4om: Matching ontolo-
gies with large language models. In The Seman-
tic Web: ESWC 2024 Satellite Events, pages 25–35,
Cham. Springer Nature Switzerland.
Yupeng Chang, Xu Wang, Jindong Wang, Yuan Wu,
Linyi Yang, Kaijie Zhu, Hao Chen, Xiaoyuan Yi,
Cunxiang Wang, Yidong Wang, et al. 2024. A sur-
vey on evaluation of large language models. ACM
transactions on intelligent systems and technology,
15(3):1–45.
Christopher Cox and Elias Tzoc. 2023. Chatgpt: Impli-
cations for academic libraries. College & research
libraries news, 84(3):99.
Tim Dettmers, Artidoro Pagnoni, Ari Holtzman, and
Luke Zettlemoyer. 2023. Qlora: Efficient finetuning
of quantized llms. Advances in neural information
processing systems, 36:10088–10115.
Jennifer D’Souza, Sameer Sadruddin, Holger Is-
rael, Mathias Begoin, and Diana Slawig. 2025a.
LLMs4Subjects 2025: Large Language Models for
Subject Tagging. Accessed: 2025-02-21.
Jennifer D’Souza, Sameer Sadruddin, Holger Israel,
Mathias Begoin, and Diana Slawig. 2025b. Semeval-
2025 task 5: Llms4subjects - llm-based automated
subject tagging for a national technical library’s open-
access catalog. In Proceedings of the 19th Interna-
tional Workshop on Semantic Evaluation (SemEval-
2025), pages 1082–1095, Vienna, Austria. Associa-
tion for Computational Linguistics.
German National Library. 2025. Gemeinsame Norm-
datei (GND). Accessed: 2025-02-21.
Michalis Gerolimos. 2013. Tagging for libraries: A
review of the effectiveness of tagging systems for
library catalogs.
Journal of Library Metadata,
13(1):36–58.
Hamed Babaei Giglou, Jennifer D’Souza, Oliver Karras,
and Sören Auer. 2025a. Ontoaligner: A comprehen-
sive modular and robust python toolkit for ontology
alignment.
Hamed Babaei Giglou, Jennifer D’Souza, Oliver Karras,
and Sören Auer. 2025b. Ontoaligner: A comprehen-
sive modular and robust python toolkit for ontology
alignment. Preprint, arXiv:2503.21902.
Hamed Babaei Giglou,
Mostafa Rahgouy,
Jen-
nifer D’Souza, Milad Molazadeh, Hadi Bayrami
Asl Tekanlou Oskuee, and Cheryl D Seals. 2023.
Leveraging large language models with multiple loss
learners for few-shot author profiling. Working Notes
of CLEF.
Matthew Henderson, Rami Al-Rfou, Brian Strope, Yun-
Hsuan Sung, László Lukács, Ruiqi Guo, Sanjiv Ku-
mar, Balint Miklos, and Ray Kurzweil. 2017. Effi-
cient natural language response suggestion for smart
reply. arXiv preprint arXiv:1705.00652.
Enkelejda Kasneci, Kathrin Seßler, Stefan Küchemann,
Maria Bannert, Daryna Dementieva, Frank Fischer,
Urs Gasser, Georg Groh, Stephan Günnemann, Eyke
Hüllermeier, et al. 2023. Chatgpt for good? on op-
portunities and challenges of large language models
for education. Learning and individual differences,
103:102274.
Jacob Köhler, Stephan Philippi, Michael Specht, and
Alexander Rüegg. 2006. Ontology based text index-
ing and querying for the semantic web. Knowledge-
Based Systems, 19(8):744–754.
Ilya Loshchilov and Frank Hutter. 2017.
Decou-
pled weight decay regularization. arXiv preprint
arXiv:1711.05101.
Goutam Majumder, Partha Pakray, Alexander Gelbukh,
and David Pinto. 2016. Semantic textual similarity
methods, tools, and applications: A survey. Com-
putación y Sistemas, 20(4):647–665.
Dongyun Ni. 2010. Subject cataloging and social tag-
ging in library systems. Journal of Library and In-
formation Science, 36(1):4–15.
Zach Nussbaum, John X. Morris, Brandon Duderstadt,
and Andriy Mulyar. 2024. Nomic embed: Training a
reproducible long context text embedder. Preprint,
arXiv:2402.01613.
Carrie Pirmann. 2012. Tags in the catalogue: Insights
from a usability study of librarything for libraries.
Library Trends, 61(1):234–247.
Nils Reimers and Iryna Gurevych. 2019. Sentence-bert:
Sentence embeddings using siamese bert-networks.
In Proceedings of the 2019 Conference on Empirical
Methods in Natural Language Processing. Associa-
tion for Computational Linguistics.
Peter J. Rolla. 2009. User tags versus subject headings:
Can user-supplied data improve subject access to
library collections? Library Resources & Technical
Services, 53(3):174–184.
An Yang, Baosong Yang, Beichen Zhang, Binyuan Hui,
Bo Zheng, Bowen Yu, Chengyuan Li, Dayiheng Liu,
Fei Huang, Haoran Wei, Huan Lin, Jian Yang, Jian-
hong Tu, Jianwei Zhang, Jianxin Yang, Jiaxi Yang,
Jingren Zhou, Junyang Lin, Kai Dang, Keming Lu,
Keqin Bao, Kexin Yang, Le Yu, Mei Li, Mingfeng
Xue, Pei Zhang, Qin Zhu, Rui Men, Runji Lin, Tian-
hao Li, Tingyu Xia, Xingzhang Ren, Xuancheng
Ren, Yang Fan, Yang Su, Yichang Zhang, Yu Wan,
Yuqiong Liu, Zeyu Cui, Zhenru Zhang, and Zihan
Qiu. 2024. Qwen2.5 technical report. arXiv preprint
arXiv:2412.15115.

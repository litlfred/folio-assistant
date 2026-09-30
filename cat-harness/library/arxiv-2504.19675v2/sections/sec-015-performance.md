---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-015-performance
section_title: "Performance"
section_number: null
pages: 6-7
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
Annif, particularly when augmented with large lan-
guage models (LLMs) for data preparation. By
leveraging traditional XMTC algorithms such as
Omikuji Bonsai, MLLM, and XTransformer, and
enhancing them with LLM-generated synthetic
data and translations, we demonstrated competi-
tive results across multiple categories. While this
task focused only on the resulting quality of the
subject indexing, we note that the computational
requirements, energy consumption and processing
latency of traditional ML approaches are modest in
comparison to LLMs.
Acknowledgments
The authors wish to thank the Finnish Computing
Competence Infrastructure (FCCI) for supporting
this project with computational and data storage
resources. The authors thank the University of
Helsinki Scientific Computing Services staff for all
the support and assistance they gave for using the
HPC environment. We thank ZBW, Leibniz Infor-
mation Centre for Economics, for contributing the
integration of XTransformer with Annif, and DNB
for their valuable insight on its hyperparameters.
9In earlier experiments, we have been able to achieve
F1@5 scores above 0.5 for some data sets that have been
consistently indexed with good quality subject metadata.
Finally, we thank TIB for organising this task that
provided valuable insights and opportunities for
comparing methods and techniques.
References
Jennifer D’Souza, Sameer Sadruddin, Holger Israel,
Mathias Begoin, and Diana Slawig. 2024. The Se-
mEval 2025 LLMs4Subjects shared task dataset.
Jennifer D’Souza, Sameer Sadruddin, Holger Israel,
Mathias Begoin, and Diana Slawig. 2025. SemEval-
2025 task 5: LLMs4Subjects - LLM-based auto-
mated subject tagging for a national technical li-
brary’s open-access catalog. In Proceedings of the
19th International Workshop on Semantic Evaluation
(SemEval-2025), pages 1082–1095, Vienna, Austria.
Association for Computational Linguistics.
T. J. Kao Eric H. C. Chow and Xiaoli Li. 2024. An
experiment with the use of ChatGPT for LCSH sub-
ject assignment on electronic theses and dissertations.
Cataloging & Classification Quarterly, 62(5):574–
588.
Aaron Grattafiori, Abhimanyu Dubey, Abhinav Jauhri,
Abhinav Pandey, Abhishek Kadian, Ahmad Al-
Dahle, Aiesha Letman, Akhil Mathur, Alan Schelten,
Alex Vaughan, et al. 2024. The Llama 3 herd of
models. Preprint, arXiv:2407.21783.
Kalervo Järvelin and Jaana Kekäläinen. 2002. Cumu-
lated gain-based evaluation of IR techniques. ACM
Trans. Inf. Syst., 20(4):422–446.
Sujay Khandagale, Han Xiao, and Rohit Babbar.
2020.
Bonsai: Diverse and shallow trees for ex-
treme multi-label classification. Machine Learning,
109(11):2099–2119.
Sugabsen Martins. 2024. Artificial intelligence-assisted
classification of library resources: The case of Claude
AI. Library Philosophy and Practice, 8159.
Olena Medelyan. 2009. Human-competitive automatic
topic indexing.
Ph.D. thesis, The University of
Waikato.
Yashoteja Prabhu, Anil Kag, Shrutendra Harsola, Rahul
Agrawal, and Manik Varma. 2018. Parabel: Par-
titioned label trees for extreme classification with
application to dynamic search advertising. WWW
’18, page 993–1002, Republic and Canton of Geneva,
CHE. International World Wide Web Conferences
Steering Committee.
Osma Suominen, Juho Inkinen, and Mona Lehtinen.
2022.
Annif and Finto AI: Developing and im-
plementing automated subject indexing.
JLIS.it,
13(1):265–282.
Hsiang-Fu Yu, Kai Zhong, Jiong Zhang, Wei-Cheng
Chang, and Inderjit S. Dhillon. 2022. PECOS: Pre-
diction for enormous and correlated output spaces.
Preprint, arXiv:2010.05878.
A

---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-020-conclusion
section_title: "Conclusion"
section_number: null
pages: 17-27
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Whilst the general capability of LLMs has grown rapidly [3, 4, 5], assessing their performance
on public health specific knowledge, tasks, and free text is an important prerequisite for
successful real-world applications. In this work we take a first step towards evaluating and
understanding the applicability of LLMs to public health via a broad range of automated
LLM evaluations on representative tasks and anonymised or synthetic free-text.
Our initial results suggest that LLMs may already be useful tools to support public health
experts extract information from a wide variety of free text sources. This ability in turn can
potentially support and scale public health surveillance, intervention, and research activities.
We note that while some LLMs can process public health related text with a relatively
high degree of accuracy, there is variable performance between models and across tasks.
Appropriate validation is essential for any task, because even highly capable models can
generate labels or extract data that do not match the prompt author’s intentions. Some
real-world applications are also likely to need assessments of context specific risks for a
given LLM, task, and dataset combination, as well as approaches to testing known limitations
such as output fragility or bias.
Future research is needed particularly to understand LLMs’ applicability to more complex
long form public health generation tasks, as well as evaluate the performance of fine-tuned
domain or task specific LLMs. We also aim to continue extending public health automated
evaluations for novel types of tasks and data, as well as new LLMs.
Acknowledgements
This work was enabled by UKHSA HPC Cloud & DevOps Technology colleagues developing
and maintaining internal HPC resources. We would also like to thank our UKHSA colleagues
in Clinical and Public Health for their support and expertise in developing this work.
Ethical Considerations
To avoid potential detrimental impacts of text processing on individuals, we employ only
public, synthetic, or anonymous data, with some datasets spanning multiple categories. We
17
also prioritise research on less sensitive data sources and lower risk tasks, especially in
comparison to others in healthcare settings.
It is important to mitigate potential risks within public health text processing in order to
avoid errors causing harm to individuals or communities. In this paper we have provided
initial results to assist researchers in understanding potential LLM performance on public
health tasks. This assessment is important, because it helps set out the potential opportunities
to use LLMs to generate public health insight and support public health action; however,
future application should be done with sufficient mitigation measures in place.
In terms of mitigation, for real-world deployments it is imperative that any LLM-based
software be evaluated within its specific context. The results reported herein are not sufficient
to endorse the deployment of software for these public health tasks, without in-context
assessments. For further discussion of these issues and other wider evaluation that is
important to consider for real-world deployments see Sec. 6.1.3.
18
References
[1] Wayne Xin Zhao, Kun Zhou, Junyi Li, Tianyi Tang, Xiaolei Wang, Yupeng Hou, Yingqian
Min, Beichen Zhang, Junjie Zhang, Zican Dong, Yifan Du, Chen Yang, Yushuo Chen, Zhipeng
Chen, Jinhao Jiang, Ruiyang Ren, Yifan Li, Xinyu Tang, Zikang Liu, Peiyu Liu, Jian-Yun Nie,
and Ji-Rong Wen. A survey of large language models. arXiv preprint arXiv:2303.18223, 2023.
[2] Jean Kaddour, Joshua Harris, Maximilian Mozes, Herbie Bradley, Roberta Raileanu, and
Robert McHardy. Challenges and applications of large language models. arXiv preprint
arXiv:2307.10169, 2023.
[3] Sébastien Bubeck, Varun Chandrasekaran, Ronen Eldan, Johannes Gehrke, Eric Horvitz, Ece
Kamar, Peter Lee, Yin Tat Lee, Yuanzhi Li, Scott Lundberg, Harsha Nori, Hamid Palangi,
Marco Tulio Ribeiro, and Yi Zhang. Sparks of artificial general intelligence: Early experiments
with gpt-4. arXiv preprint arXiv:2303.12712, 2023.
[4] OpenAI. Gpt-4 technical report. arXiv preprint arXiv:2303.08774, 2023.
[5] Karan Singhal, Tao Tu, Juraj Gottweis, Rory Sayres, Ellery Wulczyn, Le Hou, Kevin Clark,
Stephen Pfohl, Heather Cole-Lewis, Darlene Neal, et al. Towards expert-level medical question
answering with large language models. arXiv preprint arXiv:2305.09617, 2023.
[6] Tyna Eloundou, Sam Manning, Pamela Mishkin, and Daniel Rock. Gpts are gpts: An early look
at the labor market impact potential of large language models. arXiv preprint arXiv:2303.10130,
2023.
[7] UKHSA. Ukhsa advisory board - artificial intelligence discovery exercise, 2023. UKHSA
Advisory Board: Artificial Intelligence Discovery Exercise, Accessed: 09/05/2024.
[8] CDC. Artificial Intelligence and Machine Learning | Technologies | CDC — cdc.gov, 2023.
Artificial Intelligence and Machine Learning: Applying Advanced Tools for Public Health,
Accessed: 15/05/2024.
[9] Oliver Baclic, Matthew Tunis, Kelsey Young, Coraline Doan, Howard Swerdfeger, and Justin
Schonfeld. Artificial intelligence in public health: Challenges and opportunities for public
health made possible by advances in natural language processing. Canada Communicable
Disease Report, 46(6):161, 2020.
[10] Xuanzhong Chen, Xiaohao Mao, Qihan Guo, Lun Wang, Shuyang Zhang, and Ting Chen.
Rarebench: Can llms serve as rare diseases specialists? arXiv preprint arXiv:2402.06341,
2024.
[11] Hanjie Chen, Zhouxiang Fang, Yash Singla, and Mark Dredze. Benchmarking large lan-
guage models on answering and explaining challenging medical questions. arXiv preprint
arXiv:2402.18060, 2024.
[12] Qianqian Xie, Weiguang Han, Zhengyu Chen, Ruoyu Xiang, Xiao Zhang, Yueru He, Mengxi
Xiao, Dong Li, Yongfu Dai, Duanyu Feng, Yijing Xu, Haoqiang Kang, Ziyan Kuang, Chenhan
Yuan, Kailai Yang, Zheheng Luo, Tianlin Zhang, Zhiwei Liu, Guojun Xiong, Zhiyang Deng,
Yuechen Jiang, Zhiyuan Yao, Haohang Li, Yangyang Yu, Gang Hu, Jiajia Huang, Xiao-
Yang Liu, Alejandro Lopez-Lira, Benyou Wang, Yanzhao Lai, Hao Wang, Min Peng, Sophia
Ananiadou, and Jimin Huang. The finben: An holistic financial benchmark for large language
models. arXiv preprint arXiv:2402.12659, 2024.
[13] Zhiwei Fei, Xiaoyu Shen, Dawei Zhu, Fengzhe Zhou, Zhuo Han, Songyang Zhang, Kai Chen,
Zongwen Shen, and Jidong Ge. Lawbench: Benchmarking legal knowledge of large language
models. arXiv preprint arXiv:2309.16289, 2023.
[14] Stanford University. Holistic evaluation of langauge models results page, 2024. HELM:
A reproducible and transparent framework for evaluating foundation models., Accessed:
15/05/2024.
19
[15] Yupeng Chang, Xu Wang, Jindong Wang, Yuan Wu, Linyi Yang, Kaijie Zhu, Hao Chen,
Xiaoyuan Yi, Cunxiang Wang, Yidong Wang, Wei Ye, Yue Zhang, Yi Chang, Philip S. Yu,
Qiang Yang, and Xing Xie. A survey on evaluation of large language models. arXiv preprint
arXiv:2307.03109, 2023.
[16] Lianmin Zheng, Wei-Lin Chiang, Ying Sheng, Siyuan Zhuang, Zhanghao Wu, Yonghao
Zhuang, Zi Lin, Zhuohan Li, Dacheng Li, Eric P. Xing, Hao Zhang, Joseph E. Gonzalez,
and Ion Stoica. Judging llm-as-a-judge with mt-bench and chatbot arena. arXiv preprint
arXiv:2306.05685, 2023.
[17] Jamil S Samaan, Yee Hui Yeo, Nithya Rajeev, Lauren Hawley, Stuart Abel, Wee Han Ng,
Nitin Srinivasan, Justin Park, Miguel Burch, Rabindra Watson, et al. Assessing the accuracy
of responses by the language model chatgpt to questions regarding bariatric surgery. Obesity
surgery, 33(6):1790–1796, 2023.
[18] C-EA Winslow. The untilled fields of public health. Science, 51(1306):23–33, 1920.
[19] Göran Dahlgren and Margaret Whitehead. Policies and strategies to promote social equity.
Health Institute of Future Studies, Stockholm, 1991.
[20] Margaret Whitehead. The concepts and principles of equity and health. International journal
of health services, 22(3):429–445, 1992.
[21] David A Ross, Peter G Smith, and Richard H Morrow. Chapter 2 Types of Intervention and
Their Development. Oxford University Press, 2015.
[22] Effy Vayena, Joan Dzenowagis, John S Brownstein, and Aziz Sheikh. Policy implications of
big data in the health sector. Bulletin of the World Health Organization, 96(1):66, 2018.
[23] Theo Vos, Stephen S Lim, Cristiana Abbafati, Kaja M Abbas, Mohammad Abbasi, Mitra
Abbasifard, Mohsen Abbasi-Kangevari, Hedayat Abbastabar, Foad Abd-Allah, Ahmed Ab-
delalim, et al. Global burden of 369 diseases and injuries in 204 countries and territories,
1990–2019: a systematic analysis for the global burden of disease study 2019. The lancet, 396
(10258):1204–1222, 2020.
[24] Peter Nsubuga, Mark E White, Stephen B Thacker, Mark A Anderson, Stephen B Blount,
Claire V Broome, Tom M Chiller, Victoria Espitia, Rubina Imtiaz, Dan Sosin, et al. Public
health surveillance: a tool for targeting and monitoring interventions. 2011.
[25] WHO. Action plan for the prevention and control of noncommunicable diseases in the who
european region 2016–2025, 2016.
[26] UN General Assembly. Political declaration of the third high-level meeting of the general
assembly on the prevention and control of non-communicable diseases. Resolution adopted by
the General Assembly October, 2018.
[27] Rezarta Islamaj Do˘gan, Robert Leaman, and Zhiyong Lu. Ncbi disease corpus: a resource for
disease name recognition and concept normalization. Journal of biomedical informatics, 47:
1–10, 2014.
[28] Monica Agrawal, Stefan Hegselmann, Hunter Lang, Yoon Kim, and David Sontag. Large
language models are few-shot clinical information extractors. arXiv preprint arXiv:2205.12689,
2022.
[29] Karel D’Oosterlinck, François Remy, Johannes Deleu, Thomas Demeester, Chris Develder,
Klim Zaporojets, Aneiss Ghodsi, Simon Ellershaw, Jack Collins, and Christopher Potts. Biodex:
Large-scale biomedical adverse drug event extraction for real-world pharmacovigilance. arXiv
preprint arXiv:2305.13395, 2023.
[30] Cathy Shyr, Yan Hu, Paul A. Harris, and Hua Xu. Identifying and extracting rare disease
phenotypes with large language models. arXiv preprint arXiv:2306.12656, 2023.
[31] Yelp. Yelp open dataset, 2023. Yelp Open Dataset - An all-purpose dataset for learning.
20
[32] International Classification of Diseases Tenth Revision (ICD-10). World Health Organization,
Geneva, 2019. International Statistical Classification of Diseases and Related Health Problems
10th Revision.
[33] GDELT. Gdelt project. GDELT Project - Watching Our World Unfold.
[34] Dan Hendrycks, Collin Burns, Steven Basart, Andy Zou, Mantas Mazeika, Dawn Song, and
Jacob Steinhardt. Measuring massive multitask language understanding, 2021.
[35] Aryo Pradipta Gema, Joshua Ong Jun Leang, Giwon Hong, Alessio Devoto, Alberto
Carlo Maria Mancino, Rohit Saxena, Xuanli He, Yu Zhao, Xiaotang Du, Mohammad
Reza Ghasemi Madani, Claire Barale, Robert McHardy, Joshua Harris, Jean Kaddour,
Emile van Krieken, and Pasquale Minervini.
Are we done with mmlu?, 2024.
URL
https://arxiv.org/abs/2406.04127.
[36] Christopher JL Murray, Aleksandr Y Aravkin, Peng Zheng, Cristiana Abbafati, Kaja M Abbas,
Mohsen Abbasi-Kangevari, Foad Abd-Allah, Ahmed Abdelalim, Mohammad Abdollahi,
Ibrahim Abdollahpour, et al. Global burden of 87 risk factors in 204 countries and territories,
1990–2019: a systematic analysis for the global burden of disease study 2019. The lancet, 396
(10258):1223–1249, 2020.
[37] Michael A McGeehin, Judith R Qualters, and Amanda Sue Niskar. National environmen-
tal public health tracking program: bridging the information gap. Environmental Health
Perspectives, 112(14):1409–1413, 2004.
[38] who. Global action plan for the prevention and control of noncommunicable diseases 2013–
2020. World Health Organization, 102, 2013.
[39] Stephen Martin, James Lomas, and Karl Claxton. Is an ounce of prevention worth a pound
of cure? a cross-sectional study of the impact of english public health grant on mortality and
morbidity. BMJ open, 10(10):e036411, 2020.
[40] Chris Whitty, Gregor Smith, Frank Atherton, Michael McBride, Patrick Vallance, Jenny
Harries, Stephen Powis, Jonathan Van-Tam, Nicola Steedman, Graham Ellis, Marion Bain,
Lourda Geoghegan, Naresh Chada, Chris Jones, Aidan Fowler, and Thomas Waite. Technical
report on the covid-19 pandemic in the uk, 2022. Technical report on the COVID-19 pandemic
in the UK, Accessed: 17/04/2024.
[41] OpenAI, 2024. OpenAI developer platform.
[42] UKHSA. Mpox: contact tracing, 2023. Mpox: contact tracing - Classification of contacts and
follow-up advice for non-HCID strains of mpox., Accessed: 17/04/2024.
[43] Pam Sonnenberg, Soazig Clifton, Simon Beddows, Nigel Field, Kate Soldan, Clare Tanton,
Catherine H Mercer, Filomeno Coelho Da Silva, Sarah Alexander, Andrew J Copas, et al.
Prevalence, risk factors, and uptake of interventions for sexually transmitted infections in
britain: findings from the national surveys of sexual attitudes and lifestyles (natsal). The
Lancet, 382(9907):1795–1806, 2013.
[44] Colin Raffel, Noam Shazeer, Adam Roberts, Katherine Lee, Sharan Narang, Michael Matena,
Yanqi Zhou, Wei Li, and Peter J. Liu. Exploring the limits of transfer learning with a unified
text-to-text transformer, 2023.
[45] Hugo Touvron, Louis Martin, Kevin Stone, Peter Albert, Amjad Almahairi, Yasmine Babaei,
Nikolay Bashlykov, Soumya Batra, Prajjwal Bhargava, Shruti Bhosale, Dan Bikel, Lukas
Blecher, Cristian Canton Ferrer, Moya Chen, Guillem Cucurull, David Esiobu, Jude Fernandes,
Jeremy Fu, Wenyin Fu, Brian Fuller, Cynthia Gao, Vedanuj Goswami, Naman Goyal, Anthony
Hartshorn, Saghar Hosseini, Rui Hou, Hakan Inan, Marcin Kardas, Viktor Kerkez, Madian
Khabsa, Isabel Kloumann, Artem Korenev, Punit Singh Koura, Marie-Anne Lachaux, Thibaut
Lavril, Jenya Lee, Diana Liskovich, Yinghai Lu, Yuning Mao, Xavier Martinet, Todor Mi-
haylov, Pushkar Mishra, Igor Molybog, Yixin Nie, Andrew Poulton, Jeremy Reizenstein, Rashi
21
Rungta, Kalyan Saladi, Alan Schelten, Ruan Silva, Eric Michael Smith, Ranjan Subramanian,
Xiaoqing Ellen Tan, Binh Tang, Ross Taylor, Adina Williams, Jian Xiang Kuan, Puxin Xu,
Zheng Yan, Iliyan Zarov, Yuchen Zhang, Angela Fan, Melanie Kambadur, Sharan Narang,
Aurelien Rodriguez, Robert Stojnic, Sergey Edunov, and Thomas Scialom. Llama 2: Open
foundation and fine-tuned chat models, 2023.
[46] Victoria Ng, Erin E Rees, Jingcheng Niu, Abdelhamid Zaghool, Homeira Ghiasbeglou, and
Adrian Verster. Application of natural language processing algorithms for extracting informa-
tion from news articles in event-based surveillance. Canada Communicable Disease Report=
Releve des Maladies Transmissibles au Canada, 46(6):186–191, 2020.
[47] Konstantin Stadler. The country converter coco - a python package for converting country
names between different classification schemes. Journal of Open Source Software, 2(16):332,
2017. doi: 10.21105/joss.00332. URL https://doi.org/10.21105/joss.00332.
[48] European Food Safety Authority (EFSA). The food classification and description system
foodex 2 (revision 2). Technical report, Wiley Online Library, 2015.
[49] Nicola Fortune, Richard Madden, Therese Riley, and Stephanie Short. The international
classification of health interventions: an ‘epistemic hub’for use in public health. Health
promotion international, 36(6):1753–1764, 2021.
[50] Alba Mendez-Brito, Charbel El Bcheraoui, and Francisco Pozo-Martin. Systematic review
of empirical studies comparing the effectiveness of non-pharmaceutical interventions against
covid-19. Journal of Infection, 83(3):281–293, 2021.
[51] Shan Chen, Yingya Li, Sheng Lu, Hoang Van, Hugo J W L Aerts, Guergana K Savova, and
Danielle S Bitterman. Evaluating the chatgpt family of models for biomedical reasoning
and classification. Journal of the American Medical Informatics Association, 31(4):940–948,
January 2024. ISSN 1527-974X. doi: 10.1093/jamia/ocad256. URL http://dx.doi.
org/10.1093/jamia/ocad256.
[52] Bei Yu, Yingya Li, and Jun Wang. Detecting causal language use in science findings. In Pro-
ceedings of the 2019 Conference on Empirical Methods in Natural Language Processing and
the 9th International Joint Conference on Natural Language Processing (EMNLP-IJCNLP),
pages 4656–4666, 2019. URL https://www.aclweb.org/anthology/D19-1473.
pdf.
[53] Yingya Li, Jun Wang, and Bei Yu. Detecting health advice in medical research literature. In
Proceedings of EMNLP’2021, 2021.
[54] Qiao Jin, Bhuwan Dhingra, Zhengping Liu, William W. Cohen, and Xinghua Lu. Pubmedqa:
A dataset for biomedical research question answering, 2019.
[55] Hyung Won Chung, Le Hou, Shayne Longpre, Barret Zoph, Yi Tay, William Fedus, Yunxuan
Li, Xuezhi Wang, Mostafa Dehghani, Siddhartha Brahma, Albert Webson, Shixiang Shane Gu,
Zhuyun Dai, Mirac Suzgun, Xinyun Chen, Aakanksha Chowdhery, Alex Castro-Ros, Marie
Pellat, Kevin Robinson, Dasha Valter, Sharan Narang, Gaurav Mishra, Adams Yu, Vincent
Zhao, Yanping Huang, Andrew Dai, Hongkun Yu, Slav Petrov, Ed H. Chi, Jeff Dean, Jacob
Devlin, Adam Roberts, Denny Zhou, Quoc V. Le, and Jason Wei. Scaling instruction-finetuned
language models, 2022. URL https://arxiv.org/abs/2210.11416.
[56] Albert Q. Jiang, Alexandre Sablayrolles, Arthur Mensch, Chris Bamford, Devendra Singh
Chaplot, Diego de las Casas, Florian Bressand, Gianna Lengyel, Guillaume Lample, Lucile
Saulnier, Lélio Renard Lavaud, Marie-Anne Lachaux, Pierre Stock, Teven Le Scao, Thibaut
Lavril, Thomas Wang, Timothée Lacroix, and William El Sayed. Mistral 7b, 2023.
[57] Dakota Mahan, Ryan Carlow, Louis Castricato, Nathan Cooper, and Christian Laforte. Stable
beluga models, 2024. StableBeluga2.
[58] AI@Meta. Llama 3 model card. 2024. Llama 3 Model Card.
22
[59] Meta. Introducing llama 3.1: Our most capable models to date, 2024. Introducing Llama 3.1:
Our most capable models to date, Accessed: 02/01/2025.
[60] Meta. Llama 3.3 model card, 2024. Llama 3.3 Model Information, Accessed: 02/01/2025.
[61] Gemma Team, Morgane Riviere, Shreya Pathak, Pier Giuseppe Sessa, Cassidy Hardin, Surya
Bhupatiraju, Léonard Hussenot, Thomas Mesnard, Bobak Shahriari, Alexandre Ramé, Johan
Ferret, Peter Liu, Pouya Tafti, Abe Friesen, Michelle Casbon, Sabela Ramos, Ravin Kumar,
Charline Le Lan, Sammy Jerome, Anton Tsitsulin, Nino Vieillard, Piotr Stanczyk, Sertan
Girgin, Nikola Momchev, Matt Hoffman, Shantanu Thakoor, Jean-Bastien Grill, Behnam
Neyshabur, Olivier Bachem, Alanna Walton, Aliaksei Severyn, Alicia Parrish, Aliya Ahmad,
Allen Hutchison, Alvin Abdagic, Amanda Carl, Amy Shen, Andy Brock, Andy Coenen,
Anthony Laforge, Antonia Paterson, Ben Bastian, Bilal Piot, Bo Wu, Brandon Royal, Char-
lie Chen, Chintu Kumar, Chris Perry, Chris Welty, Christopher A. Choquette-Choo, Danila
Sinopalnikov, David Weinberger, Dimple Vijaykumar, Dominika Rogozi´nska, Dustin Herbi-
son, Elisa Bandy, Emma Wang, Eric Noland, Erica Moreira, Evan Senter, Evgenii Eltyshev,
Francesco Visin, Gabriel Rasskin, Gary Wei, Glenn Cameron, Gus Martins, Hadi Hashemi,
Hanna Klimczak-Pluci´nska, Harleen Batra, Harsh Dhand, Ivan Nardini, Jacinda Mein, Jack
Zhou, James Svensson, Jeff Stanway, Jetha Chan, Jin Peng Zhou, Joana Carrasqueira, Joana Il-
jazi, Jocelyn Becker, Joe Fernandez, Joost van Amersfoort, Josh Gordon, Josh Lipschultz, Josh
Newlan, Ju yeong Ji, Kareem Mohamed, Kartikeya Badola, Kat Black, Katie Millican, Keelin
McDonell, Kelvin Nguyen, Kiranbir Sodhia, Kish Greene, Lars Lowe Sjoesund, Lauren Usui,
Laurent Sifre, Lena Heuermann, Leticia Lago, Lilly McNealus, Livio Baldini Soares, Logan
Kilpatrick, Lucas Dixon, Luciano Martins, Machel Reid, Manvinder Singh, Mark Iverson, Mar-
tin Görner, Mat Velloso, Mateo Wirth, Matt Davidow, Matt Miller, Matthew Rahtz, Matthew
Watson, Meg Risdal, Mehran Kazemi, Michael Moynihan, Ming Zhang, Minsuk Kahng,
Minwoo Park, Mofi Rahman, Mohit Khatwani, Natalie Dao, Nenshad Bardoliwalla, Nesh
Devanathan, Neta Dumai, Nilay Chauhan, Oscar Wahltinez, Pankil Botarda, Parker Barnes,
Paul Barham, Paul Michel, Pengchong Jin, Petko Georgiev, Phil Culliton, Pradeep Kuppala,
Ramona Comanescu, Ramona Merhej, Reena Jana, Reza Ardeshir Rokni, Rishabh Agarwal,
Ryan Mullins, Samaneh Saadat, Sara Mc Carthy, Sarah Cogan, Sarah Perrin, Sébastien M. R.
Arnold, Sebastian Krause, Shengyang Dai, Shruti Garg, Shruti Sheth, Sue Ronstrom, Susan
Chan, Timothy Jordan, Ting Yu, Tom Eccles, Tom Hennigan, Tomas Kocisky, Tulsee Doshi,
Vihan Jain, Vikas Yadav, Vilobh Meshram, Vishal Dharmadhikari, Warren Barkley, Wei Wei,
Wenming Ye, Woohyun Han, Woosuk Kwon, Xiang Xu, Zhe Shen, Zhitao Gong, Zichuan Wei,
Victor Cotruta, Phoebe Kirk, Anand Rao, Minh Giang, Ludovic Peran, Tris Warkentin, Eli
Collins, Joelle Barral, Zoubin Ghahramani, Raia Hadsell, D. Sculley, Jeanine Banks, Anca
Dragan, Slav Petrov, Oriol Vinyals, Jeff Dean, Demis Hassabis, Koray Kavukcuoglu, Clement
Farabet, Elena Buchatskaya, Sebastian Borgeaud, Noah Fiedel, Armand Joulin, Kathleen
Kenealy, Robert Dadashi, and Alek Andreev. Gemma 2: Improving open language models at a
practical size, 2024. URL https://arxiv.org/abs/2408.00118.
[62] Cohere For AI. c4ai-command-r-08-2024, 2024. URL https://huggingface.co/
CohereForAI/c4ai-command-r-08-2024.
[63] Hugging Face. Hugging face model respository, 2024. Hugging Face.
[64] Thomas Wolf, Lysandre Debut, Victor Sanh, Julien Chaumond, Clement Delangue, Anthony
Moi, Pierric Cistac, Tim Rault, Rémi Louf, Morgan Funtowicz, Joe Davison, Sam Shleifer,
Patrick von Platen, Clara Ma, Yacine Jernite, Julien Plu, Canwen Xu, Teven Le Scao, Syl-
vain Gugger, Mariama Drame, Quentin Lhoest, and Alexander M. Rush. Huggingface’s
transformers: State-of-the-art natural language processing, 2020.
[65] Woosuk Kwon, Zhuohan Li, Siyuan Zhuang, Ying Sheng, Lianmin Zheng, Cody Hao Yu,
Joseph E. Gonzalez, Hao Zhang, and Ion Stoica. Efficient memory management for large
language model serving with pagedattention. In Proceedings of the ACM SIGOPS 29th
Symposium on Operating Systems Principles, 2023.
[66] Wei Huang, Xudong Ma, Haotong Qin, Xingyu Zheng, Chengtao Lv, Hong Chen, Jie Luo,
23
Xiaojuan Qi, Xianglong Liu, and Michele Magno. How good are low-bit quantized llama3
models? an empirical study, 2024.
[67] Ji Lin, Jiaming Tang, Haotian Tang, Shang Yang, Wei-Ming Chen, Wei-Chen Wang, Guangx-
uan Xiao, Xingyu Dang, Chuang Gan, and Song Han. Awq: Activation-aware weight quan-
tization for llm compression and acceleration, 2024. URL https://arxiv.org/abs/
2306.00978.
[68] Jingqing Zhang, Kai Sun, Akshay Jagadeesh, Mahta Ghahfarokhi, Deepa Gupta, Ashok Gupta,
Vibhor Gupta, and Yike Guo. The potential and pitfalls of using a large language model such
as chatgpt or gpt-4 as a clinical assistant, 2023.
[69] Aleksa Bisercic, Mladen Nikolic, Mihaela van der Schaar, Boris Delibasic, Pietro Lio, and
Andrija Petrovic. Interpretable medical diagnostics with structured data extraction by large
language models, 2023.
[70] Yuting Guo, Anthony Ovadje, Mohammed Ali Al-Garadi, and Abeed Sarker. Evaluating large
language models for health-related text classification tasks with public social media data, 2024.
[71] Yeganeh Madadi, Mohammad Delsoz, Priscilla A. Lao, Joseph W. Fong, TJ Hollingsworth,
Malik Y. Kahook, and Siamak Yousefi. Chatgpt assisting diagnosis of neuro-ophthalmology
diseases based on case reports, 2023.
[72] Tiffany H. Kung, Morgan Cheatham, Arielle Medenilla, Czarina Sillos, Lorie De Leon, Camille
Elepaño, Maria Madriaga, Rimel Aggabao, Giezel Diaz-Candido, James Maningo, and Victor
Tseng. Performance of chatgpt on usmle: Potential for ai-assisted medical education using
large language models. PLOS Digital Health, 2(2):1–12, 02 2023. doi: 10.1371/journal.pdig.
0000198. URL https://doi.org/10.1371/journal.pdig.0000198.
[73] Valentin Liévin, Christoffer Egeberg Hother, and Ole Winther. Can large language models
reason about medical questions? arXiv preprint arXiv:2207.08143, 2022.
[74] Karan Singhal, Shekoofeh Azizi, Tao Tu, S. Sara Mahdavi, Jason Wei, Hyung Won Chung,
Nathan Scales, Ajay Tanwani, Heather Cole-Lewis, Stephen Pfohl, Perry Payne, Martin
Seneviratne, Paul Gamble, Chris Kelly, Nathaneal Scharli, Aakanksha Chowdhery, Philip
Mansfield, Blaise Aguera y Arcas, Dale Webster, Greg S. Corrado, Yossi Matias, Katherine
Chou, Juraj Gottweis, Nenad Tomasev, Yun Liu, Alvin Rajkomar, Joelle Barral, Christopher
Semturs, Alan Karthikesalingam, and Vivek Natarajan. Large language models encode clinical
knowledge, 2022. URL https://arxiv.org/abs/2212.13138.
[75] Zeming Chen, Alejandro Hernández Cano, Angelika Romanou, Antoine Bonnet, Kyle Matoba,
Francesco Salvi, Matteo Pagliardini, Simin Fan, Andreas Köpf, Amirkeivan Mohtashami,
Alexandre Sallinen, Alireza Sakhaeirad, Vinitra Swamy, Igor Krawczuk, Deniz Bayazit,
Axel Marmet, Syrielle Montariol, Mary-Anne Hartley, Martin Jaggi, and Antoine Bosselut.
Meditron-70b: Scaling medical pretraining for large language models, 2023.
[76] Michael Bommarito II and Daniel Martin Katz. Gpt takes the bar exam. arXiv preprint
arXiv:2212.14402, 2022.
[77] Daniel Martin Katz, Michael James Bommarito, Shang Gao, and Pablo Arredondo. Gpt-4
passes the bar exam. Available at SSRN 4389233, 2023.
[78] Arun James Thirunavukarasu, Refaat Hassan, Shathar Mahmood, Rohan Sanghera, Kara
Barzangi, Mohanned El Mukashfi, and Sachin Shah. Trialling a large language model (chatgpt)
in general practice with the applied knowledge test: Observational study demonstrating
opportunities and limitations in primary care. JMIR Medical Education, 9:e46599, Apr 2023.
ISSN 2369-3762. doi: 10.2196/46599. URL http://dx.doi.org/10.2196/46599.
[79] Jillian Bommarito, Michael Bommarito, Daniel Martin Katz, and Jessica Katz. Gpt as knowl-
edge worker: A zero-shot evaluation of (ai) cpa capabilities. arXiv preprint arXiv:2301.04408,
2023.
24
[80] Jonathan H Choi, Kristin E Hickman, Amy Monahan, and Daniel Schwarcz. Chatgpt goes to
law school. Available at SSRN, 2023.
[81] Raj Sanjay Shah, Kunal Chawla, Dheeraj Eidnani, Agam Shah, Wendi Du, Sudheer Chava, Na-
traj Raman, Charese Smiley, Jiaao Chen, and Diyi Yang. When flue meets flang: Benchmarks
and large pre-trained language model for financial domain, 2022.
[82] Taicheng Guo, Kehan Guo, Bozhao Nan, Zhenwen Liang, Zhichun Guo, Nitesh V. Chawla,
Olaf Wiest, and Xiangliang Zhang. What can large language models do in chemistry? a
comprehensive benchmark on eight tasks, 2023.
[83] Xi Chen, MingKe You, Li Wang, WeiZhi Liu, Yu Fu, Jie Xu, Shaoting Zhang, Gang Chen,
Kang Li, and Jian Li. Evaluating and enhancing large language models performance in
domain-specific medicine: Osteoarthritis management with docoa, 2024.
[84] Zhuo Wang, Rongzhen Li, Bowen Dong, Jie Wang, Xiuxing Li, Ning Liu, Chenhui Mao, Wei
Zhang, Liling Dong, Jing Gao, and Jianyong Wang. Can llms like gpt-4 outperform traditional
ai tools in dementia diagnosis? maybe, but not today, 2023.
[85] Dat Duong and Benjamin D Solomon. Analysis of large-language model versus human
performance for genetics questions. European Journal of Human Genetics, pages 1–3, 2023.
[86] Jaromir Savelka, Kevin D. Ashley, Morgan A. Gray, Hannes Westermann, and Huihui Xu.
Explaining legal concepts with augmented large language models (gpt-4), 2023.
[87] Andrew Blair-Stanek, Nils Holzenberger, and Benjamin Van Durme. Can gpt-3 perform
statutory reasoning? arXiv preprint arXiv:2302.06100, 2023.
[88] Fangyi Yu, Lee Quartey, and Frank Schilder. Legal prompting: Teaching a language model to
think like a lawyer. arXiv preprint arXiv:2212.01326, 2022.
[89] Liyan Tang, Zhaoyi Sun, Betina Idnay, Jordan G Nestor, Ali Soroush, Pierre A Elias, Ziyang
Xu, Ying Ding, Greg Durrett, Justin F Rousseau, et al. Evaluating large language models on
medical evidence summarization. npj Digital Medicine, 6(1):158, 2023.
[90] Tanya Goyal, Junyi Jessy Li, and Greg Durrett. News summarization and evaluation in the era
of gpt-3. arXiv preprint arXiv:2209.12356, 2022.
[91] Qingyu Chen, Jingcheng Du, Yan Hu, Vipina Kuttichi Keloth, Xueqing Peng, Kalpana Raja,
Rui Zhang, Zhiyong Lu, and Hua Xu. Large language models in biomedical natural language
processing: benchmarks, baselines, and recommendations, 2024.
[92] Chin-Yew Lin. Rouge: A package for automatic evaluation of summaries. In Text summariza-
tion branches out, pages 74–81, 2004.
[93] Chantal Shaib, Millicent L Li, Sebastian Joseph, Iain J Marshall, Junyi Jessy Li, and Byron C
Wallace. Summarizing, simplifying, and synthesizing medical evidence using gpt-3 (with
varying success). arXiv preprint arXiv:2305.06299, 2023.
[94] Yushi Bai, Jiahao Ying, Yixin Cao, Xin Lv, Yuze He, Xiaozhi Wang, Jifan Yu, Kaisheng Zeng,
Yijia Xiao, Haozhe Lyu, Jiayin Zhang, Juanzi Li, and Lei Hou. Benchmarking foundation
models with language-model-as-an-examiner, 2023.
[95] Cheng-Han Chiang and Hung yi Lee. Can large language models be an alternative to human
evaluations?, 2023.
[96] Alicia Parrish, Angelica Chen, Nikita Nangia, Vishakh Padmakumar, Jason Phang, Jana
Thompson, Phu Mon Htut, and Samuel Bowman. BBQ: A hand-built bias benchmark for
question answering. In Smaranda Muresan, Preslav Nakov, and Aline Villavicencio, editors,
Findings of the Association for Computational Linguistics: ACL 2022, pages 2086–2105,
Dublin, Ireland, May 2022. Association for Computational Linguistics. doi: 10.18653/v1/2022.
findings-acl.165. URL https://aclanthology.org/2022.findings-acl.165.
25
[97] Anthropic. Claude 3 model family. Introducing the next generation of Claude, Accessed:
23/04/2024.
[98] Ross Taylor, Marcin Kardas, Guillem Cucurull, Thomas Scialom, Anthony Hartshorn, Elvis
Saravia, Andrew Poulton, Viktor Kerkez, and Robert Stojnic. Galactica: A large language
model for science. arXiv preprint arXiv:2211.09085, 2022.
[99] Gemini Team. Gemini: A family of highly capable multimodal models, 2024.
[100] Lucas Dixon, John Li, Jeffrey Sorensen, Nithum Thain, and Lucy Vasserman. Measuring and
mitigating unintended bias in text classification. 2018.
[101] Isabel O. Gallegos, Ryan A. Rossi, Joe Barrow, Md Mehrab Tanjim, Sungchul Kim, Franck
Dernoncourt, Tong Yu, Ruiyi Zhang, and Nesreen K. Ahmed. Bias and fairness in large
language models: A survey. arXiv preprint arXiv:2309.00770, 2024.
[102] UK Government. Equality act 2010, 2010. Equality Act.
[103] UKHSA. Ukhsa’s approach to delivering health equity for health security, 2023. UKHSA
Advisory Board: UKHSA’s approach to delivering health equity for health security, Accessed:
09/05/2024.
[104] Claudia Martínez-deMiguel, Isabel Segura-Bedmar, Esteban Chacón-Solano, and Sara
Guerrero-Aspizua. The raredis corpus: a corpus annotated with rare diseases, their signs
and symptoms. arXiv preprint arXiv:2108.01204, 2021.
[105] Sungrim Moon, Serguei Pakhomov, Nathan Liu, James O Ryan, and Genevieve B Melton.
A sense inventory for clinical abbreviations and acronyms created using clinical notes and
medical dictionary resources. Journal of the American Medical Informatics Association, 21(2):
299–307, 2014.
[106] Xiang Yue, Yuansheng Ni, Kai Zhang, Tianyu Zheng, Ruoqi Liu, Ge Zhang, Samuel Stevens,
Dongfu Jiang, Weiming Ren, Yuxuan Sun, Cong Wei, Botao Yu, Ruibin Yuan, Renliang Sun,
Ming Yin, Boyuan Zheng, Zhenzhu Yang, Yibo Liu, Wenhao Huang, Huan Sun, Yu Su, and
Wenhu Chen. Mmmu: A massive multi-discipline multimodal understanding and reasoning
benchmark for expert agi. arXiv preprint arXiv:2311.16502, 2023.
26
6

---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-028-conclusion
section_title: "Conclusion"
section_number: null
pages: 25-30
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
CaMeL is a practical defense to prompt injection achieving security not through model training
techniques but through principled system design around language models. Our approach effectively
solves the AgentDojo benchmark while providing strong guarantees against unintended actions and
data exfiltration.
Our approach is not perfect and does not completely address every potential attack vector. We know
this because we have chosen to design a defense, instead of hoping that the defense will be learned
from data. This makes it possible to precisely study the interaction between the defense components
and reuse past experience from software security to reason about potential vulnerabilities. In future
work we hope to develop methods that further address limitations of the current design.
Importantly, CaMeL remains compatible with other defenses that make the language model itself
more robust. Even if someone were to develop a technique that significantly enhanced a model’s
robustness to prompt injection, it would still be possible to obtain a stronger security argument
through combining it with CaMeL.
Broadly we believe that “security engineering” mindset will be useful to areas of language model
security beyond just prompt injection. While it would be clearly preferable to have a single robust
model that was able to address the many safety and security requirements of modern models in all
possible settings, achieving this may not be immediately practical. Instead, we have shown that it is
possible to design a system around an untrusted model that makes the whole system robust even if
the model itself is not. We see potential for similar approaches to be taken to other areas, and hope
that future work will continue in this direction.
Acknowledgements
We want to thank Sharon Lin for technical feedback. We also want to thank Daniel Ramage, Octavian
Suciu, Sahra Ghalebikesabi, Borja Balle, Lily Tsai, Eugene Bagdasarian, Jacint Szabo, Vijay Bolina,
Harsh Chaudhari, Santiago Diaz, Javier Rando, Yury Kartynnik for engagement during project
25
Defeating Prompt Injections by Design
development. F.T. acknowledges the support of Schmidt Sciences.
Contributions
I.S. came up with the original idea and wrote the technical design proposal, T.F. organised the student
internship proposal; J.H., C.S., N.C., C.K., T.F. gave very early feedback on the proposal; E.D. led the
technical development; E.D., I.S. co-led the design of CaMeL, with close help of J.H. and T.F; I.S. and
T.F. did reviews for the codebase; T.F. with help of D.F. led the technical and administrative efforts
ensuring that everything runs smoothly; A.T., N.C., D.F., C.K., C.S., F.T. provided multiple rounds of
very helpful comments and feedback; everyone contributed to the development of the manuscript,
with most input from E.D. and I.S.
26
Defeating Prompt Injections by Design
References
Abadi, Martín, Mihai Budiu, Ulfar Erlingsson, and Jay Ligatti (2009). “Control-flow integrity principles,
implementations, and applications”. In: ACM Transactions on Information and System Security
(TISSEC).
Abdelnabi, Sahar, Aideen Fay, Giovanni Cherubin, Ahmed Salem, Mario Fritz, and Andrew Paverd
(2024). “Are you still on track!? Catching LLM Task Drift with Activations”. In: arXiv preprint
arXiv:2406.00799.
Abdelnabi, Sahar, Amr Gomaa, Eugene Bagdasarian, Per Ola Kristensson, and Reza Shokri (2025).
“Firewalls to Secure Dynamic LLM Agentic Networks”. In: arXiv preprint arXiv:2502.01822.
US-AISI (2025). Technical Blog: Strengthening AI Agent Hijacking Evaluations.
Aleph One (1996). “Smashing The Stack For Fun And Profit”. In: Phrack Magazine.
Anderson, Ross, Frank Stajano, and Jong-Hyeon Lee (2002). “Security policies”. In: Advances in
Computers.
Anderson, Ross J (2010). Security engineering: a guide to building dependable distributed systems.
Anthropic (2024). The Claude 3 Model Family: Opus, Sonnet, Haiku.
– (2025). Mitigate jailbreaks and prompt injections.
Bagdasaryan, Eugene, Ren Yi, Sahra Ghalebikesabi, Peter Kairouz, Marco Gruteser, Sewoong Oh,
Borja Balle, and Daniel Ramage (2024). “Air Gap: Protecting Privacy-Conscious Conversational
Agents”. In: arXiv preprint arXiv:2405.05175.
Cao, Weicheng, Chunqiu Xia, Sai Teja Peddinti, David Lie, Nina Taft, and Lisa M. Austin (2021). “A
Large Scale Study of User Behavior, Expectations and Engagement with Android Permissions”. In:
30th USENIX Security Symposium (USENIX Security 21).
Carlini, Nicholas, Milad Nasr, Christopher A. Choquette-Choo, Matthew Jagielski, Irena Gao, Pang Wei
Koh, Daphne Ippolito, Florian Tramèr, and Ludwig Schmidt (2023). “Are aligned neural networks
adversarially aligned?” In: Thirty-seventh Conference on Neural Information Processing Systems.
Carlini, Nicholas and David Wagner (2014). “ROP is still dangerous: Breaking modern defenses”. In:
23rd USENIX Security Symposium (USENIX Security 14).
Chen, Sizhe, Julien Piet, Chawin Sitawarin, and David Wagner (2024). “StruQ: Defending against
prompt injection with structured queries”. In: arXiv preprint arXiv:2402.06363.
Colvin, Samuel, Eric Jolibois, Hasan Ramezani, Adrian Garcia Badaracco, Terrence Dorsey, David
Montague, Serge Matveenko, Marcelo Trylesinski, Sydney Runkle, David Hewitt, Alex Hall, and
Victorien Plot (Jan. 23, 2025). Pydantic. (Visited on 06/25/2024).
Costa, Manuel, Boris Köpf, Aashish Kolluri, Andrew Paverd, Mark Russinovich, Ahmed Salem, Shruti
Tople, Lukas Wutschitz, and Santiago Zanella-Béguelin (2025). “Securing AI Agents with Information-
Flow Control”. In: arXiv preprint arXiv:2505.23643.
Debenedetti, Edoardo, Javier Rando, Daniel Paleka, Silaghi Fineas Florin, Dragos Albastroiu, Niv
Cohen, Yuval Lemberg, Reshmi Ghosh, Rui Wen, Ahmed Salem, et al. (2024a). “Dataset and Lessons
Learned from the 2024 SaTML LLM Capture-the-Flag Competition”. In: Thirty-Eighth Conference
on Neural Information Processing Systems Datasets and Benchmarks Track.
Debenedetti, Edoardo, Jie Zhang, Mislav Balunović, Luca Beurer-Kellner, Marc Fischer, and Florian
Tramèr (2024b). “AgentDojo: A Dynamic Environment to Evaluate Attacks and Defenses for
LLM Agents”. In: Thirty-Eighth Conference on Neural Information Processing Systems Datasets and
Benchmarks Track.
Denning, Dorothy E (1976). “A lattice model of secure information flow”. In: Communications of the
ACM.
Denning, Dorothy E. and Peter J. Denning (1977). “Certification of programs for secure information
flow”. In: Commun. ACM.
Dubey, Abhimanyu et al. (2024). The Llama 3 Herd of Models. arXiv: 2407.21783.
27
Defeating Prompt Injections by Design
Felt, Adrienne Porter, Elizabeth Ha, Serge Egelman, Ariel Haney, Erika Chin, and David Wagner
(2012). “Android permissions: user attention, comprehension, and behavior”. In: Proceedings of the
Eighth Symposium on Usable Privacy and Security.
Gao, Luyu, Aman Madaan, Shuyan Zhou, Uri Alon, Pengfei Liu, Yiming Yang, Jamie Callan, and
Graham Neubig (2023). “PAL: Program-aided language models”. In: International Conference on
Machine Learning. PMLR.
Gemini-Team (2024). Gemini 1.5: Unlocking multimodal understanding across millions of tokens of
context. arXiv: 2403.05530.
Ghalebikesabi, Sahra, Eugene Bagdasaryan, Ren Yi, Itay Yona, Ilia Shumailov, Aneesh Pappu, Chongyang
Shi, Laura Weidinger, Robert Stanforth, Leonard Berrada, et al. (2024). “Operationalizing contextual
integrity in privacy-conscious assistants”. In: arXiv preprint arXiv:2408.02373.
Glukhov, David, Ziwen Han, Ilia Shumailov, Vardan Papyan, and Nicolas Papernot (2025). “Breach
By A Thousand Leaks: Unsafe Information Leakage in “Safe” AI Responses”. In: The Thirteenth
International Conference on Learning Representations.
Goodside, Riley (2022). Exploiting GPT-3 prompts with malicious inputs that order the model to ignore
its previous directions.
Greshake, Kai, Sahar Abdelnabi, Shailesh Mishra, Christoph Endres, Thorsten Holz, and Mario
Fritz (Nov. 2023). “Not What You’ve Signed Up For: Compromising Real-World LLM-Integrated
Applications with Indirect Prompt Injection”. In: Proceedings of the 16th ACM Workshop on Artificial
Intelligence and Security.
Gudka, Khilan, Robert N.M. Watson, Jonathan Anderson, David Chisnall, Brooks Davis, Ben Laurie, Ilias
Marinos, Peter G. Neumann, and Alex Richardson (2015). “Clean Application Compartmentalization
with SOAAP”. In: Proceedings of the 22nd ACM SIGSAC Conference on Computer and Communications
Security.
Hines, Keegan, Gary Lopez, Matthew Hall, Federico Zarfati, Yonatan Zunger, and Emre Kiciman
(2024). “Defending Against Indirect Prompt Injection Attacks With Spotlighting”. In: arXiv preprint
arXiv:2403.14720.
Jones, Erik, Anca Dragan, and Jacob Steinhardt (2024). Adversaries Can Misuse Combinations of Safe
Models. arXiv: 2406.14595.
Kim, Juhee, Woohyuk Choi, and Byoungyoung Lee (2025). “Prompt flow integrity to prevent privilege
escalation in llm agents”. In: arXiv preprint arXiv:2503.15547.
Learn Prompting (2024). Sandwich Defense.
Li, Evan, Tushin Mallick, Evan Rose, William Robertson, Alina Oprea, and Cristina Nita-Rotaru (2025).
“ACE: A Security Architecture for LLM-Integrated App Systems”. In: arXiv preprint arXiv:2504.20984.
Lu, Pan, Baolin Peng, Hao Cheng, Michel Galley, Kai-Wei Chang, Ying Nian Wu, Song-Chun Zhu, and
Jianfeng Gao (2024). “Chameleon: Plug-and-play compositional reasoning with large language
models”. In: Advances in Neural Information Processing Systems.
McMahan, H. Brendan, Eider Moore, Daniel Ramage, Seth Hampson, and Blaise Agüera y Arcas (2023).
Communication-Efficient Learning of Deep Networks from Decentralized Data. arXiv: 1602.05629.
Morgan, Andrew G. (2013). libcap: POSIX capabilities support for Linux.
Myers, Andrew C. and Barbara Liskov (1997). “A decentralized model for information flow control”.
In: Proceedings of the Sixteenth ACM Symposium on Operating Systems Principles.
Nakano, Reiichiro, Jacob Hilton, Suchir Balaji, Jeff Wu, Long Ouyang, Christina Kim, Christopher
Hesse, Shantanu Jain, Vineet Kosaraju, William Saunders, et al. (2021). “WebGPT: Browser-assisted
question-answering with human feedback”. In: arXiv preprint arXiv:2112.09332.
Needham, Roger M and Robin DH Walker (1977). “The Cambridge CAP computer and its protection
system”. In: ACM SIGOPS Operating Systems Review.
28
Defeating Prompt Injections by Design
Nestaas, Fredrik, Edoardo Debenedetti, and Florian Tramèr (2025). “Adversarial Search Engine
Optimization for Large Language Models”. In: The Thirteenth International Conference on Learning
Representations.
OpenAI (2022). tiktoken: Fast BPE tokeniser for use with OpenAI’s models. url: https://github.
com/openai/tiktoken.
– (2024). GPT-4o mini: advancing cost-efficient intelligence.
– (2025). Ignore untrusted data by default.
OpenAI et al. (2024). GPT-4 Technical Report. arXiv: 2303.08774. url: https://arxiv.org/
abs/2303.08774.
Pasquini, Dario, Martin Strohmeier, and Carmela Troncoso (2024). Neural Exec: Learning (and Learning
from) Execution Triggers for Prompt Injection Attacks. arXiv: 2403.03792.
Perez, Fábio and Ian Ribeiro (2022). “Ignore previous prompt: Attack techniques for language models”.
In: arXiv preprint arXiv:2211.09527.
Ponemon-Institute (2022). Cost Of Insider Threats Global Report.
PricewaterhouseCoopers (2018). Audit Committee update: Insider Threat.
ProtectAI (2024). Fine-Tuned DeBERTa-v3-base for Prompt Injection Detection. https://huggingface.
co/ProtectAI/deberta-v3-base-prompt-injection-v2.
Qin, Yujia, Shihao Liang, Yining Ye, Kunlun Zhu, Lan Yan, Yaxi Lu, Yankai Lin, Xin Cong, Xiangru Tang,
Bill Qian, et al. (2023). “ToolLLM: Facilitating large language models to master 16000+ real-world
APIs”. In: arXiv preprint arXiv:2307.16789.
Rehberger, Johann (2024). Embrace The Red Blog.
RSM UK Consulting LLP for UK DSIT (2025). CHERI adoption and diffusion research.
Sabelfeld, Andrei and Andrew C Myers (2003). “Language-based information-flow security”. In: IEEE
Journal on selected areas in communications.
Schick, Timo, Jane Dwivedi-Yu, Roberto Dessi, Roberta Raileanu, Maria Lomeli, Eric Hambro, Luke
Zettlemoyer, Nicola Cancedda, and Thomas Scialom (2023). “ToolFormer: Language Models Can
Teach Themselves to Use Tools”. In: Thirty-seventh Conference on Neural Information Processing
Systems.
AI-Security-Team, Aneesh Pappu, Andreas Terzis, Chongyang Shi, Gena Gibson, Ilia Shumailov, Itay
Yona, Jamie Hayes, John Flynn, Juliette Pluto, Sharon Lin, and Shuang Song (2025). How we
estimate the risk from prompt injection attacks on AI systems.
Shacham, Hovav (2007). “The geometry of innocent flesh on the bone: return-into-libc without func-
tion calls (on the x86)”. In: Proceedings of the 14th ACM Conference on Computer and Communications
Security.
Sharma, Reshabh K, Vinayak Gupta, and Dan Grossman (2024). “SPML: A DSL for Defending Language
Models Against Prompt Attacks”. In: arXiv preprint arXiv:2402.11755.
Shen, Yongliang, Kaitao Song, Xu Tan, Dongsheng Li, Weiming Lu, and Yueting Zhuang (2024).
“HuggingGPT: Solving AI tasks with ChatGPT and its friends in Hugging Face”. In: Advances in
Neural Information Processing Systems.
Shi, Tianneng, Jingxuan He, Zhun Wang, Linyu Wu, Hongwei Li, Wenbo Guo, and Dawn Song (2025).
“Progent: Programmable Privilege Control for LLM Agents”. In: arXiv preprint arXiv:2504.11703.
Thoppilan, Romal, Daniel De Freitas, Jamie Hall, Noam Shazeer, Apoorv Kulshreshtha, Heng-Tze
Cheng, Alicia Jin, Taylor Bos, Leslie Baker, Yu Du, et al. (2022). “LaMDA: Language models for
dialog applications”. In: arXiv preprint arXiv:2201.08239.
Wallace, Eric, Kai Xiao, Reimar Leike, Lilian Weng, Johannes Heidecke, and Alex Beutel (2024).
“The instruction hierarchy: Training llms to prioritize privileged instructions”. In: arXiv preprint
arXiv:2404.13208.
29
Defeating Prompt Injections by Design
Wang, Weizhi, Li Dong, Hao Cheng, Xiaodong Liu, Xifeng Yan, Jianfeng Gao, and Furu Wei (2024).
“Augmenting language models with long-term memory”. In: Advances in Neural Information Process-
ing Systems.
Watson, Robert NM, Jonathan Anderson, Ben Laurie, and Kris Kennaway (2010). “Capsicum: Practical
Capabilities for UNIX”. In: 19th USENIX Security Symposium (USENIX Security 10).
Watson, Robert NM, Jonathan Woodruff, Peter G Neumann, Simon W Moore, Jonathan Anderson,
David Chisnall, Nirav Dave, Brooks Davis, Khilan Gudka, Ben Laurie, et al. (2015). “CHERI: A
hybrid capability-system architecture for scalable software compartmentalization”. In: 2015 IEEE
Symposium on Security and Privacy. IEEE.
Willison, Simon (2023). The Dual LLM pattern for building AI assistants that can resist prompt injection.
Woodruff, Jonathan, Robert NM Watson, David Chisnall, Simon W Moore, Jonathan Anderson, Brooks
Davis, Ben Laurie, Peter G Neumann, Robert Norton, and Michael Roe (2014). “The CHERI capability
model: Revisiting RISC in an age of risk”. In: ACM SIGARCH Computer Architecture News.
Wooldridge, Michael and Nicholas R Jennings (1995). “Intelligent agents: Theory and practice”. In:
The knowledge engineering review.
Wu, Fangzhou, Ethan Cecchetti, and Chaowei Xiao (2024). “System-Level Defense against In-
direct Prompt Injection Attacks: An Information Flow Control Perspective”. In: arXiv preprint
arXiv:2409.19091.
Wu, Tong, Shujian Zhang, Kaiqiang Song, Silei Xu, Sanqiang Zhao, Ravi Agrawal, Sathish Reddy
Indurthi, Chong Xiang, Prateek Mittal, and Wenxuan Zhou (2024). “Instructional Segment Embed-
ding: Improving LLM Safety with Instruction Hierarchy”. In: arXiv preprint arXiv:2410.09102.
Wu, Yuhao, Franziska Roesner, Tadayoshi Kohno, Ning Zhang, and Umar Iqbal (2025). “IsolateGPT:
An Execution Isolation Architecture for LLM-Based Agentic Systems”. In: Network and Distributed
System Security (NDSS) Symposium.
Yao, Shunyu, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao (2022).
“ReAct: Synergizing reasoning and acting in language models”. In: arXiv preprint arXiv:2210.03629.
Zaliva, Vadim, Kayvan Memarian, Ricardo Almeida, Jessica Clarke, Brooks Davis, Alexander Richard-
son, David Chisnall, Brian Campbell, Ian Stark, Robert N. M. Watson, and Peter Sewell (2024).
“Formal Mechanised Semantics of CHERI C: Capabilities, Undefined Behaviour, and Provenance”.
In: Proceedings of the 29th ACM International Conference on Architectural Support for Programming
Languages and Operating Systems.
Zhong, Peter Yong, Siyuan Chen, Ruiqi Wang, McKenna McCall, Ben L Titzer, and Heather Miller
(2025). “RTBAS: Defending LLM Agents Against Prompt Injection and Privacy Leakage”. In: arXiv
preprint arXiv:2502.08966.
Zverev, Egor, Evgenii Kortukov, Alexander Panfilov, Alexandra Volkova, Soroush Tabesh, Sebastian
Lapuschkin, Wojciech Samek, and Christoph H Lampert (2025). “ASIDE: Architectural Separation
of Instructions and Data in Language Models”. In: arXiv preprint arXiv:2503.10566.

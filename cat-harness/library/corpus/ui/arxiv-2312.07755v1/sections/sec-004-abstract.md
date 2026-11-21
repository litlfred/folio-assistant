---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-004-abstract
section_title: "Abstract"
section_number: null
pages: 3-4
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
and rapidly compare alternatives [54, 77]. SILK [48] is the first system that allows designers to create interactive UI
prototypes by wireframing. With the essential of UI wireframe as a profession in the UI design process, many academic
research [44, 57] and commercial graphic tools including Adobe PhotoShop [2], Sketch [10], and Figma [6] are developed
to allow designers to sketch the UI wireframes at multiple detail levels from low-fidelity to mid-fidelity and final UI
(as shown in Fig. 2). Low-fidelity wireframes serve as the design’s starting point that tends to be fairly rough, created
without any sense of scale, grid, or pixel-accuracy to represent a basic visual of the UI. Mid-fidelity wireframes further
boast pixel-specific layouts and make the UIs realistic by including semantic icons and relevant written content, that
allows for exploring and documenting complex concepts such as menu systems or interactive buttons.
Recent advances in AI have explored human-AI co-creation research for UI wireframes [71]. In these systems, AI
serves as humans’ collaborators, that make recommendations based on designers’ goals and intentions. For example,
Swire [42] proposes a deep-learning model to input a low-fidelity UI wireframe and retrieve relevant UI examples from
3
Feng et al.
large-scale datasets to help designers gain inspiration effectively. Lately, researchers conduct data-driven research
to support more advanced design inspiration search [15, 25, 29, 51, 63, 68, 69] or layout generation [13, 39, 52] in
complement to designers’ agency and creativity. These works, however, still require the designers to expend time
and effort designing and sketching a possible low-fidelity UI wireframe, then adding adequately relevant content to
demonstrate mid-fidelity UI wireframes. Our work aims to simplify the process further: given a design intent description,
we automatically generate mid-fidelity UI wireframes for designers to broaden their horizons and get inspiration.
2.2
Designing with Natural Language
To identify business requirements and collaborate ideas for UI designs, instigating conversations with the stakeholders
and users is crucial. As a subsequent effort, many studies are devoted to bridging natural language and UI screens.

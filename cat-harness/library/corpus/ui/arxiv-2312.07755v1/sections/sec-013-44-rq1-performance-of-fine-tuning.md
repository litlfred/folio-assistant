---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-013-44-rq1-performance-of-fine-tuning
section_title: "RQ1: Performance of Fine-tuning"
section_number: 4.4
pages: 12-14
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
4.4.1
Baselines. To demonstrate the advantage of fine-tuning to master the domain-specific task of UI wireframe
generation, we compare it with two widely-used in-context learning methods as baselines, including zero-shot learning
and few-shot learning. Note that all the experiment settings (e.g., model, hyperparameter, etc.) are the same.
Zero-shot learning: It predicts the results without any training samples. The general idea behind zero-shot learning
is the LLMs train on a wide collection of different databases and workloads and can thus generalize to a completely
new task and workload without the need to be trained particularly on that task.
Few-shot learning: It refers to giving a few demonstrations of the task as conditioning to allow the LLMs to predict
the results of new tasks. Typically, the demonstration has a prompt and a desired result (e.g., a login UI wireframe ->
[UI wireframe]), and few-shot works by giving 𝐾examples of prompt and result, and then one final prompt, with the
12
Wireframing UI Design Intent with Generative Large Language Models
Fig. 7. Examples of the comparison of different models, including Ada, Babbage, Curie, and our model WireGen.
LLMs expected to predict the result. We set 𝐾in the range of 1 to 2, as this is how many examples can fit in the LLMs’
maximum input tokens (4,096).
4.4.2
Results. From the annotations we collected, the generations from our WireGen receive much better ratings
than that of other baselines, e.g., 85.5% of our generation is rated as significantly better on average. In contrast, the
generations receive an average of 51.5% and 44.5% significantly worse ratings for zero-shot and few-shot, respectively.
As the ratings come from the subjective nature of the annotators, we further check the agreement between them by
calculating Cohen’s kappa [58]. We observe two annotators share an inter-rater reliability of 0.32, indicating a high
agreement on scoring across generations.
Fig. 6 shows some UI wireframe generations from the baselines and our WireGen. We can see that zero-shot can
generate some relevant elements due to its strong in-context learning ability. For instance, it generates “departure”,
“arrival”, “passengers” for a flight page and different music genres for a music page. However, without any fine-tuning
and example prompts, zero-shot does not consider the elements’ properties (e.g., size, alt-text, etc.) or the overall design
of the layout. We can also observe that the few-shot is a double-blade. Providing a small number of samples in the
prompts can help the LLMs grasp the task better, leading to improved elements and layouts in the UI wireframes, which
address the issues of zero-shot. However, the limited number of samples may not be enough for the LLMs to generalize
to the complex UI wireframing task, leading to some subpar layouts as shown in Fig. 6. Our WireGen overcomes these
limitations by the optimization of fine-tuning over thousands of UI samples, allowing the LLMs to inherit its in-context
ability and master UI-specific understanding, resulting in better UI wireframe generations.
13
Feng et al.
4.5

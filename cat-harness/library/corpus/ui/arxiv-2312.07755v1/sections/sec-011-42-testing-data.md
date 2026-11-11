---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-011-42-testing-data
section_title: "Testing Data"
section_number: 4.2
pages: 11-12
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
We collect the data as discussed in Section 3.1 as our experimental dataset. Since we leverage 1,000 sample data to
fine-tune the LLMs, we first remove these data to avoid potential bias. To evaluate the LLMs’ generalizability and
diversity, we randomly select 2 apps from each category. In total, we collect 100 UI textual descriptions as the input
prompts to generate UI wireframes. Note that we do not use the corresponding UI screens as the ground-truth because
the generative LLMs may create reasonable UI wireframes but deviate from the ground-truth.
11
Feng et al.
Fig. 6. Examples of prompting UI wireframe generations between zero-shot, few-shot, and our fine-tuned LLMs.
4.3

---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-019-discussion
section_title: "Discussion"
section_number: null
pages: 15-17
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
We see research developing automated evaluations of LLMs on representative public health
free text, tasks, and knowledge as crucial for future successful deployment in real world use
cases. This work introduces a set of these evaluations for Natural Language Understanding
tasks in order to provide an initial assessment of both LLMs’ applicability in general and to
compare the performance of individual LLMs.
Overall, we find LLMs of all sizes perform strongly on the simpler public health classification
tasks across all three areas (burden, risk factors, and interventions) and types of free text
(academic, news, social media, and questionnaires). This is a promising sign that LLMs may
already be useful tools for processing some public health text to support with real world
tasks. It also demonstrates that LLMs can generate responses requiring domain-specific
information about a range of public health topics, without which they could not achieve these
results.
This promising performance suggests that public health professionals and LLM specialists
should explore the potential benefits these models can offer in controlled deployments on
simpler tasks. We see significant opportunities for LLMs to systematically structure free text,
converting vital public health information embedded in text into novel structured datasets.
Additionally, in situations where the sheer volume of data renders manual review impractical,
LLMs could provide a scalable solution, especially during events like pandemics where data
volumes grow exponentially along with case counts. Furthermore, LLMs could be employed
to enhance the quality assurance of existing manual annotation processes, as a particularly
low-risk way to incorporate this technology.
However, for some public health tasks where very specific knowledge (Contact Type Classi-
fication) is required, or where it requires extracting structured data from long pieces of free
text (e.g BioDex Drugs Extraction) LLMs perform poorly at all model sizes in the zero-shot
setting. Therefore, continued model improvement and assessment may be needed before
LLMs can reliably support human experts on advanced public health text processing tasks.
These evaluations also highlight a number of specific considerations for LLMs within public
health:
Gains from advanced prompting. For some of the hardest tasks in the evaluation, such
as Contact Type Classification and Health Causal Claims Classification, we find few-shot
15
prompting significantly improves performance. The literature [68, 51, 69] also suggests
potential further gains from Chain-of-Thought (CoT) prompting techniques. Therefore,
more complex LLM pipelines may improve the reliability of results even on these more
challenging tasks.
Weaker long form extraction performance. The weakest performance across LLMs is
observed on long document extraction tasks, such as BioDex Drugs Extraction. A particular
challenge of these tasks is the LLM identifying the correct span of text to extract along with
applying the correct definition of the target. We find this often results in the LLM extracting
too many spans or the LLM extracting the incorrect sized span for the ground-truth label.
Variable benchmark applicability. We find some public LLM benchmarks, which use data
that often was not explicitly designed for public health evaluation, have some limitations.
A particular common issue is the lack of a well defined annotation protocol (often because
the data was annotated for a different purpose). This means a prompt may lead an LLM to
generate labels following a different "definition" of the labels or tasks than those used when
the data was originally annotated. This may lead to LLMs that are potentially capable of
performing a task generating incorrect labels. While reviewing outputs of LLMs we also
noted some potentially anomalous ground truth labels in some datasets.
Output fragility. Anecdotally, we observe weak performance is often due in part to either
the LLM failing to generate the requested output format (e.g providing an explanation instead
of simply "yes" or "no") or output structure (e.g outputting an invalid JSON). For example,
Flan-5-xxl performs poorly on News Headline Classification largely due to it not being able
to generate consistently well-formatted JSON outputs, rather than incorrect classifications.
These issues can often be solved via more advanced prompting or post processing [28] and
so our evaluations likely underestimate what could be achieved with bespoke pipelines.
Best open-weight models are increasingly comparable to private models. We find the
latest Llama-3.3-70b model performs comparably to GPT-4 and GPT-4o series models on
the 11 tasks assessed. This is one indication that the latest open-weight models are becoming
competitive with private models for these types of classification and extraction tasks in public
health.
Limited performance loss with INT-4 quantization. We evaluate the performance impact
of quantization on three Llama 3 family models across our tasks. We find limited impact
for both the 8bn and 70bn model sizes, suggesting quantization is a promising avenue for
reducing the memory footprint of open-weight LLMs for our public health tasks.
Task specific fine-tuning approaches. Whilst this paper focuses on evaluating LLM
in-context learning capabilities, it is important to note that literature finds that for many
applications specific fine-tuned models often perform competitively [29, 51, 70].
Benefits of domain specific annotation protocols. Methodologically, a crucial part of
successful LLM NLU evaluations is having rigorous and consistently applied annotations,
16
particularly in complex and subjective areas such as health. Epidemiologists have significant
expertise in dealing with these issues within public health. We have found drawing on
this expertise to develop detailed definitions and protocols for our evaluation datasets to
be valuable. We find this approach to codifying information has been helpful both to align
experts providing manual annotation, and also often incorporating these definitions into the
LLM prompts leads to outputs that more closely match the prompter’s intention. Descriptions
of our annotation approaches can be found in Sec. 7 and we will share more details of the
protocols developed in these projects in use-case specific public health papers.
5

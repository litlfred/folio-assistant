---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-015-security-evaluation
section_title: "Security evaluation"
section_number: null
pages: 14-14
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
While the previous section focuses on benign performance of the system, in this section we turn to
security evaluations. In particular, we break down the evaluation into three main case studies. First,
we focus on the performance of the system under attack where no additional policies are involved,
rather the system security is provided by the isolation principle first described by Willison (2023).
Next, we turn to the security evaluation where additionally we install a number of security policies for
various tasks. Here, they provide another level of guarantees that certain actions cannot be performed
by the system. Finally, we discuss peculiar CaMeL-specific attacks that we observed when running
evaluations, which we discuss broadly in Section 9.

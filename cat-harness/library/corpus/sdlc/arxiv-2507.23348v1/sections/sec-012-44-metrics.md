---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-012-44-metrics
section_title: "Metrics"
section_number: 4.4
pages: 6-6
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
We employ the following metrics to evaluate the performance of
SWE-Debate:
• Pass@1: The percentage of issues that are resolved success-
fully within the first attempt, following the evaluation protocol
established by [1, 46]. This metric directly measures the frame-
work’s ability to generate correct patches without requiring
multiple iterations, representing the most practical scenario for
real-world deployment.
• Acc@1 (File): The localization accuracy at top-1 predictions
at file level, where a localization is considered successful only
when all required modification points are included within the
top-1 predicted locations [6, 43]. This metric evaluates the
model’s capacity to precisely and comprehensively identify
all code regions that require modification, providing a fine-
grained assessment of fault localization performance prior to
the patch generation stage.
4.5

---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-038-the-audit-no-leak-found
section_title: "The audit: no leak found"
section_number: null
pages: 29-29
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
An audit script re-derives the published table from the raw records and hard-fails on any mismatch.
Its checks, all passing:
1. CSV reconciliation — per-model correct counts recomputed from raw equal the published
accuracies exactly, all twelve models.
2. Key consistency — the key letter is identical across all twelve models’ records for every
question.
3. Key balance — shuffled key distribution A/B/C/D = 48/51/47/52, chi-square vs uniform
p = 0.95.
4. Independent re-extraction — a second answer extractor, written without sight of the
first, agrees with the stored verdicts on every response for ten of twelve models; the
Gemini disagreements are almost entirely the independent extractor failing on the LaTeX
\boxed{X} answer style. Genuinely questionable credits — granted with no terminal
answer statement — number 2 (gemini-2.5-flash) and 6 (gemini-3.1-pro) of 198.
5. Strict-terminal sensitivity — rescoring with only explicit terminal answer statements
counted moves three models (gemini-2.5-flash 72.22 →70.71, gemini-3.1-pro 80.81 →
77.27, gpt-4.1-mini 63.13 →60.10) and the T–GPQA correlation from 0.982 to 0.972.
Scored the opposite way — voids excluded rather than counted wrong — it reads 0.975.
6. First-pass log reconciliation — the archived first-pass log reconciles exactly with the
shipped two-stage records.
What the audit cannot rule out. It certifies the path from raw records to published numbers; it
cannot re-run the models. Both instruments share the gateway, so capability-correlated properties of
that path touch both, and the gateway’s thinkingBudget: 0 for the Gemini seats is passed but
not verified by assertion. And GPQA is public: uniform training contamination would inflate accu-
racies without inflating a correlation against freshly generated items, but differential contamination
— exposure increasing with training recency and scale, which correlate with capability — would
inflate the slope itself. That channel cannot be excluded with the shipped data and is the specific
residual threat.
Table 12: The two instruments side by side — the key-free total T (three runs pooled) and self-
administered GPQA Diamond accuracy (voids counted as wrong), sorted by T.
Model
T
GPQA Diamond (%)
⋆claude-opus-4.5 (anchor)
7.00
78.79
gemini-3.1-pro
6.92
80.81
claude-opus-4.1
6.02
76.77
claude-opus-4.0
5.81
71.21
gemini-2.5-flash
5.75
72.22
claude-sonnet-4
5.34
72.22
gpt-4.1-mini
5.03
63.13
gpt-4.1-2025-04-14
4.66
61.62
gpt-4.1-nano
3.68
55.05
gpt-4o-2024-08-06
3.34
46.46
gpt-4o
2.95
48.48
gpt-4o-mini
2.39
43.94
E

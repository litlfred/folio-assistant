---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-021-discussion
section_title: "Discussion"
section_number: null
pages: 8-9
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Our results suggest that current SOTA LLMs, both proprietary and open-weight, in general have a
very high level of knowledge across UK public health guidance. This is particularly notable given
31% of the MCQA questions were based on guidance documents that were at least partially updated
within 2024 (see Appendix A.2), after many of the LLMs’ training data cut-off date.
However, we find that performance is significantly degraded across models in the free form response
setting. This is in part due to models including extraneous recommendations that do not form part
of the source UK public health guidance, but main issues appear to be omitting or contradicting
guidance information (see Appendix A.7.2). Qualitative assessment of o1 responses suggests possi-
ble problematic outputs are often around the timing of interventions, we provide some examples of
these in Appendix A.7.3.
8
Preprint.
Table 4: PubHealthBench-FreeForm accuracy by
guidance audience. *LLM used to generate bench-
mark, **Judge LLM.
Clinical
Guidance
Multiple
Audiences
Professional
Guidance
Public
Guidance
Unclassified
Total
Model Name
o1
71
81
70
86
82
74
GPT-4.1
65
71
71
82
69
71
o3-Mini
65
78
69
78
74
70
GPT-4o
60
71
54
82
63
61
GPT-4.5
59
71
54
77
59
59
Claude-Sonnet-3.7
57
66
55
76
57
59
Gemini-2.0-Flash
56
64
53
77
61
58
Gemma-3-27B
50
61
53
73
52
55
Gemini-Pro-1.5
46
58
51
63
61
53
Gemma-3-12B
50
53
48
74
55
52
Claude-Haiku-3.5
51
61
40
68
47
48
GPT-4o-Mini**
37
54
40
68
41
43
Llama-3.3-70B*
35
53
38
60
40
41
Mistral-3.1-24B
36
39
36
64
40
40
Phi-4-14B
33
46
37
59
40
39
Olmo-2-32B
37
51
37
55
29
39
Gemma-3-4B
25
39
35
58
44
37
Command-R-32B
30
41
29
53
42
34
Olmo-2-13B
30
32
30
60
34
34
Gemma-2-27B
27
36
32
49
34
33
Command-R-7B
20
17
22
46
19
23
Llama-3.1-8B
16
22
15
38
18
19
Phi-4-4B
16
24
17
29
15
19
Gemma-3-1B
14
12
21
26
14
18
Table 5:
Difference in accuracy between
MCQA and Free Form settings. *LLM used
to generate benchmark, **Judge LLM.
PubHealthBench
Reviewed
PubHealthBench
FreeForm
MCQA - FreeForm
Difference
Model Name
o1
91
74
-17
o3-Mini
88
70
-18
GPT-4o
80
60
-19
GPT-4.1
92
70
-21
Gemma-3-1B
45
18
-27
Gemma-3-12B
80
52
-27
Gemma-3-27B
82
54
-28
Claude-Sonnet-3.7
87
58
-29
Gemini-2.0-Flash
88
57
-30
Gemini-Pro-1.5
86
52
-33
GPT-4.5
92
59
-33
Claude-Haiku-3.5
83
48
-35
Gemma-3-4B
73
36
-36
Olmo-2-32B
78
38
-39
GPT-4o-Mini**
83
43
-40
Olmo-2-13B
75
33
-41
Mistral-3.1-24B
84
39
-45
Llama-3.3-70B*
87
40
-46
Command-R-32B
80
34
-46
Phi-4-14B
86
39
-47
Command-R-7B
72
23
-49
Gemma-2-27B
82
33
-49
Llama-3.1-8B
81
18
-62
Phi-4-4B
81
18
-63
Importantly for real-world use cases and deployments we see large disparities between the propri-
etary and large open-weight models compared with smaller open-weight LLMs (1-15bn parameters).
On MCQA questions this gap is generally 10-20ppts but often grows to more than 35ppts in the free
form setting. Therefore, there still appear to be significant risks around hallucinations relating to
UK public health guidance when using smaller LLMs.
From a public health perspective, it is also an important finding that LLMs consistently performed
best on guidance intended for the general public. This audience is likely the highest risk set of users
for querying chatbots to retrieve public health information. The fact LLMs are observed to have
greater knowledge in this area implies the risks may be lower than the overall results would imply.
7

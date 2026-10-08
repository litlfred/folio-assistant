---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-039-extended-overheads-results
section_title: "Extended overheads results"
section_number: null
pages: 38-40
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Table 10 | Token usage increase by multiple defenses.
Mean
Median
Std
Defense
Tokens
CaMeL
Input
7.24
2.73
14.79
Output
6.23
2.82
7.27
Spotlighting
Input
1.18
1.08
0.71
Output
1.01
0.99
0.22
Tool Filter
Input
8.18
7.77
4.93
Output
1.13
1.05
0.37
Tool Filter (efficient)
Input
2.70
2.34
1.65
Output
1.13
1.05
0.37
Prompt Sandwiching
Input
1.73
1.14
3.26
Output
1.22
1.16
0.37
38
Defeating Prompt Injections by Design
1x
2.7x
10x
100x
tokens with CaMeL / tokens without CaMeL
(input tokens, per task)
0
2
4
6
8
10
12
14
(a) Input token usage increase
0.1x
1x
2.7x
10x
100x
tokens with CaMeL / tokens without CaMeL
(output tokens, per task)
0
2
4
6
8
10
12
14
(b) Output token usage increase
Figure 21 | We measure the increase in tokens usage when using CaMeL compared to native tool
calling, not under attack, using Claude 3.5 Sonnet as backbone model, tokenizing using tiktoken.
The red line represents the increase in token usage for the median task.
Table 11 | Token usage by multiple defenses.
Mean
Median
Std
Defense
Tokens
None
Input
2999
1789
3450
Output
302
266
165
CaMeL
Input
14889
3641
22622
Output
2080
651
3115
Spotlighting
Input
3293
2073
3763
Output
300
267
163
Tool Filter
Input
16027
13635
13029
Output
310
270
150
Tool Filter (efficient)
Input
5172
4212
3947
Output
310
270
150
Prompt Sandwiching
Input
4041
2231
4910
Output
363
323
218
39
Defeating Prompt Injections by Design
Table 12 | Token usage by multiple defenses, under attack.
Mean
Median
Std
Defense
Tokens
None
Input
3764
2004
4826
Output
303
271
174
CaMeL
Input
13463
3643
21276
Output
1843
585
2830
Spotlighting
Input
3914
2053
4698
Output
295
268
169
Tool Filter
Input
16562
14277
12804
Output
313
293
152
Tool Filter (efficient)
Input
5968
4620
5050
Output
313
293
152
Prompt Sandwiching
Input
5854
2491
8176
Output
387
301
324
Table 13 | Token usage increase by multiple defenses, under attack.
Mean
Median
Std
Defense
Tokens
CaMeL
Input
6.17
2.02
15.55
Output
5.43
2.64
5.95
Spotlighting
Input
1.23
1.06
2.79
Output
0.99
0.98
0.26
Tool Filter
Input
7.42
7.06
4.43
Output
1.15
1.12
0.38
Tool Filter (efficient)
Input
2.59
2.29
1.52
Output
1.15
1.12
0.38
Prompt Sandwiching
Input
2.09
1.09
4.12
Output
1.27
1.08
0.81

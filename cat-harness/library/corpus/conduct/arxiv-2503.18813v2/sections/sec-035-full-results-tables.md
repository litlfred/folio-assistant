---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-035-full-results-tables
section_title: "Full results tables"
section_number: null
pages: 32-34
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
32
Defeating Prompt Injections by Design
Table 2 | Utility results on the AgentDojo benchmark, covering different suites.
Overall
banking
slack
travel
workspace
Model
Method
Claude 4 Sonnet
Native Tool Calling API
86.6% ± 6.8
75.0% ± 21.2
95.2% ± 9.1
80.0% ± 17.5
90.0% ± 9.3
CaMeL
74.2% ± 8.7
75.0% ± 21.2
61.9% ± 20.8
75.0% ± 19.0
80.0% ± 12.4
Difference
−12.4% ± 1.9
+0.0% ± 0.0
−33.3% ± 11.7
−5.0% ± 1.4
−10.0% ± 3.1
Claude 4 Sonnet*
Native Tool Calling API
83.5% ± 7.4
68.8% ± 22.7
95.2% ± 9.1
75.0% ± 19.0
87.5% ± 10.2
CaMeL
70.1% ± 9.1
75.0% ± 21.2
71.4% ± 19.3
65.0% ± 20.9
70.0% ± 14.2
Difference
−13.4% ± 1.7
+6.2% ± 1.5
−23.8% ± 10.2
−10.0% ± 1.9
−17.5% ± 4.0
Gemini 2.5 Flash
Native Tool Calling API
55.7% ± 9.9
43.8% ± 24.3
71.4% ± 19.3
45.0% ± 21.8
57.5% ± 15.3
CaMeL
35.1% ± 9.5
31.2% ± 22.7
42.9% ± 21.2
0.0% ± 0.0
50.0% ± 15.5
Difference
−20.6% ± 0.4
−12.5% ± 1.6
−28.6% ± 1.8
−45.0% ± 21.8
−7.5% ± 0.2
Gemini 2.5 Pro
Native Tool Calling API
73.2% ± 8.8
62.5% ± 23.7
90.5% ± 12.6
60.0% ± 21.5
75.0% ± 13.4
CaMeL
41.2% ± 9.8
56.2% ± 24.3
47.6% ± 21.4
0.0% ± 0.0
52.5% ± 15.5
Difference
−32.0% ± 1.0
−6.2% ± 0.6
−42.9% ± 8.8
−60.0% ± 21.5
−22.5% ± 2.1
o3 High
Native Tool Calling API
84.5% ± 7.2
62.5% ± 23.7
95.2% ± 9.1
75.0% ± 19.0
92.5% ± 8.2
CaMeL
77.3% ± 8.3
81.2% ± 19.1
71.4% ± 19.3
80.0% ± 17.5
77.5% ± 12.9
Difference
−7.2% ± 1.1
+18.8% ± 4.6
−23.8% ± 10.2
+5.0% ± 1.4
−15.0% ± 4.8
o4 Mini High
Native Tool Calling API
79.4% ± 8.1
50.0% ± 24.5
90.5% ± 12.6
65.0% ± 20.9
92.5% ± 8.2
CaMeL
76.3% ± 8.5
68.8% ± 22.7
66.7% ± 20.2
75.0% ± 19.0
85.0% ± 11.1
Difference
−3.1% ± 0.4
+18.8% ± 1.8
−23.8% ± 7.6
+10.0% ± 1.9
−7.5% ± 2.9
Table 3 | Utility results on the AgentDojo benchmark, covering different suites, under attack.
Overall
banking
slack
travel
workspace
Model
Method
Claude 4 Sonnet
Native Tool Calling API
80.1% ± 2.5
67.4% ± 7.7
70.5% ± 8.7
76.4% ± 7.0
86.1% ± 2.9
CaMeL
75.7% ± 2.7
68.8% ± 7.6
68.6% ± 8.9
75.0% ± 7.2
78.9% ± 3.4
Difference
−4.4% ± 0.2
+1.4% ± 0.1
−1.9% ± 0.2
−1.4% ± 0.1
−7.1% ± 0.5
Claude 4 Sonnet*
Native Tool Calling API
78.1% ± 2.6
68.8% ± 7.6
69.5% ± 8.8
72.9% ± 7.4
83.4% ± 3.1
CaMeL
72.8% ± 2.8
71.5% ± 7.4
73.3% ± 8.5
67.1% ± 7.8
74.5% ± 3.6
Difference
−5.3% ± 0.2
+2.8% ± 0.2
+3.8% ± 0.3
−5.7% ± 0.4
−8.9% ± 0.5
Gemini 2.5 Flash
Native Tool Calling API
39.5% ± 3.1
50.0% ± 8.2
59.0% ± 9.4
22.1% ± 6.9
37.5% ± 4.0
CaMeL
41.5% ± 3.1
43.8% ± 8.1
42.9% ± 9.5
0.0% ± 0.0
51.1% ± 4.1
Difference
+2.0% ± 0.0
−6.2% ± 0.1
−16.2% ± 0.1
−22.1% ± 6.9
+13.6% ± 0.1
Gemini 2.5 Pro
Native Tool Calling API
58.0% ± 3.1
52.1% ± 8.2
67.6% ± 9.0
50.0% ± 8.3
59.6% ± 4.1
CaMeL
45.3% ± 3.2
52.8% ± 8.2
48.6% ± 9.6
1.4% ± 1.4
53.8% ± 4.1
Difference
−12.6% ± 0.0
+0.7% ± 0.0
−19.0% ± 0.6
−48.6% ± 6.9
−5.9% ± 0.1
o3 High
Native Tool Calling API
79.0% ± 2.6
62.5% ± 7.9
64.8% ± 9.1
67.9% ± 7.7
88.8% ± 2.6
CaMeL
79.8% ± 2.6
77.1% ± 6.9
71.4% ± 8.6
84.3% ± 6.0
80.9% ± 3.3
Difference
+0.7% ± 0.0
+14.6% ± 1.0
+6.7% ± 0.5
+16.4% ± 1.7
−7.9% ± 0.6
o4 Mini High
Native Tool Calling API
81.6% ± 2.5
55.6% ± 8.1
61.0% ± 9.3
70.0% ± 7.6
95.0% ± 1.8
CaMeL
76.1% ± 2.7
62.5% ± 7.9
68.6% ± 8.9
74.3% ± 7.2
81.4% ± 3.2
Difference
−5.5% ± 0.2
+6.9% ± 0.2
+7.6% ± 0.5
+4.3% ± 0.4
−13.6% ± 1.4
33
Defeating Prompt Injections by Design
Table 4 | Number of successful attacks.
Overall
banking
slack
travel
workspace
Model
Method
Claude 4 Sonnet
Native Tool Calling API
75 ± 58.6
30 ± 20.2
15 ± 7.8
3 ± 0.0
27 ± 17.0
CaMeL (no policies)
13 ± 6.0
0 ± 0.0
0 ± 0.0
13 ± 6.2
0 ± 0.0
CaMeL
11 ± 4.5
0 ± 0.0
0 ± 0.0
11 ± 4.7
0 ± 0.0
Claude 4 Sonnet*
Native Tool Calling API
75 ± 58.6
37 ± 26.5
16 ± 8.6
2 ± 0.0
20 ± 11.4
CaMeL (no policies)
10 ± 3.8
0 ± 0.0
0 ± 0.0
10 ± 4.0
0 ± 0.0
CaMeL
11 ± 4.5
0 ± 0.0
0 ± 0.0
11 ± 4.7
0 ± 0.0
Gemini 2.5 Flash
Native Tool Calling API
297 ± 268.7
49 ± 37.5
85 ± 76.3
83 ± 71.0
80 ± 63.6
CaMeL (no policies)
1 ± 0.0
0 ± 0.0
0 ± 0.0
1 ± 0.0
0 ± 0.0
CaMeL
1 ± 0.0
0 ± 0.0
0 ± 0.0
1 ± 0.0
0 ± 0.0
Gemini 2.5 Pro
Native Tool Calling API
163 ± 140.1
22 ± 13.4
77 ± 67.4
15 ± 7.7
49 ± 35.8
CaMeL (no policies)
0 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
CaMeL
0 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
o3 High
Native Tool Calling API
11 ± 4.5
1 ± 0.0
5 ± 0.7
1 ± 0.0
4 ± 0.1
CaMeL (no policies)
1 ± 0.0
1 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
CaMeL
0 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
o4 Mini High
Native Tool Calling API
2 ± 0.0
1 ± 0.0
1 ± 0.0
0 ± 0.0
0 ± 0.0
CaMeL (no policies)
1 ± 0.0
1 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
CaMeL
1 ± 0.0
1 ± 0.0
0 ± 0.0
0 ± 0.0
0 ± 0.0
Table 5 | Defenses utility.
Overall
Banking
Slack
Travel
Workspace
Defense
Prompt Sandwiching
89.69% ± 6.05
93.75% ± 11.86
85.71% ± 14.97
80.00% ± 17.53
95.00% ± 6.75
Spotlighting
92.78% ± 5.15
87.50% ± 16.20
95.24% ± 9.11
80.00% ± 17.53
100.00% ± 0.00
Tool Filter
73.20% ± 8.81
87.50% ± 16.20
61.90% ± 20.77
60.00% ± 21.47
80.00% ± 12.40
Undefended model
90.72% ± 5.77
81.25% ± 19.12
95.24% ± 9.11
75.00% ± 18.98
100.00% ± 0.00
CaMeL
63.92% ± 9.56
75.00% ± 21.22
71.43% ± 19.32
25.00% ± 18.98
75.00% ± 13.42

---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-020-b-additional-experiment-results
section_title: "Additional Experiment Results"
section_number: B
pages: 8-10
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Table 2 reports the full set of routing experiment results. Rows are grouped by the (weak, strong) model pair and list, in
order: three prompt-only embedding baselines (Embed+LR, Embed+kNN, Embed+XGB); our non-temporal variant (K=0);
SWE-Router with fixed budgets K ∈{1, 2, 3, 4}. Metric semantics and the splits used in the experiment are explained in
Section 5 and Section A.
8
SWE-Router
Table 2. Threshold-free routing metrics (AUROC and Route-AUC) on three splits (SWE-Smith val, SWE-Smith test, SWE-Bench Verified
test). “—” indicates an experiment not run or a metric not produced by the corresponding evaluation script. SWE-Router significantly
outperforms all the baselines in SWE-Bench Verified test split in Route-AUC, while in SWE-Smith test split, the router trained with
gpt-5-mini as m1 does not show higher Route-AUC than the baselines. As the Route-AUC between the validation split and test split
of SWE-Smith is not consistently correlated in the case of router with deepseek-v3.2 as m1 as well, we attribute this phenomenon to
a distribution shift between the splits while separating them based on the code repositories the tasks are derived from.
AUROC
Route-AUC
Method
val
SS-test
SB-V
val
SS-test
SB-V
m1: gpt-5-mini
m2: gemini-3-pro-preview
Embed+LR
0.635
0.692
0.527
1.140
0.591
0.565
Embed+kNN
0.629
0.664
0.563
-0.301
0.604
0.530
Embed+XGB
0.585
0.589
0.567
0.782
0.521
0.517
Non-temporal Router (ours, K=0)
0.599
0.702
0.613
1.644
0.626
0.549
SWE-Router fixed (K=1)
0.622
0.679
0.597
2.358
0.493
0.702
SWE-Router fixed (K=2)
0.634
0.678
0.594
1.928
0.482
0.703
SWE-Router fixed (K=3)
0.631
0.684
0.586
1.982
0.547
0.694
SWE-Router fixed (K=4)
0.636
0.685
0.617
2.243
0.546
0.709
m1: deepseek-v3.2
m2: gemini-3-pro-preview
Embed+LR
0.628
0.660
0.477
0.455
0.508
0.476
Embed+kNN
0.600
0.590
0.489
0.385
0.444
0.371
Embed+XGB
0.591
0.618
0.526
0.430
0.555
0.465
Non-temporal Router (ours, K=0)
0.628
0.638
0.620
0.663
0.555
0.627
SWE-Router fixed (K=1)
0.658
0.649
0.597
0.646
0.571
0.768
SWE-Router fixed (K=2)
0.670
0.654
0.605
0.720
0.567
0.780
SWE-Router fixed (K=3)
0.666
0.655
0.603
0.738
0.547
0.750
SWE-Router fixed (K=4)
0.651
0.669
0.596
0.668
0.569
0.718
9
SWE-Router

---
doc_id: arxiv-2504.21474v1
doc_title: "Homa at SemEval-2025 Task 5: Aligning Librarian Records with OntoAligner for Subject Tagging"
section_id: sec-006-qualitative-results
section_title: "Qualitative Results"
section_number: null
pages: 5-5
source_pdf: 2504.21474v1.pdf
source_sha256: 68a09fcd43927e7a
toc_source: outline
---
Figure 3 (combination of train and dev sets) indi-
cates that the average number of records typically
falls between 0 and 20 with mostly having an upper
quartile Q3 of 5. This explains why the results for
top-k values within this range vary according to
the recall@k in Figure 2 for most participants.
System Performance Against Other Teams. The
Figure 2 illustrates our system’s performance com-
pared to other teams across different top-k values.
While precision differences are marginal, indicat-
ing similar ranking effectiveness among top mod-
els, the F1 trends show a balance between precision
and recall, highlighting our system’s capability in
ranking relevant subjects effectively. Additionally,
most teams achieved high Recall@5 but lower Pre-
cision@5 (with respect to the Figure 3 this is logi-
cal), suggesting that ranking quality is more crucial
for retrieval improvements than the LLM module.
This is evident in F1@5, where performance drops
despite improved recall at k > 5.
4.3
Qualitative Results
The Figure 4 provides qualitative results for two
case studies. Additionally, Table 2 summarizes
the average precision, recall, and F1 scores for the
qualitative results from two case studies.
Case 1 and Case 2 Comparison. According to
the Table 2, the case 1: achieved the highest recall
(24.26%) across all subject classifications, demon-
strating that the system effectively retrieves rele-
vant subjects. The F1-score of 20.06% suggests a
balanced trade-off between precision and recall in
this scenario, still affected due to the poor precision.
However, case 2 exhibited a lower recall (19.55%)
and F1-score (13.63%), indicating that the system
struggled with certain subject categories, possibly
due to more ambiguous or overlapping terms.
Performance Across Subject Classifications.
Figure 4 further breaks down recall performance
by subject classification for both case studies. The
highest recall was observed in specific subject cate-
gories, such as "inf" (Informatics) – recall of 50.0%
for case 1 and really of 49.9% for case 1– and "tec"
(Technology) – recall of 45.5% for case 1 and re-
call of 34.7% for case 2 –, suggesting that the
system performs well in well-structured domains
with clear taxonomies. Moreover, the lowest re-
call of 13.4% was seen in categories like "phy"
(Physics) for case 2 and lowest recall of 20.8% in
"mat" (Mathematics), likely due to their abstract
nature and overlapping subject boundaries. Finally,
in Case 1, subject categories such as "fer" (Material
Science) and "tec" (Technology) performed better
compared to Case 2, highlighting the importance
of context in subject alignment.
5

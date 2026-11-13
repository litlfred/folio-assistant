---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-12 
 
 
After obtaining the criteria weights, the following steps are for ranking the alternatives by the 
AHP method. 
Step 4. Determine local priority scores of alternatives under each criterion, denoted as 𝑣𝑖𝑗 with 
𝑖∈{1,2, . . . , 𝑚} and 𝑗∈{1,2, . . . , 𝑛}.  
With respect to each of the 𝑛 criteria, a separate pairwise comparison matrix (size 𝑚× 𝑚) is 
constructed, comparing all pairs of 𝑚 alternatives, which essentially follows the same 
procedure as described in Steps 1 to 3 including consistency analysis. For example, the 
decision-maker assesses alternative 1 against alternative 2 under the first criterion and 
assigns a relative importance value using Saaty’s 1–9 scale. This process is repeated for all 
pairs of 𝑚 alternatives under each criterion. Once the 𝑛 number of 𝑚× 𝑚 pairwise 
comparison matrices are established, the local priority vectors (representing the relative 
priorities of alternatives for each criterion) are computed using the eigenvalue method as in 
Step 2. 
At this stage, if the decision-maker does not have an ACM (such as Table 8.1) based on 
objective measurement data, they can continue to rely entirely on their subjective judgments, 
as in Step 1, to construct all pairwise comparison matrices for alternatives under each criterion 
(e.g., A1 is moderately more important/better than A4 under C1; A3 is strongly more 
important/better than A2 under C3).  
If an ACM based on objective measurement data is available, since it is not directly compatible 
with the conventional AHP process that relies on Saaty’s 1–9 scale, the decision-maker needs 
to first map the objective data into Saaty’s 1–9 scale (Si et al., 2016). This is done either 
through subjective assessment, leveraging the decision-maker’s domain knowledge to inspect 
the ACM and assign pairwise comparison values of alternatives under each criterion using the 
1–9 scale, or by applying mathematical mapping techniques. After this mapping, the decision-
maker constructs the pairwise comparison matrices for alternatives for each criterion. One 
commonly used mathematical mapping technique is the logarithmic transformation, whose 
steps are outlined below. 
Firstly, normalize the original ACM with 𝑚 rows (i.e., alternatives) and 𝑛 columns (i.e., criteria) 
by using the Max normalization method.  
For a maximization criterion, the normalized value 𝐹𝑖𝑗 is obtained as: 
𝐹𝑖𝑗=
𝑓𝑖𝑗
𝑚𝑎𝑥
𝑘∈{1,2,...,𝑚}𝑓𝑘𝑗
 
(8.11)  
For a minimization criterion, the normalized value 𝐹𝑖𝑗 is obtained as:

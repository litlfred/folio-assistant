---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-030
section_title: "Page 30"
pages: 30-30
pdf_page: 30
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-30 
 
performance score is ranked higher. The MOORA method follows a structured sequence of 
the following steps. 
Step 1. Normalize the original ACM with 𝑚 rows (i.e., alternatives) and 𝑛 columns (i.e., 
criteria) by Vector normalization method. 
𝐹𝑖𝑗=
𝑓𝑖𝑗
√∑
𝑓𝑘𝑗
2
𝑚
𝑘=1
 
(8.23) 
Numerical Calculations (using ACM from Table 8.1): 
For instance, for 𝑖= 1 and 𝑗= 2: 
𝐹12 =
𝑓12
√∑
𝑓𝑘2
2
𝑚
𝑘=1
=
600
√6002 + 7002 + 5002 + 4002 = 0.5345 
Similar calculations are performed for all other values in the ACM across the 4 alternatives 
and 3 criteria. The complete results, forming the normalized ACM, are shown in Table 8.15. 
Table 8.15: Normalized ACM for MOORA walkthrough. 
Alternatives 
C1 
C2 
C3 
A1 
0.6015 
0.5345 
0.7321 
A2 
0.3299 
0.6236 
0.5617 
A3 
0.4980 
0.4454 
0.2804 
A4 
0.5304 
0.3563 
0.2644 
 
Step 2. Construct the weighted normalized ACM by multiplying the values of each criterion 
with its assigned weight, 𝑤𝑗. 
𝑣𝑖𝑗= 𝐹𝑖𝑗× 𝑤𝑗 
(8.24)  
Numerical Calculations: 
For instance, for 𝑖= 1 and 𝑗= 2: 
𝑣12 = 𝐹12 × 𝑤2 = 0.5345 × 0.33 = 0.1764 
Likewise, calculations are carried out for all other values in the normalized ACM, using their 
respective assigned weights. The results, which constitute the weighted normalized ACM, 
are displayed in Table 8.16. 
Table 8.16: Weighted normalized ACM for MOORA walkthrough. 
Alternatives 
C1 
C2 
C3 
A1 
0.1504 
0.1764 
0.3075

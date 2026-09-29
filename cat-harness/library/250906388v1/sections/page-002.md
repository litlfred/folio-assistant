---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-2 
 
approach, ensuring that the final ranking of alternatives reflects the collective impact of all 
criteria. 
This chapter covers 8 aggregation-type MCDM methods, detailing their principles and 
algorithms. These methods are selected based on either their widespread popularity for 
various applications or their recent development. Each method is elucidated through a simple 
numerical example, ensuring that readers gain a clear understanding of its inner workings.  
The following sections in this chapter present the 8 aggregation-type MCDM methods, in 
chronological order. Readers need not study them sequentially and can read any of them 
(independent of others). 
Section 8.2 
Simple Additive Weighting (SAW) 
Section 8.3 
Multiplicative Exponent Weighting (MEW) 
Section 8.4 
Analytic Hierarchy Process (AHP) 
Section 8.5 
Analytic Network Process (ANP) 
Section 8.6 
Complex Proportional Assessment (COPRAS) 
Section 8.7 
Multi-Objective Optimization on the basis of Ratio Analysis (MOORA) 
Section 8.8 
Faire Un Choix Adéquat (FUCA) 
Section 8.9 
Weighted Aggregated Sum Product Assessment (WASPAS) 
Section 8.10 Summary 
Our Microsoft Excel based program, EMCDM, described in Chapter 10, includes SAW, 
COPRAS, MOORA, and FUCA methods. 
The learning outcomes of this chapter are: (1) Describe the principles and algorithms of 
aggregation-type MCDM methods covered; (2) Apply any of these methods to ACM of an 
application; and (3) Select one or more aggregation-type MCDM methods for solving MCDM 
problems. 
Unless otherwise stated, the notation used throughout this chapter are as follows: 
• 
𝑖∈{1,2, … , 𝑚} and 𝑗∈{1,2, … , 𝑛}, where 𝑚 is the number of rows (i.e., alternatives) 
and 𝑛 is the number of columns (i.e., criteria) in the ACM.  
• 
𝑓𝑖𝑗 is the value of the 𝑗𝑡ℎ criterion for the 𝑖𝑡ℎ alternative in the original ACM. 
• 
𝐹𝑖𝑗 is the normalized value of 𝑓𝑖𝑗. 
• 
𝑤𝑗 is the weight assigned to the 𝑗𝑡ℎ criterion, and ∑
𝑤𝑗
𝑛
𝑗=1
= 1. 
• 
𝑣𝑖𝑗 is the value of the 𝑗𝑡ℎ criterion for the 𝑖𝑡ℎ alternative in the weighted normalized 
ACM. 
Additionally, the ACM presented in Table 8.1 is employed to walk through the steps of the 
aggregation-type MCDM methods covered in this chapter. This ACM is made up of 4

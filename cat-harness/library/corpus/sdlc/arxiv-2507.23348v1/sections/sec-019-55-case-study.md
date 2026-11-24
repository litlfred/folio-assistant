---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-019-55-case-study
section_title: "Case Study"
section_number: 5.5
pages: 8-8
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
To further verify the effectiveness of SWE-debate in actual use,
we analyzed a case in SWE-bench. In this case, we investigate an
issue in SymPy related to the incorrect evaluation of powers ap-
plied to TensorProduct expressions. Specifically, expressions like
TensorProduct(1,Pauli(3))*TensorProduct(1,Pauli(3)) fail
to simplify into TensorProduct(1,1) or 1, even though Pauli(3)**2
=1. This failure arises because neither the expand(tensorproduct
=True) method nor the tensor_product_simp function are equipped
to handle exponentiation of TensorProduct objects. The issue
is non-trivial as it requires coordinated reasoning over symbolic
power expressions and tensor algebra simplification.
Our method first generates localization chains based on graph-
based reasoning over symbolic dependencies, and then applies a
Multi-Agent Debate process to guide the repair. In the first stage,
the agent constructs multiple candidate localization chains. Among
the generated candidates, Chain 2 demonstrates high accuracy by
precisely capturing all necessary modules involved in the failure,
such as tensor_product_simp_Mul, tensor_product_simp, and
TensorProduct.eval_expand_tensorproduct. This chain provides
a comprehensive view of the symbolic rewriting pipeline for tensor
expressions, effectively guiding the system to the correct set of
files and even narrowing down the specific functions requiring
modification.
Based on this chain, our debate process formulates a multi-
stage plan. It proposes a four-step approach: first, modifying the
simplification logic in tensor_product_simp; second, updating
tensor_product_simp_Mul to support powers; third, extending
eval_expand_tensorproduct for power handling; and fourth, adding
an _eval_power method in the TensorProduct class. The edit de-
rived from this plan introduces a recursive rule that distributes the
exponent over the arguments of a TensorProduct, enabling cor-
rect evaluation of symbolic powers. Notably, all modified functions
were covered by the selected localization chain, demonstrating the
accuracy and completeness of our code navigation strategy.
This case highlights the strength of our method in both locating
and resolving issues. The localization chain effectively surfaces
the relevant symbolic manipulation points, while the structured
planning and debate framework facilitates coordinated edits across
multiple modules. Together, they contribute to generating a valid
and verifiable patch that resolves the issue as expected.
6

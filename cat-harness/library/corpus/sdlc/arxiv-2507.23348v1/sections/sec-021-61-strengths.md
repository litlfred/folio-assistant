---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-021-61-strengths
section_title: "Strengths"
section_number: 6.1
pages: 8-9
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
SWE-Debate demonstrates three key advantages over existing ap-
proaches. First, the graph-based localization significantly improves
fault localization accuracy. By building dependency graphs from
code structure and generating multiple fault propagation traces, our
method achieves 81.67% file-level accuracy. When comparing with
SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution
Conference’17, July 2017, Washington, DC, USA
Issue: Evaluating powers of `TensorProduct`
Powers of tensor product expressions are not possible to evaluate with either 
`expand(tensorproduct=True)` method nor the `tensor_product_simp`function.
. . . . . .
<plan>
***stage 1***
instruction: Modify the tensor_product_simp function to handle Pow expressions . . . 
context: physics/quantum/tensorproduct.py:tensor_product_simp (lines 348-393)
***stage 2***
instruction: Update tensor_product_simp_Mul to recognize and handle . . .
context: physics/quantum/tensorproduct.py:tensor_product_simp_Mul (lines 271-345)
***stage 3***
instruction: Extend _eval_expand_tensorproduct to handle Pow expressions . . .
context: 
physics/quantum/tensorproduct.py:TensorProduct._eval_expand_tensorproduct (lines 
241-258)
***stage 4***
instruction: Add a _eval_power method to the TensorProduct class to handle power . . .
context: physics/quantum/tensorproduct.py:TensorProduct class (lines 49-268)
</plan>
--- a/sympy/physics/quantum/tensorproduct.py
+++ b/sympy/physics/quantum/tensorproduct.py
@@ -142,6 +142,20 @@
def _eval_adjoint(self):
return TensorProduct(*[Dagger(i) for i in self.args])
+        
+    def _eval_power(self, exponent):+        
+        return TensorProduct(*[arg**exponent for arg in self.args])
def _eval_rewrite(self, pattern, rule, **hints):
sargs = self.args
@@ -382,7 +396,10 @@
if isinstance(e, Add):
return Add(*[tensor_product_simp(arg) for arg in e.args])
elif isinstance(e, Pow):
-
return tensor_product_simp(e.base) ** e.exp
+        base = tensor_product_simp(e.base)
+        if isinstance(base, TensorProduct):
+            return TensorProduct(*[arg**e.exp for arg in base.args])
+        return base ** e.exp
elif isinstance(e, Mul):
Plan
Generate 
Localization Chain
Chain1：
['physics/paulialgebra.py:Pauli’, 
'physics/paulialgebra.py:Pauli._eval_power', 
'physics/quantum/gate.py:CGate._eval_power', 
'physics/quantum/operator.py:HermitianOperator._eval_power', 
'simplify/powsimp.py:_denest_pow’]
Chain2：
['physics/paulialgebra.py:evaluate_pauli_product', 
'physics/quantum/tensorproduct.py:TensorProduct._eval_expand_tensorproduct', 
'tensor/functions.py:TensorProduct', 
'physics/quantum/tensorproduct.py:TensorProduct._eval_rewrite', 
'diffgeom/diffgeom.py:TensorProduct.__new__']
Chain3：
['tensor/tensor.py', 'tensor/tensor.py:TensMul’, 
'tensor/tensor.py:TensMul._flatten’, 
'tensor/tensor.py:TensMul.__new__', 
'physics/quantum/tensorproduct.py:TensorProduct.__new__', 
'tensor/functions.py:TensorProduct.__new__’]
Chain4：
['physics/quantum/tensorproduct.py:TensorProduct', 
'physics/quantum/tensorproduct.py:tensor_product_simp_Mul', 
'physics/quantum/tensorproduct.py:tensor_product_simp', 
'physics/quantum/tensorproduct.py:TensorProduct._eval_expand_tensorproduct ', 
'matrices/expressions/matmul.py:MatMul.doit’, ]
Chain5：
['physics/quantum/tensorproduct.py:TensorProduct', 
'physics/quantum/tensorproduct.py:tensor_product_simp_Mul', 
'core/mul.py:Mul._eval_power’, 
'core/power.py:Pow._eval_expand_power_base', 
'core/power.py:Pow._eval_expand_power_base.pred']
Debate
Edit
location
location
location
location
location
Figure 4: Case study of SWE-Debate with instance sympy-13974.
methods using identical models, SWE-Debate demonstrates substan-
tial improvements: 14.67% over SWE-Agent with DeepSeek-V3-0324
and 8.31% over SWE-Search with GPT-4o , representing an 3.93
percentage point improvement over the strongest baseline across
all configurations. The graph traversal strategy effectively captures
structural relationships that single-agent individual exploration
often misses, particularly for multi-file issues where traditional
methods frequently fail due to insufficient architectural understand-
ing. This superior localization performance directly translates to
better issue resolution, with SWE-Debate achieving 41.4% Pass@1
compared to baseline methods ranging from 23.0% to 38.8%.
Second, the competitive multi-agent debate resolves modification
ambiguity more effectively than individual agent reasoning. Our
ablation study shows that removing the debate component causes
a 4.2 percentage point drop in resolution rate. The three-round
debate process—independent analysis, competitive refinement, and
final selection—enables agents with different specializations to sys-
tematically evaluate competing fix strategies. This structured com-
petitive approach achieves a 2.6 percentage point improvement
over the strongest baseline using the same model, demonstrating
that architectural innovations can transcend model capabilities
when multiple code locations appear relevant but require different
architectural considerations for correct resolution.
Third, the framework integrates seamlessly with existing issue
resolution systems without requiring major modifications. Our
approach can improve the localization modules in frameworks
like SWE-Search and Agentless, providing better starting points
for downstream repair while maintaining compatibility with their
existing architectures. This plug-and-play design enables practical
adoption in real software engineering workflows.
6.2

---
doc_id: arxiv-1603.07466v1
doc_title: "Semantics and Analysis of DMN Decision Tables"
section_id: sec-000-semantics-and-analysis-of-dmn-decision-tables
section_title: "Semantics and Analysis of DMN Decision Tables"
section_number: null
pages: 1-16
source_pdf: arxiv-1603-07466v1.pdf
source_sha256: 0a0fd1ae1ced5efc
toc_source: outline
---
Diego Calvanese1, Marlon Dumas2, ¨Ulari Laurson2,
Fabrizio M. Maggi2, Marco Montali1, and Irene Teinemaa2
1Free University of Bozen-Bolzano, Italy
2University of Tartu, Estonia
Abstract. The Decision Model and Notation (DMN) is a standard no-
tation to capture decision logic in business applications in general and
business processes in particular. A central construct in DMN is that of
a decision table. The increasing use of DMN decision tables to capture
critical business knowledge raises the need to support analysis tasks on
these tables such as correctness and completeness checking. This paper
provides a formal semantics for DMN tables, a formal deﬁnition of key
analysis tasks and scalable algorithms to tackle two such tasks, i.e., de-
tection of overlapping rules and of missing rules. The algorithms are
based on a geometric interpretation of decision tables that can be used
to support other analysis tasks by tapping into geometric algorithms.
The algorithms have been implemented in an open-source DMN editor
and tested on large decision tables derived from a credit lending dataset.
Keywords: Decision Model and Notation, Decision Table, Sweep algorithm
1
Introduction
Business process models often encode decision logic of varying complexity, typ-
ically via conditional expressions attached either to outgoing ﬂows of decision
gateways or to conditional events. The need to separate this decision logic from
the control-ﬂow logic [2] and to capture it at a higher level of abstraction has
motivated the emergence of the Decision Model and Notation (DMN) [6].
A central construct of DMN is that of a decision table, which stems from the
notion of decision table proposed in the context of program decision logic speci-
ﬁcation in the 1960s [8]. A DMN decision table consists of columns representing
the inputs and outputs of a decision, and rows denoting rules. Columns may be
typed, meaning that they have an associated domain (or facet). Each rule is a
conjunction of basic expressions captured in an expression language known as
S-FEEL (Simpliﬁed Friendly Enough Expression Language).
The use of DMN decision tables as a speciﬁcation vehicle for critical business
decisions raises the question of ensuring the correctness of these tables, in par-
ticular the detection of inconsistent or incomplete DMN decision tables. Indeed,
detecting errors in DMN tables at speciﬁcation time may prevent costly defects
down the road during business process implementation and execution.
This paper provides a foundation for analyzing the correctness of DMN ta-
bles. The contributions of the paper are: (i) a formal semantics of DMN tables;
arXiv:1603.07466v1  [cs.SE]  24 Mar 2016
(ii) a formalization of correctness criteria for DMN tables; and (iii) scalable algo-
rithms for two basic correctness checking tasks over DMN tables, i.e., detection
of overlapping rules and detection of missing rules (i.e., incompleteness). The
latter algorithms are based on a novel geometric interpretation of DMN tables,
wherein each rule in a table is mapped to an iso-oriented hyper-rectangle in an
N-dimensional space (where N is the number of columns). Accordingly, the prob-
lem of detecting overlapping rules is mapped to that of detecting overlapping
hyper-rectangles. Meanwhile, the problem of detecting missing rules is mapped
to that of diﬀerencing the N-dimensional universe deﬁned by the N columns of a
DMN table, and the set of hyper-rectangles induced by its rules. Based on this
geometric interpretation and inspired by sweep-based spatial join algorithms [1],
the paper presents scalable algorithms for these two analysis tasks. The algo-
rithms have been implemented atop the dmn-js DMN editor and evaluated over
decision tables of varying sizes derived from a credit lending dataset.
The rest of the paper is structured as follows. Section 2 introduces DMN
and discusses related work. Section 3 presents the formalization of DMN tables
and their associated correctness criteria. Section 4 presents the algorithms for
correctness analysis while Section 5 discusses their empirical evaluation. Finally,
Section 6 summarizes the contributions and outlines future work directions.
2
Background and Related Work
2.1
Overview of DMN Decision Tables
A DMN table consists of columns corresponding to input or output attributes,
and rows corresponding to rules. Each column is associated to a type (e.g., a
string, a number, or a date), and optionally to a more speciﬁc domain of possible
values, which we hereby call a facet. Each row has an identiﬁer, one expression
for each input column (a.k.a. the input entries), and one speciﬁc value for each
output column (the output entries). For example, Table 1 shows a DMN table
with two input columns, one output column and four rules.
Loan Grade
U C
Annual
Loan
Grade
Income
Size
≥0
≥0
VG,G,F,P
A
[0..1000]
[0..1000]
VG
B
[250..750] [4000..5000]
G
C
[500..1500] [500..3000]
F
D
[2000..2500] [0..2000]
P
Table name
Hit indicator
Completeness
indicator
Input attrs
Facet
Output attr
Rule
Priority
indicator
Input entries
Output entry
Table 1: Sample decision table with its constitutive elements
Given an input conﬁguration consisting of a vector of values (one entry per
column), if every input entry of a row holds true for this input vector, then the
vector matches the row and the output entries of the row are evaluated. For
example, vector ⟨500, 4230⟩matches rule B in Table 1, thus yielding G in the
output conﬁguration. To specify how output conﬁgurations are computed from
input ones, a DMN table may have a hit indicator and a completeness indicator.
The hit indicator speciﬁes whether only one or multiple rows of the table may
match a given input, and if multiple rules match an input, how should the output
conﬁguration be computed. The completeness indicator speciﬁes whether every
input conﬁguration must match at least one rule or potentially none. If an input
conﬁguration matches two or more rules, this may contradict the hit policy.
Similarly, if no rule matches an input conﬁguration, this may contradict the
completeness indicator. The former type of contradiction is called overlapping
rules while the latter is called missing rule.
2.2
Analysis of DMN Decision Tables
The need to analyze decision tables from the perspective of completeness (i.e.,
detecting missing rules) as well as consistency and non-redundancy (i.e., detect-
ing overlapping rules) is widely recognized [3]. These two analysis tasks have been
tackled using rough sets [7]. However, this approach requires that the domains
of the input attributes are boolean or categorical. Numerical attributes need to
be previously discretized into intervals. In this paper, we study the problem of
analyzing decision tables with arbitrary S-FEEL expressions, meaning that no
prior discretization of numerical domains is required.
Prologa [9,10] is a tool for modeling and executing classical decision tables.
It supports the construction of decision tables in a way that prevents overlap-
ping or missing rules. It also supports the optimization of a decision table via
rule merging: two rules are merged when all but one of their input entries are
identical, and their output entries are also identical. However, Prologa presents
the same intrinsic limitation of the rough set approach: it requires columns to
have boolean or categorical domains. Hence, numerical domains need again to
be discretized into intervals when constructing a decision table.
Signavio’s DMN editor1 detects overlapping and missing rules. However, the
employed analysis techniques are undisclosed and no empirical evaluation thereof
has been reported. Also, the diagnosis of overlapping and missing rules produced
by Signavio is unnecessarily large: it often reports the same rule overlap multiple
times. This behavior will be further explained in Section 5.
OpenRules2 uses constraint satisfaction techniques to analyze business rules,
in particular rules encoded in decision tables. While using a general solver to
analyze decision tables is an option (e.g., an SMT solver such as Z3 [4]), this
approach leads to a boolean output (is the set of rules satisﬁable?), and cannot
natively highlight speciﬁc sets of rules that need to be added to a table (missing
rules), nor speciﬁc overlaps between pairs of rules that need to be resolved.
3
Formalization
In this section, we provide a logic-based formalization of DMN decision tables,
unanmbiguously deﬁning their input/output semantics, and at the same time
1 http://www.signavio.com
2 http://openrules.com/
introducing several analysis tasks focused on correctness checking. As a con-
crete speciﬁcation language for input entries in DMN, we consider the S-FEEL
language, introduced in the DMN standard itself.
Our formalization is based on classical predicate logic extended with data
types, which are needed to capture conditions that employ domain-speciﬁc pred-
icates such as comparisons interpreted over the total order of natural numbers.
Such formalization is important per s`e, as it deﬁnes a clear, unambiguous se-
mantics of decision tables, and also as an interlingua supporting the comparison
of diﬀerent analysis techniques.
3.1
Data Types and S-FEEL Conditions
We ﬁrst introduce the building blocks of decision tables, i.e., the types of the
modeled attributes, and conditions over such types expressed using the S-FEEL
language. A data type T is a tuple ⟨∆T , ΣT ⟩, where ∆T is an object domain,
and ΣT = ΣP
T ⊎ΣF
T is a signature, constituted by a set ΣP
T of predicate symbols,
and a set ΣF
T of function symbols (disjoint from ΣP
T ). Each predicate symbol
R ∈ΣP
T comes with its own arity n, and with an n-ary predicate RT ⊆∆n
T that
rigidly deﬁnes its semantics. Each function symbol f ∈ΣF
T comes with its own
arity m, and with a function ∆m
T →∆T that deﬁnes its semantics. To make the
arity explicit in predicate and function symbols, we use the standard notation
R/n and f/m. As usual, we assume that every data type is equipped equality
as a predeﬁned, binary predicate interpreted as the identity on the underlying
domain. Hence, we will not explicitly mention equality in the signatures of data
types. In the following, we show some of the S-FEEL data types3:
– TS = ⟨S, ∅, ∅⟩– strings.
– TB = ⟨{true, false}, ∅, ∅⟩– boolean attributes.
– TZ
=
⟨Z, {0/0, 1/0, </2, >/2}, {+/2, −/2, ·/2, ÷/2}⟩– integer numbers
equipped with the usual comparison predicates and binary operations;
– TR (deﬁned as TZ by replacing the domain Z with R, and by reinterpreting
all predicates and functions accordingly) – real numbers equipped with the
usual comparison predicates and binary operations.
The set of all such types is denoted by T. Since decision tables do not support
conditions that combine multiple data types, we can safely assume that the object
domains of all types in T are pairwise disjoint.
S-FEEL allows one to formulate conditions over types. Such conditions
constitute the basic building blocks for facets and rules, which in turn are the
core of decision tables. The syntax of an (S-FEEL) condition Q over type is:
Q ::= “−” | Term | “not(” Term “)” | Comparison | Interval | Q1,Q2
Comparison ::= COp Term
COp ::= “<” | “>” | “≤” | “≥”
Interval ::= (“(” | “[”) Term1 “..” Term2 (“)” | “]”)
Term ::= v | f(Term1, . . . , Termm)
where v is an object and f is an m-ary function.
3 Date/time data types are also supported, but from the logical point of view they
can be considered as simple numeric attributes
Intuitively, S-FEEL supports the following conditions on a given data type
T = ⟨∆T , ΣT ⟩: (i) “−” indicates any value, i.e., it holds for every object in
∆T . (ii) Term is a shortcut for “= Term”, and indicates a matching expression,
which holds for the object in ∆T that corresponds to the result denoted by term
Term. A term, in turn, corresponds either to a speciﬁc object in ∆T , or to the
recursive application of an m-ary function in ΣT to m terms. (iii) Comparison
is only applicable when T is a numeric data type, and indicates a comparison
condition, which holds for all objects that are related via the employed compari-
son predicate to the object resulting from expression Term. (iv) Interval is only
applicable when T is numeric, and allows the modeler to capture membership
conditions that tests whether an input object belongs to the modeled interval.
(v) “Q1,Q2” indicates an alternative condition, which holds whenever one of the
two conditions Q1 and Q2 holds.
Example 1. The fact that a risk category is either high, medium or low can be
expressed by the following condition over TS: “high,medium,low”. By using TZ
to denote the age of persons (in years), the group of people that are underage
or old (i.e., having at least 70 years) is captured by condition “[0..18], ≥70”.
3.2
Decision Tables
We
are
now
in
the
position
of
deﬁning
DMN
decision
tables.
See
Table
1
for
a
reference
example.
A
decision
table
D
is
a
tuple
⟨T, I, O, Type, Facet, R, Priority, C, H⟩, where:
– T is the table name.
– I and O are disjoint, ﬁnite sets of input and output attributes (represented
as strings).4
– Type : I ⊎O →T is a typing function that associates each input/output
attribute to its corresponding data type.
– Facet is a facet function that associates each input/output attribute a ∈I⊎O
to a condition over Type(a), deﬁning the acceptable objects for that attribute.
Facet functions are depicted as “optional lists of values” in Table 1.
– R is a ﬁnite set of rules {r1, . . . , rp}. Each rule rk is a pair ⟨Ifk, Thenk⟩, where
Ifk is an input entry function that associates each input attribute ain ∈I
to a condition over Type(ain), and Thenk is an output entry function that
associates each output attribute aout ∈O an object in Type(aout).
– Priority : R →{1, . . . , |R|} is a priority function injectively mapping rules in
Priority to a corresponding rule number deﬁning its priority. If no priority is
explicitly given, in accordance with the standard we assume that the priority
is implicitly deﬁned by the graphical ordering in which rule entries appear
inside the decision table.
– C ∈{c, i} is the completeness indicator, where c is the default value and
stands for complete table, while i stands for incomplete table.
– H ∈{u, a, p, f} is the (single) hit indicator deﬁning the policy for the rule
application, where: (i) u is the default value and stands for unique hit policy,
4 These are called “expressions” in the DMN standard, but we prefer the term “at-
tribute” as it is less ambiguous.
(ii) H = a stands for any hit policy, (iii) H = p stands for priority hit policy,
and (iv) H = f stands for ﬁrst hit policy.
We now informally review the intuitive semantics of rules and of complete-
ness/hit indicators in DMN, moving to the formalization in Section 3.3.
Rule semantics. Intuitively, rules follow the standard “if-then” interpretation.
Rules are matched against input conﬁgurations, which map the input attributes
to objects in such a way that each object (i) belongs to the type of the corre-
sponding input attribute, and (ii) satisﬁes the corresponding facet. If, for every
input attribute, the assigned object satisﬁes the condition imposed by the rule
on that type, then the rule triggers, and bounds the output attributes to the
actual objects mentioned by the rule.
Example 2. Consider the decision table in Table 1. The input conﬁguration
where Income is 500 and Loan is 4230, triggers rule B.
Completeness indicator. When the table is declared to be complete, the in-
tention is that every possible input conﬁguration must trigger at least one rule.
Incomplete tables, instead, have input conﬁgurations with no matching rule.
Hit policies. Hit policies specify how to handle the case where multiple rules
are triggered by an input conﬁguration. In particular:
– “Unique hit” indicates that at most one rule can be triggered by a given
input conﬁguration, thus avoiding the need of handling how to compute the
output objects in the case of multiple triggered rules.
– “Any hit” indicates that when multiple rules are triggered, they must agree
on the output objects, thus guaranteeing that the output is unbambiguous.
– “Priority hit” indicates that whenever multiple rules trigger, then the out-
put is unambiguously computed by only considering the contribution of the
triggered rule that has highest priority.
– “First hit” can be understood as a variant of the priority hit, in which priority
is implicitly obtained from the ordering in which rules appear in the decision
table. Hence, this case is subsumed by that of priority hit.
– “Collect” implies that multiple rules can match an input conﬁguration and
when this is the case, all matching rules are ﬁred the the resulting out-
put conﬁgurations are aggregated. Aggregation is orthogonal to correctness
checking, and thus we leave the “Collect” policy outside the scope of the
formalization below.
3.3
Formalization of Rule Semantics and of Analysis Tasks
We ﬁrst deﬁne how conditions map to corresponding formulae. Since each
condition is applied to a single input attribute, the corresponding formula has
a single free variable corresponding to that attribute. Given a condition Q over
type T = ⟨∆T , ΣT ⟩, the condition formula for Q, written ΦQ, is a formula using
predicates/functions in ΣT and objects from ∆T , and possibly mentioning a
single free variable, constructed as follows:
ΦQ ≜































true
if Q = “−”
¬ΦTerm
if Q = “not(Term)”
x = Term
if Q = Term
x COp Term
if Q = “COp Term”and COp ∈{<, >, ≤, ≥}
x > ΦTerm1 ∧x < ΦTerm2
if Q = “(Term1..Term2)”
x > ΦTerm1 ∧x ≤ΦTerm2
if Q = “(Term1..Term2]”
x ≥ΦTerm1 ∧x < ΦTerm2
if Q = “[Term1..Term2)”
x ≥ΦTerm1 ∧x ≤ΦTerm2
if Q = “[Term1..Term2]”
ΦQ1x ∨ΦQ2x
if Q = “Q1,Q2”
As usual, we also use notation ΦQ(x) to explicitly mention the free variable of
the condition formula.
Example 3. Consider the S-FEEL conditions in Example 1. The condition over
the risk category is Risk = high ∨Risk = medium ∨Risk = low. The condition
formula person ages is instead: (Age ≥0 ∧Age ≤18) ∨Age ≥70.
With this notion at hand, we now formalize the notions of correctness of rule
speciﬁcations, semantics of rules, and semantics of completeness and hit indica-
tors. These notions are building blocks for an overall notion of table correctness.
Let D = ⟨T, I, O, Type, Facet, R, Priority, C, H⟩be a decision table with m
input attributes I = {a1, . . . , am}, n output attributes O = {b1, . . . , bn}, and p
rules R = {r1, . . . , rp}. We use variables x1, . . . , xm for objects matching the in-
put attributes, and variables y1, . . . , yn for those matching the output attributes.
Facet correctness. We ﬁrst consider the Facet correctness of D, which intu-
itively amounts to check whether all the mentioned input conditions and output
objects are compatible with their corresponding attribute facets.
Given an attribute a ∈I ∪O and a corresponding input variable x, the fact
that x is legal for a is deﬁned as:
Legala(x) ≜ΦFacet(a)(x)
We use this notion in combination with a condition Q over a, so as to check
whether an input variable x matches with Q:
MatchesQ
a (x) ≜Legala(x) ∧ΦQ(x)
Note that for output objects, ΦQ(x) above is a test where x is equated to the
output object.
This derived predicate, in turn, can be used to identify whether Q is com-
patible with a, i.e., whether the condition is speciﬁed in such a way that can
potentially trigger, or is instead contradictory with the facet attached to a:
CompatibleQ
a ≜∃x.MatchesQ
a (x)
Rule semantics. A rule r = ⟨If, Then⟩∈R is triggered by a conﬁguration
x1, . . . , xm of input objects whenever each such object matches with the corre-
sponding input condition:
TriggeredByr(x1, . . . , xm) ≜
^
i∈{1,...,m}
MatchesIf(ai)
ai
(xi)
Two conﬁgurations x and y1, . . . , yn of input and output objects are input-
output related by a rule r = ⟨If, Then⟩∈R if the rule is triggered by the input
conﬁguration, and binds the output as speciﬁed by the output conﬁguration:
IORelr(x, y1, . . . , yn) ≜TriggeredByr(x) ∧
^
j∈{1,...,n}
MatchesThen(bj)
bj
(yj)
Completeness. When declaring that a table is (in)complete, there is no guar-
antee that the speciﬁed rules guarantee this property. To check whether this is
indeed the case, we introduce a formula that holds whenever each possible input
conﬁguration triggers at least one rule:
CompleteD ≜∀x1, . . . , xm.
_
k∈{1,...,p}
TriggeredByrk(x1, . . . , xm)
Hit policies. We start with the unique hit policy, which requires that each
input conﬁguration triggers at most one rule. This can be formalized as follows:
UniqueD ≜∀x.
^
i∈{1,...,p}
TriggeredByri(x) →
^
j∈{1,...,p}\{i}
¬TriggeredByrj(x)
We then continue with the any hit policy. Here multiple rules may be trig-
gered by the same input conﬁguration, but if so, then they must agree on the
output. This can be formalized as follows:
AgreesOnOutputD ≜
^
i,j∈{1,...,p},i̸=j
∀x∀y.TriggeredByri(x)
∧TriggeredByrj(x) →IORelri(x, y)
∧IORelrj(x, y)
We now consider the case of priority hit policy. This requires to reformulate
the rule semantics, so as to consider the whole decision table and the priority of
the rules. In particular, with this hit policy a rule r ∈R is triggered with priority
by an input conﬁguration x if it is triggered by x in the sense speciﬁed above,
and no rule of higher priority is triggered by the same input x:
TriggeredWithPriorityByr(x) ≜TriggeredByr(x) ∧
^
rh∈{r′|r′∈R and Priority(r′)>Priority(r)}
¬TriggeredByr′(x)
With this policy, the relationship between input and output conﬁgurations can
be lifted from the single-rule case discussed above to the whole decision table
by isolating the highest-priority rule that matches with the input conﬁguration,
and by considering its output:
IORelPD(x, y) ≜
_
r∈R
TriggeredWithPriorityByr(x) ∧IORelr(x, y)
Finally, we observe that the priority hit policy may create a situation in which
some rules are never triggered. This happens when other rules of higher priority
have more general input conditions. We formalize this notion by introducing a
formula dedicated to check when a rule r1 ∈R is masked by another rule r2 ∈R:
MaskedByr2
r1 ≜Priority(r2) > Priority(r1)∧∀x.TriggeredByr1(x) →TriggeredByr2(x)
Correctness formula. We now combine the previously deﬁned formulae into
a single formula that captures the overall correctness of a decision table.
We say that D is correct if the following conditions hold:
1. Every table cell, i.e., every input condition or output object, is legal for the
corresponding attribute (considering the attribute type and facet).
2. The completeness indicator corresponds to c iﬀthe table is indeed complete.
3. The rules are compatible with the hit policy indicator:
(a) if the hit policy is u, each input conﬁguration triggers at most one rule;
(b) if the hit policy is a, all overlapping rules (i.e., rules that could simulta-
neously trigger) have the same output;
(c) if the hit policy is p, all rules are “useful”, i.e., no rule is masked by a
rule with higher priority.
Based on the previously introduced formulae, we formalize correctness as:
CorrectD ≜
^
⟨If,Then⟩∈R
 ^
a∈I
CompatibleIf(a)
a
∧
^
b∈O
CompatibleThen(b)
b
!
(1)
∧
 (C = c) ↔CompleteD

(2)
∧
 (H = u) →UniqueD

(3a)
∧
 (H = a) →AgreesOnOutputD

(3b)
∧

(H = p) →
^
r1,r2∈R
¬MaskedByr2
r1

(3c)
Global input-output formula. We combine the previously deﬁned formulae
into a single formula that captures the overall input-output relation induced by
D. This is done by exploiting the notion of input-output related conﬁgurations
by a rule, so as to cover the entire table. Speciﬁcally we say that an input
conﬁguration x and an output conﬁguration y are input-output related by D if:
1. the hit policy is either u or a, and there exists a rule that relates x to y (in
the case of any hit policy, there could be many, but they establish the same
input-output relation, so it is suﬃcient to pick one of them);
2. the hit policy is p, and there exists a rule relating x to y without any other
rule of higher priority that is triggered by x (is such a rule exists, then it is
such rule that has to be selected to relate input-output).
This is formalized as follows:
IORelD(x, y) ≜

(H = u ∨H = a) →
_
r∈R
IORelr(x, y)

(1)
∧


(H = p) →W
r=⟨If,Then⟩∈RTriggeredWithPriorityByr(x)
∧V
j∈{1,...,n} MatchesThen(bj)
bj
(yj)


(2)
4
Algorithms
We now introduce algorithms to handle the two main analysis tasks introduced
in the previous section: detecting overlapping rules and (in)completeness. The
proposed algorithms rely on a geometric interpretation of a DMN table. Every
rule in a table is seen as an iso-oriented hyper-rectangle in an N-dimensional
space (where N is a number of columns). Indeed, an input entry in a rule can
be seen a constraint over one of the columns (i.e. dimensions). In the case of
a numerical column, an input entry is an interval (potentially with an inﬁnite
upper or lower bound) and thus it deﬁnes a segment or line over the dimension
corresponding to that column. In the case of a categorical column, we can map
each value of the column’s domain to a disjoint interval – e.g. “Reﬁnancing”
to [0..1), “Card payoﬀ” to [1..2), “Car leasing” to [2..3), etc. – and we can see
an input entry under this column as deﬁning a segment (or set of segments)
over the dimension corresponding to the column in question. The conjunction
of the entries of a row hence deﬁnes a hyper-rectangle, or potentially multi-
ple hyper-rectangles in the case of a multi-valued categorical input entry (e.g.
{“Reﬁnancing”, “Car leasing”}). The hyper-rectangles are iso-oriented because
only constraints of the form “attribute operator literal” are allowed in S-FEEL
and such constraints deﬁne iso-oriented lines or segments.
For example, the geometric interpretation of Table 1 is shown in Fig. 1. The
two dimensions, x and y, represent the two input columns (Annual income and
Loan size) respectively. The table contains 4 rules: A, B, C, and D. Some of them
are overlapping. For example, rule A overlaps with rule C. Their intersection is
the rectangle [500, 1000] × [500, 1000]. The table also contains missing values.
For example, vector ⟨200, 2000⟩does not match any rule in Table 1.
Fig. 1. Geometric representation of the DMN table shown in Table 1
The algorithms are presented for numeric columns. Minor adaptations (not
discussed here) allow these algorithms to handle categorical columns as well.
4.1
Finding Overlapping Rules
Algorithm 1 ﬁnds overlapping rules in a DMN table. This algorithm is an ex-
tension of line-sweep algorithm for two-dimensional spatial joins proposed in [1].
The idea of this latter algorithm is to pick one dimension (e.g. x-axis), project
all objects into this dimension, and then sweep an imaginary line orthogonal to
this axis (i.e. parallel to the y-axis). The line stops at every point in the x-axis
where either an object starts or ends. When the line makes a “stop”, we gather
all objects that intersect the line (the active list). These objects overlap along
their x-axis projection. In [1], it is then checked if the objects also overlap in
the y-axis, and if so they are added to the result set (i.e. the objects overlap).
Algorithm 1 extends this idea to N dimensions. The algorithm takes as input:
1. ruleList, containing all rules of the input DMN table;
2. i, containing the index of the column under scrutiny;
3. N, representing the total number of columns;
4. OverlappingRuleList, storing the rules that overlap.
The algorithm starts analyzing the ﬁrst column of the table (axis x). All rules
are projected over this column. Note that the projection of a rule on a column
is an interval. We indicate the projection of rule K over axes x and y with
Ix
K and Iy
K respectively. All the intervals are represented in terms of upper and
lower bounds. The bounds are sorted in ascending order (line 7). The algorithm
iterates over the list of sorted bounds (line 8). In the case of Fig. 1, the rules
projected over the x axis correspond are:
A
B
C
D
lower bound
upper bound
Considering the rules above, the algorithm ﬁrst analyzes the lower bound of
Ix
A. Therefore, Ix
A is added to an active list of intervals for the ﬁrst column x,
Lx, since the bound processed is a lower bound (line 13). Next, the algorithm
processes the lower bound of Ix
B and Ix
B is added to Lx. Then, the lower bound
of Ix
C is processed and Ix
C is added to Lx. Finally, the algorithm processes the
upper bound of Ix
B. Every time an upper bound of an interval is processed (line
9), the following column of the table is analyzed (in this case y) by invoking
ﬁndOverlappingRules recursively (line 10).
All the intervals projections on y of the rules corresponding to intervals con-
tained in Lx (in our example A, B, and C) are represented in terms of upper
bounds and lower bounds:
A
B
C
The bounds are sorted in ascending order. The algorithm iterates over the list
of sorted bounds. Considering the intervals above, the algorithm ﬁrst encounters
the lower bound of Iy
A. Therefore, Iy
A is added to the active list of intervals for the
second column y, Ly. Next, the algorithm processes the lower bound of Iy
C and
adds Iy
C to Ly. Then, the upper bound of Iy
C is processed. Since there is no other
column in the table, this means that all the rules corresponding to the intervals
in Ly overlap. At the end of each recursion, the interval corresponding to the
current bound is removed from the current active list (line 11). In addition,
Algorithm 1: Procedure ﬁndOverlappingRules.
Input: ruleList; i; N; overlappingRuleList.
1 if i == N then
2
deﬁne current overlap currentOverlapRules; /* it contains the list of rules that overlap
up to the current point */ ;
3
if !overlappingRuleList.includes(currentOverlapRules) then
4
overlappingRuleList.put(currentOverlapRules);
5 else
6
deﬁne the current list of bounds Lxi;
7
sortedListAllBounds = ruleList.sort(i);
8
foreach currentBound ∈sortedListAllBoundaries do
9
if !currentBound.isLower() then
10
ﬁndOverlappingRules(Lxi,i +1, N, overlappingRuleList); /* recursive call */
11
Lxi.delete(currentBound);
12
else
13
Lxi.put(currentBound);
14
lastBound = currentBound;
15 return overlappingRuleList;
when the last column of the table is processed (line 1), the algorithm checks
whether the identiﬁed set of overlapping rules is contained in one of the other
sets produced in a previous recursion (lines 3). If this is not the case, the new
set of overlapping rules is added to the output list overlappingRuleList (line 4).
In this way, the procedure outputs maximal sets of overlapping rules having a
non-empty intersection stored in overlappingRuleList (line 16).
4.2
Finding Missing Rules
Algorithm 2 describes the procedure for ﬁnding missing rules, which is also based
on the line-sweep principle. The algorithm takes as inputs 5 parameters:
1. ruleList, containing all rules of the input DMN table;
2. missingIntervals, storing the current missing intervals;
3. i, containing the index of the column under scrutiny;
4. N, representing the total number of columns;
5. MissingRuleList, storing the missing rules.
The algorithm starts analyzing the ﬁrst column of the table (axis x). Consider
again the projection of the table in Fig. 1 on x:
A
B
C
D
Upper and lower bounds of each interval are sorted in ascending order (line 3).
The algorithm iterates over the list of sorted bounds (line 4).
Considering the rules above, the algorithm ﬁrst analyzes the lower bound of
Ix
A. Therefore, Ix
A is added to an active list of intervals for the ﬁrst column x, Lx.
An interval is added to the active list only if its lower bound is processed (line
15). If the upper bound of an interval is processed, the interval is removed from
the list (line 17). Next, the algorithm processes the lower bound of Ix
B. Since Lx
is not empty, Ix
B is not added to Lx yet (line 11). Starting from the interval IA,B
(line 12) having the lower bound of Ix
A as lower bound and the lower bound of
Ix
B as upper bound, the following column of the table is analyzed (in this case y)
by invoking ﬁndMissingRules recursively (line 13). All the interval projections
on y of the rules corresponding to intervals contained in Lx (in our example only
A) are represented in terms of upper and lower bounds, obtaining in this case
the following simple situation:
A
The bounds are sorted in ascending order. The algorithm iterates over the list of
sorted bounds. The ﬁrst bound taken into consideration is the lower bound of Iy
A
so that Iy
A is added to Ly (since Ly is empty). Since this bound corresponds to the
minimum possible value for y, there are no missing values between the minimum
possible value for y and the lower bound of Iy
A (line 5). Next, the algorithm
processes the second bound in Ly that is the upper bound of Iy
A. Considering
that the upper bound of Iy
A is the last one in Ly, the algorithm checks if this
value corresponds to the maximum possible value for y (line 5). Since this is not
the case, this means that there are missing values in the area between the upper
bound of Iy
A and the next bound over the same column (in this case area 1). The
algorithm checks if the identiﬁed area is contiguous to an area of missing values
previously found (line 7). If this is the case the two areas are merged (line 8). If
this is not the case, the area is added to a list of missing value areas (line 10). In
our case, area 1 is added to a list of missing value areas. Note that the algorithm
merges two areas of missing values only when the intervals corresponding to one
column are contiguous and the ones corresponding to all the other columns are
exactly the same. In the example in Fig. 1, areas 4 and 6 are merged.
At this point, the recursion ends and the algorithm proceeds analyzing the
intervals in the projection along the x axis. The last bound processed was the
lower bound of Ix
B, so that Ix
B is added to Lx. Next, the algorithm processes the
lower bound of Ix
C (since Lx is not empty, Ix
C is not added to Lx yet). Starting
from the interval IB,C having the lower bound of Ix
B as lower bound and the
lower bound of Ix
C as upper bound, the following column of the table is analyzed
(in this case y) again through recursion.
All intervals projections on y of the rules corresponding to intervals contained
in Lx (in this case A and B) are represented in terms of upper and lower bounds:
A
B
The bounds are sorted in ascending order. The algorithm iterates over the list
of sorted bounds. Considering the rules above, the algorithm ﬁrst processes the
lower bound of Iy
A so that Iy
A is added to Ly (Ly is empty). Then, the upper
bound of Iy
A is processed. When the algorithm reaches the upper bound of an
interval in a certain column the interval is removed from the corresponding
active list. Therefore, Iy
A is removed from Ly. Next, the lower bound of Iy
B is
processed. Since Ly is empty, the algorithm checks if the previous processed
bound is contiguous with the current one (line 5). Since this is not the case, this
means that there are missing values in the area between the upper bound of Iy
A
and the next bound over the same column (in this case area 2). The algorithm
Algorithm 2: Procedure ﬁndMissingRules.
Input: ruleList; missingIntervals; i; N; missingRuleList.
1 if i > N then
2
deﬁne the current list of boundaries Lxi;
3
sortedListAllBoundaries = ruleList.sort(i);
4
foreach currentBound ∈sortedListAllBoundaries do
5
if !areContiguous(lastBound, currentBound) then
6
missingIntervals[i] = constructInterval(lastBound, currentBound);
7
if missingRuleList.canBeMerged(missingIntervals); then
8
missingRuleList.merge(missingIntervals);
9
else
10
missingRuleList.add(missingIntervals);
11
if !Lxi.isEmpty() ) then
12
missingIntervals [i] = constructInterval(lastBound, currentBound);
13
ﬁndMissingRules(Lxi,missingIntervals,i +1, N, missingRuleList); /*
recursive invocation */
14
if currentBound.isLower() then
15
Lxi.put(currentBound);
16
else
17
Lxi.delete(currentBound);
18
lastBound = currentBound;
19 return missingRuleList;
checks if the identiﬁed area is contiguous to an area of missing values previously
found. If this is the case, the two areas are merged. If this is not the case, the
area is added to a list of missing value areas (in our case area 2 is added to a
list of missing value areas). The list of missing areas stored in missingRuleList
is returned by the algorithm (line 19).
5
Evaluation
We implemented the algorithms on top of dmn-js: the open-source rendering
and editing toolkit of Camunda DMN.5 In it current version, dmn-js does not
support correctness veriﬁcation. Our dmn-js extension with veriﬁcation features
can be found at https://github.com/ulaurson/dmn-js and a deployed version
is available for testing at http://kodu.ut.ee/~ulaurson/DMN/.
For the evaluation, we created decision tables from a loan dataset of Lend-
ingClub – a peer-to-peer lending marketplace.6 The employed dataset contains
data about all loans issued in 2013-2014 (23 5629 loans). For each loan, there are
attributes of the loan itself (e.g., amount, purpose), of the lender (e.g., income,
family status, property ownership), and a credit grade (A, B, C, D, E, F, G).
Using Weka [5], we trained decision trees to classify the grade of each loan
from a subset of the loan attributes. We then translated each trained decision
tree into a DMN table by mapping each path from the root to a leaf of the tree
into a rule. Using diﬀerent attributes and pruning parameters in the decision
tree discovery, we generated DMN tables containing approx. 500, 1000 and 1500
rules and 3, 5 and 7 columns (nine tables in total). The 3-dimensional (i.e.
5 https://camunda.org/
6 Dataset available at https://www.lendingclub.com/info/download-data.action
3-column) tables have one categorical and two numerical input columns; the 5-
dimensional tables have two categorical and three numerical input columns, and
the 7-dimensional tables has two categorical and ﬁve numerical input columns.
By construction, the generated tables do not contain overlapping or missing
rules. To introduce missing rules in a table, we selected 10% of the rules. For
each of them, we then randomly selected one column, and we injected noise into
the input entry in the cell in the selected column by decreasing its lower bound
and increasing its upper bound in the case of a numerical domain (e.g. interval
[3..6] becomes [2..7]) and by adding one value in the case of a categorical domain
(e.g. { Reﬁnancing, CreditCardPayoﬀ} becomes { Reﬁnancing, CreditCardPay-
oﬀ, Leasing }). These modiﬁcations make it that the rule will overlap others.
Conversely, to introduce missing rule errors, we selected 10% of the rules, picked
a random column for each row and “shrank” the corresponding input entry.
We checked each generated table both for missing and incomplete rules and
measured execution times averaged over 5 runs on a single core of a 64-bit 2.2
Ghz Intel Core i5-5200U processor with 16GB of RAM. The results are shown in
Table 2. Execution times for missing rules detection are under 2 seconds, except
for the 7-columns tables with 1000-1500 rules. The detection of overlapping rules
leads to higher execution times, due to the need to detect sets of overlapping
rules and ensure maximality. The execution times for overlapping rules detection
on the 3-columns tables is higher than on the 5-columns tables because the 5-
columns tables have less rule overlaps. This is because there are proportionally
less categorical columns in the 5-columns tables than in the 3-columns ones, and
the modiﬁcations made to categorical columns create more overlaps.
In addition to implementing our algorithms, we implemented algorithms de-
signed to produce the same output as Signavio. In Signavio, if multiple rules
have a joint intersection (e.g. rules {r1, r2, r3}) the output contains an overlap
entry for the triplet {r1, r2, r3} but also for the pairs {r1, r2}, {r2, r3} and {r1,
r3} (i.e. subsets of the overlapping set). Furthermore, the overlap of pair {r1, r2}
may be reported multiple times if r3 breaks r1∩r2 into multiple hyper-rectangles
(and same for {r2, r3} and {r1, r3}). Meanwhile, our approach produces only
maximal sets of overlapping rules with a non-empty intersection.
Table 3 shows the number of sets of overlapping rules and the number of
missing rules identiﬁed by our approach vs. Signavio’s one. In all runs, both the
number of overlapping and missing rules is drastically lower in our approach.
3 columns
5 columns
7 columns
#rules
499
998
1 492
505
1 000
1 506
502
1 019
1 496
overlapping time
297ms 6 475ms 24 530ms
200ms 1 621ms 5 374ms 5 715ms 6 793ms 30 736ms
missing time
160ms
611ms 1 672ms
163ms
820ms 1 942ms 2 173ms 7 029ms 18 263ms
Table 2: Execution times (in milliseconds)
6
Conclusion and Future Work
This paper presented a formal semantics of DMN decision tables, a notion of
DMN table correctness, and algorithms that operationalize two core elements of
3 columns
5 columns
7 columns
#rules
499
998
1 492
505
1 000
1 506
502
1 019
1 496
#overlapping
our approach
131
447
812
110
225
378
139
227
371
rule sets
Signavio
1 226 10 920 23 115
679
3 692
8 921 23 175 22 002 62 217
#missing
our approach
117
330
726
136
254
462
134
322
518
rules
Signavio
668
2 655
5 386
563
2 022
4 832
5 201 18 076 43 552
Table 3: Number of reported errors of type “overlapping rules” & “missing rule”
this correctness notion: the detection of overlapping rules and of missing rules.
The algorithms have been implemented atop the DMN toolkit dmn-js. An em-
pirical evaluation on large decision tables has shown the potential for scalability
of the proposed algorithms and their ability to generate non-redundant feedback
that is more concise than the one generated by the Signavio DMN editor.
The proposed algorithms rely on a geometric interpretation of rules in deci-
sion tables, which we foresee could be used to tackle other analysis problems. In
particular, we foresee that the problem of simpliﬁcation of decision tables (rule
merging) could be approached from a geometric standpoint. Indeed, if we see the
rules as hyperrectangles, the problem of table simpliﬁcation can be mapped to
one of ﬁnding an optimal way of merging hyperrectangles with respect to some
optimality notion. Another direction for future work is to extend the proposed
formal semantics to encompass other aspects of the DMN standard, such as the
concept of Decision Requirements Graphs (DRGs), which allow multiple decision
tables to be linked in various ways.
Acknowledgement. This research was partly funded by an Institutional Grant
of the Estonian Research Council.
References
1. Lars Arge, Octavian Procopiuc, Sridhar Ramaswamy, Torsten Suel, and Jeﬀrey
Scott Vitter. Scalable sweeping-based spatial join. In VLDB, 1998.
2. Kimon Batoulis, Andreas Meyer, Ekaterina Bazhenova, Gero Decker, and Mathias
Weske. Extracting decision logic from process models. In CAiSE’15.
3. CODASYL Decision Table Task Group. A Modern appraisal of decision tables : a
CODASYL report. ACM, 1982.
4. Leonardo Mendon¸ca de Moura and Nikolaj Bjørner. Z3: an eﬃcient SMT solver.
In Proc. of TACAS, pages 337–340. Springer, 2008.
5. Mark A. Hall, Eibe Frank, Geoﬀrey Holmes, Bernhard Pfahringer, Peter Reute-
mann, and Ian H. Witten. The WEKA data mining software: an update. SIGKDD
Explorations, 11(1):10–18, 2009.
6. Object Management Group. Decision Model and Notation (DMN) 1.0, 2015.
7. Zdzislaw Pawlak. Decision tables – a rough set approach. Bulletin of the EATCS,
33:85–95, 1987.
8. Udo W. Pooch. Translation of decision tables. Comp. Surv., 6(2):125–151, 1974.
9. Jan Vanthienen and Elke Dries. Illustration of a decision table tool for specifying
and implementing knowledge based systems. International Journal on Artiﬁcial
Intelligence Tools, 3(2):267–288, 1994.
10. Jan Vanthienen, Christophe Mues, and Ann Aerts. An illustration of veriﬁcation
and validation in the modelling phase of KBS development. Data Knowl. Eng.,
27(3):337–352, 1998.

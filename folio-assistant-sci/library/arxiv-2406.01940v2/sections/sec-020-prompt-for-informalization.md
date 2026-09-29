---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-020-prompt-for-informalization
section_title: "Prompt for Informalization"
section_number: null
pages: 21-23
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Below is the few-shot prompt template for querying an LLM to perform formalization. The few-shot
examples are carefully curated to ensure the semantical equivalence, logical validity, and readability
of natural language translations.
Given a statement and its proof written in Lean 4’s syntax, please translate them into the
semantically equivalent natural language that a human reader can independently understand
without knowing any concepts in Lean 4. The translation should accurately convey the same
logical structure and content as the original statement and proof.
You need to explain the theorem and proof in the most intuitive terms possible, but also
maintain the fidelity of the original mathematical reasoning. To do so, first translate the
theorem statement into a natural language problem so that it does not contain any function in
lean 4 (write after "# Problem:"). Then for the proof, you can explain each step of the proof
in natural language based on the meaning of the lemma or tactic that is used (write after "#
Explanation:"). Lastly and most importantly, write the step-by-step proof for the problem in
natural language without mentioning verbatim any function in Lean 4 (write after "# Proof:").
—
Follow the format below.
# Theorem: (theorem and proof in lean 4, to be translated)
# Problem: (theorem in natural language)
# Explanation: (proof in natural language, explaining the functions in lean 4)
# Proof: (proof in natural language, understandable by any human reader without the
knowledge of lean 4 functions)
—
Here are some examples:
# Theorem: theorem eq_zero_iff_even {n : N} : (n : ZMod 2) = 0 ⇐⇒Even n :=
(CharP.cast_eq_zero_iff (ZMod 2) 2 n).trans even_iff_two_dvd.symm
# Problem: Prove that for any natural number n, n is even if and only if n is congruent to 0
modulo 2.
21
Work in progress
# Explanation: The proof uses the following chain of reasoning:
1.
CharP.cast_eq_zero_iff (ZMod 2) 2 n: This lemma states that for any
natural number n, n is congruent to 0 modulo 2 if and only if the remainder when n is
divided by 2 is 0.
2. even_iff_two_dvd.symm: This lemma states that a number is even if and only if it
is divisible by 2.
3. .trans: This tactic combines the two lemmas by showing that if n is congruent to 0
modulo 2, then the remainder when n is divided by 2 is 0, and therefore n is divisible by 2,
which means n is even.
# Proof: We need to prove both directions of the "if and only if" statement.
**Direction 1: If n is even, then n is congruent to 0 modulo 2.**
If n is even, then by definition, n is divisible by 2. This means that the remainder when n is
divided by 2 is 0. Therefore, n is congruent to 0 modulo 2.
**Direction 2: If n is congruent to 0 modulo 2, then n is even.**
If n is congruent to 0 modulo 2, then the remainder when n is divided by 2 is 0. This implies
that n is divisible by 2. Hence, n is even.
Since we have proven both directions, we have shown that a natural number n is even if and
only if n is congruent to 0 modulo 2.
# Theorem: theorem forall_mem_comm {α β} [Membership α β] {s : β} {p : α →
α →Prop} :
(∀a (_ : a ∈s) b (_ : b ∈s), p a b) ⇐⇒∀a b, a ∈s →b ∈s →p a b :=
forall_cond_comm
# Problem: Prove that for any set s, a property p holds for all elements a and b in s if and
only if, for every pair of elements a and b in the set s, the property p holds between them.
# Explanation:
1. The original statement involves checking whether a property p holds for elements a and b
in a set s.
2. The left-hand side of the equivalence states that for every a in s, for every b in s, the
property p(a, b) holds.
3. The right-hand side of the equivalence restates this, but in a more traditional way, using
implications. It says that for every a and b, if a ∈s and b ∈s, then p(a, b) holds.
4. The tactic forall_cond_comm helps translate between these two forms, essentially
commuting the logical structure of the quantifiers and conditions.
# Proof:
We need to show that these two forms are logically equivalent.
**First direction (left to right)**:
Suppose we are given that for all elements a ∈s, for all b ∈s, the property p(a, b) holds.
This directly means that, for any a and b, if both a and b are in the set s, then p(a, b) is true.
Therefore, if a ∈s and b ∈s, we know that p(a, b) holds by the original assumption.
**Second direction (right to left)**:
Now assume that for every pair of elements a and b, if a ∈s and b ∈s, then p(a, b) holds.
This means that for any a ∈s, we can take any b ∈s, and the property p(a, b) must hold.
Thus, the condition on p is satisfied for all such pairs within s.
Since both directions of the equivalence are proven, the two forms of the statement are
logically equivalent. Therefore, the property p holds for all pairs of elements in the set s if
and only if, for each a ∈s and b ∈s, the property p(a, b) holds.
# Theorem: theorem asq_pos : 0 < a ∗a :=
le_trans (le_of_lt a1)
(by have := @Nat.mul_le_mul_left 1 a a (le_of_lt a1); rwa [mul_one] at this)
# Problem: Prove that the square of any natural number is greater than 0.
# Explanation: The proof uses the following steps:
1. a1: This refers to the fact that a is greater than 0, which is a premise of the theorem.
2. le_of_lt a1: This lemma states that if a is greater than 0, then 0 is less than or equal
to a.
3. Nat.mul_le_mul_left 1 a a (le_of_lt a1): This lemma states that if 1 is
22
Work in progress
less than or equal to a (which is true because a is a natural number and greater than 0), and
0 is less than or equal to a (from step 2), then 1 multiplied by a is less than or equal to a
multiplied by a.
4. rwa [mul_one] at this: This tactic rewrites the goal using the lemma mul_one,
which states that 1 multiplied by any number is equal to that number. This simplifies the goal
from 1 ∗a ≤a ∗a to a ≤a ∗a.
5. le_trans: This tactic combines the inequality 0 ≤a (from step 2) with the inequality
a ≤a ∗a (from step 4) to conclude that 0 < a ∗a.
# Proof:
1. We know that a is a natural number greater than 0.
2. Since a is greater than 0, we can say that 0 ≤a.
3. We can also say that 1 is less than or equal to a because a is a natural number and greater
than 0.
4. Multiplying both sides of the inequality 0 ≤a by a, we get 0 ∗a ≤a ∗a.
5. Since multiplying any number by 0 results in 0, the inequality becomes 0 ≤a ∗a.
6. We also know that multiplying any number by 1 doesn’t change its value, so 1 ∗a is the
same as a.
7. Combining this with the fact that 1 ≤a, we get a ≤a ∗a.
8. Since 0 ≤a and a ≤a ∗a, we can conclude that 0 < a ∗a.
9. Therefore, the square of any natural number is greater than 0.
# Theorem: {Theorem}
# Problem:
E

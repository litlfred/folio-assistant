---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-111-bai-comparison-with-prior-work-and-proof-details
section_title: "BAI Comparison with Prior Work and Proof Details"
section_number: null
pages: 153-154
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We provide below a comparison with prior work on best arm identification along with
complete proof details for Section 4.4.
B.5.1
Comparison With Prior Work
First, let us compare the BAI task in [MMT+24] to ours. In their work, they study the
task of identifying the arm with the greatest single pull in the instance (this equals the
pull of that arm at time T due to reward monotonicity). In our work, we study the task
of identifying the arm with the greatest cumulative reward in the instance. While these
tasks are slightly different, we note that both are important and relevant tasks, and the
best arm for one task will be a 2-approximation (that is, not be more than a factor of two
suboptimal) for the other task. On the one hand, consider a setting in which each arm
is a technology, and investing in developing the technology increases its utility. If we are
interested in identifying one out of many technologies that will have the highest utility
after the investment period, we are interested in identifying the arm with the highest
single pull, corresponding to [MMT+24]’s setting. On the other hand, consider a setting
in which each arm is an advertisement, and the reward associated with a pull is the amount
of money a user spends as a result of that advertisement. A corporation would care to
identify the arm that has the highest cumulative reward and then use that arm for future
users. Thus, both are interesting and valid goals albeit slightly different from each other.
Having defined the tasks, we will now see more clearly that the difference in the
“niceness” conditions relates to this, as well. We consider the deterministic variant of
the setting which is the focus of this work (that is, set the stochasticity in the instances
to zero). Now, we study the conditions and terms in Theorem 4.1 of [MMT+24]. Note
that setting the stochasticity to zero implies ϵ, σ = 0 . Then, y is no longer a function
of a , and thus Eqn. 4 is satisfied for all a , so we can achieve BAI with probability 1 if
the conditions are met. This is the same guarantee we achieve, and so we are ready to
compare the conditions more carefully.
In [MMT+24], they study yi , the number of pulls of arm i until the first difference is
smaller than the average gap between the best single pull over all arms and the best single
138
pull of this arm. This quantity corresponds to our quantity hi(ϵ) , which is the number
of pulls of arm i after which the amount of cumulative reward we could achieve if we
continued growing with the same slope is bounded by ϵ. Thus, both yi and hi study how
quickly arms “converge” to their final value, yi directly in the value (of individual pull)
sense and hi in the cumulative sense.
Finally, we note that [MMT+24] compares the sum of these “convergence times” to
(1−ι)T , whereas we compare to a parameter B . In both cases, the smaller the comparison
value, the more value we can extract from the best arm in the remaining ιT or T −B
time. Thus, the overall flavor of the conditions in both works is the same, namely that if
arms “converge quickly,” then BAI is possible. The exact notions of the words in quotes
is what differs.
B.5.2

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-074-which-wins-trust-fund-or-grit
section_title: "Which Wins? Trust Fund or Grit?"
section_number: null
pages: 104-104
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we combine the pieces from the previous sections to understand the inter-
play between grit and financial support. We primarily present conclusions in this section;
the calculations behind these conclusions are presented in detail in the Appendix. Here,
the rate of increase is unknown, and there is also a cost to striving. Let us make two
comparisons. First, let us investigate what happens when someone without a trust fund
becomes more gritty. Then, we will study the effect of a trust fund on two people, one of
whom is grittier than the other.
No trust fund, increased grit. For this, let us compare the first two rows of the Table
below. Immediately, we see that increased grit, as before, leads to increased exploration
time. In the last column, we present the reward that the agent receives if they don’t
witness the start of the payoff before switching, which we call “stable reward” for short.
There, we can also see that the stable reward is lower when the agent is grittier.
Introduce trust fund, same grit. Now, let us compare the first and third rows of the
table below. In this case, we see that at the same grit level, the presence of a safety net
allows for a much longer exploration horizon. Both in the presence of and in the absence
of the safety net, the stable reward is the same. This shows that the presence of a safety
net allows for essentially “free” exploration.
Discussion
We can view these results from two perspectives.
One perspective is descriptive: we
observe that providing a safety net increases exploration time essentially “for free.” This
happens since the agent does not have to split their time to ensure they are not in the

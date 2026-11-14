---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-053-extension-to-multiple-groups
section_title: "Extension to multiple groups"
section_number: null
pages: 86-87
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we remove the strong assumptions of the previous section, namely that (1)
the government knows the correct action and (2) everyone has the same correct action.
Perhaps a more natural assumption would be that there are k groups, where each group
has its own correct action (between the two, A and B). In this section, we show how to
develop a subsidy scheme in which all groups end up in their respective correct cascade,
even if the government is not privy to the respective correct actions.
In this setting, an agent in a group only sees other agents from their group.
For
example, consider a small town where the decisions of a student are primarily, if not
completely, affected by those in the same town.
Suppose the government knows the
strength of signals provided to agents, but it does not know the agent’s town nor which
action they take. At each time t, the government may give a subsidy rt with the goal that,
eventually, all groups will reach a stable up cascade on the correct action for that group.
In this section, we show how the government can construct a distribution D without
knowledge of anything more than described above, such that if at each time rt ∼D ,
after sufficiently many steps, with high probability, all groups will have converged to their
respective correct cascades. Importantly, the key idea here is the same as in Algorithm 6:
one kind of subsidy that will help each group make decisions that are right for them in
the long run is one that encourages an agent to reveal their signal. Further, recall that we
derived exactly a signal-revealing subsidy in the previous section. Thus, we know that for
each value of |A|−|B| , i.e., for each location along the random walk, there exists a value of
the subsidy that incentivizes the agent to reveal their signal. Provided this subsidy value
71
is chosen with at least some fixed minimum probability, we can use a similar random walk
analysis to before, only this time slowed down by that probability factor. In this section,
we flesh this argument out. Proofs can be found in the Appendix in the full version.
6.4.1

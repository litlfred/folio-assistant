---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-014-cheaper-q-llm-models-have-little-impact-on-utili
section_title: "Cheaper Q-LLM Models Have Little Impact on Utility"
section_number: null
pages: 12-14
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
As mentioned in Section 5.1, the models powering the P-LLM and the Q-LLM need not be the same:
in fact, as the tasks assigned to the Q-LLM by the P-LLM are usually relatively simple, we can use
a cheaper, less powerful model as a backbone for the Q-LLM. We indeed observe that the drop in
utility caused by using a cheaper Q-LLM is negligible: when using Claude 3.5 Haiku as Q-LLM in
combination with Claude 4 Sonnet as P-LLM, we observe a reduction in utility of about 1% for an
estimated 12% reduction in cost for the median task. We observe a similar drop in utility when
employing GPT 4.1 Nano as Q-LLM in combination with o4 Mini High.
12
Defeating Prompt Injections by Design
Table 1 | Categorizing Claude’s failures across task suites. Claude exhibited eight failure modes,
including query misunderstanding, data requiring action, wrong assumptions, not enough context,
overdoing it, ambiguous tasks, underdocumented API, and AgentDojo bugs. The table shows the
number of instances of each failure mode. For example, there were 2 instances of query misunder-
standing, 3 instances of wrong assumptions, and 5 instances of not enough context for the Q-LLM.
Workspace
Banking
Slack
Travel
Correct
31
12
14
5
62
Query misunderstanding
The model misunderstands the user’s intent.
1
1
Data requires action
The P-LLM would need to take action based
on some data that only the Q-LLM sees.
2
3
5
Wrong assumptions from P-LLM
For example, the P-LLM assumes at
what time of the day a meeting should start.
1
1
1
3
Not enough context for Q-LLM
The Q-LLM does not have a way to
communicate what information is needed.
2
3
5
Q-LLM overdoes it/Strict eval
For example the Q-LLM transforms
a list instead of copy-pasting it.
3
3
Ambiguous task
Task that is ambiguous on purpose
and should not be executed.
1
1
Underdocumented API
The API returns data in a
structure that is not documented.
13
13
AgentDojo bug
Bug in AgentDojo’s evaluation.
2
1
3
40
16
20
20
13
Defeating Prompt Injections by Design

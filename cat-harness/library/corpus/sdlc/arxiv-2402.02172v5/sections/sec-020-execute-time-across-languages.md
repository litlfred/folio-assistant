---
doc_id: arxiv-2402.02172v5
doc_title: "CodeAgent : Autonomous Communicative Agents for Code Review"
section_id: sec-020-execute-time-across-languages
section_title: "Execute Time Across Languages"
section_number: null
pages: 16-17
source_pdf: arxiv-2402.02172v5.pdf
source_sha256: aedb2b60076ad951
toc_source: outline
---
As depicted in the data, we observe a significant
trend in the average execution time for code re-
views in CodeAgent across various program-
ming languages. The analysis includes nine lan-
guages: Python, Java, Go, C++, JavaScript, C, C#,
PHP, and Ruby. For each language, the average
execution time of code reviews for both merged
and closed pull requests (PRs) is measured. The
results, presented in Figure 6, indicate that, on av-
erage, the execution time for merged PRs is longer
than that for closed PRs by approximately 44.92
seconds. This considerable time difference can be
attributed to several potential reasons. One pri-
mary explanation is that merged PRs likely un-
dergo a more rigorous and detailed review process.
They are intended to be integrated into the main
codebase, and as such, contributors might be re-
quested to update their commits in the PRs more
frequently to adhere to the project’s high-quality
standards. On the other hand, closed PRs, which
are not meant for merging, might not require such
extensive review processes, leading to shorter re-
view times on average, which may also be the rea-
son they are not merged into main projects.
Python
Java
Go
C++
JavaScript
C
C#
PHP
Ruby
200
250
300
350
400
450
Execution Time (seconds)
Average Execution Time with Patterns for Different Programming Languages
Category
Merged
Closed
Figure 6: Execution time with CodeAgent across dif-
ferent language (count unit: second).
D
Comparative Analysis of QA-Checker
AI System and Recursive
Self-Improvement Systems
In this section, we will delve into the differences
between QA-Checker and self-improvement sys-
tems (Hong et al., 2023), and underscore the im-
portance of the QA-Checker in role conversations.
D.1

---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-002-2-motivation
section_title: "Motivation"
section_number: 2
pages: 2-3
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Repository-level issue resolution reveals the fundamental limited
observation scope that agentic approaches face in complex software
engineering scenarios [5, 7]. While individual agents can success-
fully handle straightforward localization tasks, they systematically
fail when multiple code locations appear relevant to issue descrip-
tions, requiring comprehensive architectural understanding and
careful evaluation of competing modification plans [32, 48]. The
core challenge lies in the inherent perspective limitations that pre-
vent single agents from accurately assessing the trade-offs between
multiple viable solutions [2, 9].
The Individual Exploration Problem As illustrated in Fig-
ure 1, single-agent individual exploitation approaches rely on indi-
vidual exploration where agents independently understand code
repositories and propose modification plans without systematic
evaluation of alternative approaches. Consider the Django-11999
issue where users cannot override get_FOO_display() methods
in Django 2.2+. The isolated agent performs semantic search with
query "get_FOO_display impl" and immediately focuses on django/
db/models/base.py, specifically the _get_FIELD_display method.
This individual exploration path appears reasonable from a single
perspective but represents a fundamental misunderstanding of the
issue’s root cause.
The individual exploration approach exemplifies the core limited
observation scope problem [6, 14]: the agent cannot systemati-
cally evaluate whether the base method implementation or the
field registration mechanism contains the actual fault source [32],
lacks the diverse reasoning perspectives necessary to compare run-
time workarounds against structural solutions [18, 52], and cannot
effectively analyze the architectural trade-offs between different
modification plans [1, 10]. This individual exploration limitation
prevents the agent from reconsidering its fundamental localization
strategy when initial approaches fail, leading to inefficient trial-and-
error cycles that characterize single-agent individual exploration
methods.
Multi-Agent Debate Resolution The correct resolution re-
quires recognizing that method override failures stem from the
field registration process in Field.contribute_to_class, where
Django unconditionally overwrites user-defined methods during
class construction. This structural insight emerges through multi-
agent debate where different agents examine alternative code re-
gions and systematically defend their localization strategies against
competing interpretations, moving beyond individual exploration
to structured competitive analysis [2, 9].
In the Django-11999 case, multi-agent debate directly addresses
the limited observation scope: Agent A advocates for modifying
the base _get_FIELD_display method while Agent B argues for
intervention in Field.contribute_to_class, forcing systematic
comparison of these structurally different approaches. Through
structured debate, different agents defend competing modifica-
tion philosophies—runtime flexibility versus source-level preven-
tion—revealing architectural trade-offs and maintainability impli-
cations that are invisible to individual exploration. When initial
approaches fail, competitive pressure prevents agents from aban-
doning promising directions and instead drives systematic analysis
of why specific strategies succeed or fail, transforming individual
exploration into collaborative reasoning that enables comprehen-
sive evaluation of the architectural soundness of different solutions.
Through this debate process, agents discover that the contribute_
to_class approach provides superior design properties: it prevents

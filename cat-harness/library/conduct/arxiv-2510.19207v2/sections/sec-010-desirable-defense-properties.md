---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-010-desirable-defense-properties
section_title: "Desirable Defense Properties"
section_number: null
pages: 4-5
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
An ideal prompt injection defense should have the following
properties.
1) Secure:
The
defense
effectively
mitigates
various
prompt injection attacks, and is applicable in all rea-
sonable sample domains.
2) Utility-Preserving: The defense, when implemented,
does not decrease the system’s utility when there is no
prompt injection.
3) Model-Agnostic: The defense can be used to directly
protect any backend model without further efforts, in-
cluding proprietary models whose weights are not avail-
able to the defender. It can also be easily disabled in
settings where there is no possible prompt injection.
Existing defenses only have limited portions of those proper-
ties, see Table I. Fine-tuning defenses [51, 13, 14, 15, 46, 16]
are most effective, and suffer little loss of utility when trained
properly [13]. However, they are inherently model-dependent
TABLE I: DataFilter is the first model-agnostic defense that
offers significant security with negligible utility drop. For
model-agnostic, we refer to the property that the defense
development/deployment is not dependent on the backend
model it is designed to protect.
Defense Type
Security
Utility
Model-Agnostic
Fine-Tuning-Based [13]
✓
✓
×
Prompting-Based [20]
×
✓
✓
Detection-Based [41]
✓
×
✓
System-Level [9]
✓
×
✓
DataFilter (ours)
✓
✓
✓
and can only be used to protect models whose weights are
known, so third parties cannot use fine-tuning defenses to
protect state-of-the-art proprietary models. Prompting-based
defenses [56] tend to preserve utility, and can be used with any
LLM, but they offer poor security: attack success rates can be
over 40% [47, 50, 49, 48]. Detectors are designed to effectively
reject inputs with prompt injections and so are model-agnostic,
but tend to over-refuse when there is no attack, leading to
noticeable utility drop (see Table V). Recently, system-level
defenses have emerged as an approach that can provide strong
security and be used with any existing model. However, they
may require non-trivial effort from the system developer.
Also, current system-level defenses remain ineffective against
certain attacks that do not interfere with control or data flow.
The defended system’s utility is significantly limited in tasks
where the data is expected to influence the control flow [9, 12].

---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-008-34-routing-stress-test
section_title: "Routing Stress Test"
section_number: 3.4
pages: 3-4
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
(Section 3.4) and the exemplar analysis (RQ4) to avoid letting
one repository dominate. A small enterprise or private-repo
bias is unavoidable; we address its external-validity implica-
tions in Section 6.
We also collected GitHub issues from 12 major agent plat-
form repositories using 28 skill-related queries; filtering 6,233
issues yielded 761 relevant issues classified by defect cate-
gory.
3.2
Defect Taxonomy
We organize defects around the lifecycle of reuse. A skill
must first be selected, then loaded, then supported by exter-
nal resources, then executed safely in an environment that
may differ from the one where it was authored. We devel-
oped the taxonomy through three iterative passes. First, we
read the official Agent Skills specification [2] and the Claude
Code skills documentation [3] clause by clause, extracting
each verifiable structural requirement into a candidate Tier 1
detector. Second, we coded a stratified sample of 300 skills
(drawn across platforms and size buckets) for failure pat-
terns that did not map onto a spec clause but recurred in
practice—install boilerplate, hardcoded credentials, persona
redefinition, platform-specific paths—and clustered them
against the peer-reviewed literature on prompt injection,
instruction hierarchy, hardcoded secrets, and software porta-
bility [5, 8, 12, 15] to form Tier 2. Third, we cross-validated
the candidate categories against the 761 GitHub issues we
collected (Section 3.1): every category in the final taxonomy
is grounded in either a spec clause or an observed real-world
failure mode reported by skill consumers. The two tiers are
kept separate by design so that compliance violations and
best-practice issues can be reported and prioritized indepen-
dently rather than blurred into a single “defect” bucket. We
use the term detected defect for a measurable property of
a skill file that either violates the official specification or
contravenes established best practices, and for which we can
point to documented evidence of real-world harm (GitHub
issues, benchmark regressions, or security advisories). The
taxonomy is designed for static characterization: it identifies
skills that may be harder to route, load, maintain, execute
safely, or reuse outside their original context. Each rule was
operationalized as a regex-based or structural detector ap-
plied to the parsed skill.
Tier 1: Spec Conformance (14 checks). These rules are
grounded directly in the official Agent Skills specification [2]
and Claude Code documentation [3]. Violations affect the
core reuse path: missing or non-functional descriptions cause
routing failures, oversized bodies increase context cost, and
redundant content wastes scarce context tokens.
• R1. Routing Metadata (6 checks): missing, too-short, too-
long, or non-functional descriptions; routing information
misplaced in body.
• R2. Body Content (5 checks): oversized bodies, non-
actionable content, obvious explanations, name-as-heading
duplication, description duplication.
• R3. Resource Organization (3 checks): excessive inline
code, too many examples, monolithic skills (i.e., large skills
that do not use the recommended scripts//references/
subdirectories).
Tier 2: Best Practice Compliance (17 checks). These
rules are derived from peer-reviewed security and software
engineering literature.
• R4. Prohibited Content (4 checks): install instructions,
changelogs, license text, unfinished markers (e.g., TODO,
FIXME) [4].
• R5. Behavioral Safety (6 checks): hardcoded credentials,
safety bypasses (e.g., –no-verify), prompt injection pat-
terns, unguarded destructive actions (e.g., rm -rf), error
suppression, user path leakage [12, 13, 16].
• R6. Portability (4 checks): hardcoded model names (e.g.,
gpt-4o), platform-specific paths, platform-specific tool
calls, OS-specific commands (e.g., pbcopy) [2, 8].
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
Chi Zhang, Yimin Liu, Xinze Chen, and Ping Ji
• R7. Persona & Scope (3 checks): persona redefinition (e.g.,
“you are a...”), instruction overrides, scope mismatches [5,
15].
Figure 1 presents the complete taxonomy as a hierarchi-
cal tree. Tier 1 categories (dashed box) are grounded in the
official specification; Tier 2 categories are grounded in peer-
reviewed literature and industry standards.
The resulting taxonomy contains 31 checks across the
seven categories listed above.
3.3

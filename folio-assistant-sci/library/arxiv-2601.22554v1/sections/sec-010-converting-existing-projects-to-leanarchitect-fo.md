---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-010-converting-existing-projects-to-leanarchitect-fo
section_title: "Converting Existing Projects to LeanArchitect Format"
section_number: null
pages: 6-7
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
We tested the conversion script on the following projects into LeanArchitect, at Lean version v4.25.0:
1. Carleson [2]
2. Brownian Motion [9]
3. Infinity Cosmos [19]
4. Fermat’s Last Theorem [4]
5. Prime Number Theorem And [13]
For each project, we first added LeanArchitect to the lakefile, and then ran the conversion script. For the
most part, the script is able to automatically convert blueprint nodes into Lean @[blueprint] attributes.
3See the GitHub pull request.
4See the Zulip comment.
LeanArchitect
7
During conversion, we found some discrepancies between the converted blueprint and the original one. This
revealed some issues with the original manually written blueprint that could be uncovered and automatically
fixed by LeanArchitect, such as:
• Isolated nodes that were actually not used, such as a layer-cake theorem eLpNorm_pow_eq_distribution
not used in Carleson (a related theorem eLpNorm_eq_distribution was used instead)
• Missing dependency edges, such as internalCoveringNumber_eq_one_of_diam_le incorrectly marked as
unused in Brownian Motion
• Theorems in Mathlib that should have been marked \mathlibok
• Oversimplified setups, such as Infinity Cosmos only applying \leanok and \uses on statements and not
proofs of theorems.
In general, the conversion script successfully converts projects into LeanArchitect format. As LeanArchitect
automates the previously manual specification of \leanok and \uses, it ensures the blueprint is in sync with
the Lean formalization status.
4.3

---
doc_id: ihe-iti-vhl-1-0-0-comment
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL)"
section_id: s005-trust-anchor-neutrality
section_title: "Trust-Anchor Neutrality"
file: "ihe-iti-vhl-1-0-0-comment.md"
lines: 31-34
source_sha256: e2775b089a9763ff
granularity: heading
---
### Trust-Anchor Neutrality

IHE VHL is **trust-anchor neutral** by design. The **Trust Anchor** actor represents any trust framework authority capable of accepting PKI material (`[ITI-YY1]`) and distributing verifiable trust lists (`[ITI-YY2]`). The **WHO Global Digital Health Certification Network (GDHCN)** is one possible Trust Anchor implementation among others (such as national health PKI roots, regional cross-border trust networks, or bilateral federation anchors). No VHL transaction hardcodes a single trust network host; participants resolve issuer and receiver keys through the configured Trust Anchor's `[ITI-YY2]` trust list.

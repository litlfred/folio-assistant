---
# folio-assistant-ieum
title: 'ZERO-TRUST PIPELINE: every value a tool or agent receives is suspect — agent handover, skill input, per-tool risk assessment, release security gate, supply chain (software/tool/KG)'
status: in-progress
type: epic
created_at: 2026-10-07T05:56:11Z
updated_at: 2026-10-07T05:56:11Z
---

## The ask, owner 2026-10-07 — verbatim

> need better security protection when agenet to agnt handover, and in general when utilizeing Iinput from a skill. ALL DATA IN PIPELINE MUST BE TREATED AS SUSPECT. ALL TOOLS ARE REPOSNSIBLE TO GUARD AGAINST CODE INJECTION, PROMPT ENGINEERING, VARIABLE TAMPERING, etc.
>
> different tools will have different securty risk assessments and best practices. all tools needed assessment QA. need also to protect software supply chain/tool supply chain/KG supply chain. will need in future notion of trusted (w/ digital signed proveannce as in swiss Trusted Data Observatory) KGs, checking digital singatures on the KG json(ld) iteslef or its assets.

Then, scoping it for now:

> for now, ingest materials, make voices/methodologies for code authroing agents, update tools processes. security check before release (for example).
>
> tools may be in place but not utilized fully probably

Sources supplied: Ars Technica on MCP "protocol pivoting" (2026-10-06), Ars Technica on BadHost CVE-2026-48710 in Starlette (2026-05-26), Rapid7 CVE-2026-97228, GitHub Docs "Secure use reference".

## Done when (this round)

- [x] GitHub Docs secure-use reference ingested (CC-BY-4.0) — `library/github-docs-actions-secure-use-reference`
- [ ] the three all-rights-reserved sources recorded reference-only (no bytes, no text held)
- [ ] utilisation audit: which existing security gates/tools exist, and which processes/CI actually invoke them
- [ ] voice for code-authoring agents (`secure-code-authoring`), every rule cited
- [ ] methodology node: zero-trust handover (value-not-provenance at every agent/tool boundary)
- [ ] release process carries a security gate step
- [ ] per-tool security risk assessment: a `tool` QA criterion

## Not this round (future, recorded so it is not lost)

- trusted KGs with digitally signed provenance; signature verification on KG JSON-LD and its assets (owner names the Swiss Trusted Data Observatory as the model — not yet researched or held)

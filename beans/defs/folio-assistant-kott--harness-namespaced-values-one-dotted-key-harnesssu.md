---
# folio-assistant-kott
title: 'Harness-namespaced values: one dotted key <harness>.<subgraph...>.<name> for :val AND site.data'
status: todo
type: task
created_at: 2026-09-30T10:16:19Z
updated_at: 2026-09-30T10:16:19Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: 'can we do something like bootstrap.blah, cat-harness.blah.blah, etc...?' Extends the 12s9 ruling (prefix = the DECLARING Subgraph's path joined with dots) from BPMN/schema prefixes to VALUES, and supersedes the prefix:name proposal on #1564.

## The design
- One key per value: <harness>.<subgraph...>.<name>, e.g. cat-harness.build.version, fhir-harness.<ig>.ig.version, qou.computations.Vol_4_1. A bare name stays 'this folio's own' so qou's 62 existing :val uses keep working.
- ONE store: each harness writes its values to _data/<harness>.json (a declared writer per harness), with provenance per value (witness commitSha/scriptHash; library IRI + source_sha256 + licence; IG packageId/version/canonical).
- Two readers of the SAME store: Jekyll resolves {{ site.data.<harness>.<path> }}; the platform resolver resolves :val[<harness>.<path>] for LaTeX/PDF/blueprint and for markdown targets. Same key, same value, every target.
- The registry is loaded from the folio's declaration, not a --preload flag (fixes CI, where :val would throw today).

## Done when
- [ ] :val grammar admits dotted harness paths (render-value.ts MATH_VAL_PATTERN and the occurrence scanner)
- [ ] per-harness _data/<harness>.json writers, each declared, each value with provenance; --check fails a value without provenance
- [ ] resolver reads the same store for LaTeX and markdown targets; a cross-target consistency test (one fixture, same text everywhere)
- [ ] registry loaded from the folio declaration; publish/blueprint CI no longer needs --preload
- [ ] qou's CODATA values move from vendored Python to an ingested, provenance-carrying dataset (qou work — ask the author before any qou PR)

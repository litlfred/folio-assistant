---
# folio-assistant-kott
title: 'Harness-namespaced values: one dotted key <harness>.<subgraph...>.<name> for :val AND site.data'
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:16:19Z
updated_at: 2026-09-30T15:42:28Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: 'can we do something like bootstrap.blah, cat-harness.blah.blah, etc...?' Extends the 12s9 ruling (prefix = the DECLARING Subgraph's path joined with dots) from BPMN/schema prefixes to VALUES, and supersedes the prefix:name proposal on #1564.

## The design — as confirmed by the owner, 2026-09-30

Owner: *"{{ site.data...}} is declared for fhir-harness only... it declares its site prefix. bootstrap is {{ bootstrap.blah }} and {{ bootstrap-tools.blah.blah }} so existing IG publisher works as is, and we can augment with KG variables/witness variables"*; *"CODATA ... variables be like {{ qou.library.codata-2022.mass-electron }}"*; *"double check paths i proposed, not set in stone"*. Confirmed: *"Yes, build it"*.

- **Syntax: Liquid `{{ … }}`, one syntax for every target.** `:val` becomes a deprecated alias until qou migrates.
- **Each harness instance declares its Liquid prefix; the default is its name.** fhir-harness declares `site.data` as PASS-THROUGH: Jekyll and the IG Publisher resolve it, exactly as today (bean `bamf` populates `_data/` for just-the-docs).
- **Address = a path in the KG:** `<instance>.<declared-directory-id>.<entry>.<exact json path>`.
  - `{{ qou.computations.codata-masses.data.m_e_MeV }}`: the witness `computations/codata-masses.witness.json`, path `data.m_e_MeV`.
  - `{{ qou.library.codata-2022.mass-electron }}`: an ingested library dataset (bean for CODATA ingestion).
  - `{{ bootstrap.version }}`: a scalar from the declaration itself; a clash between a directory id and a declaration field is refused.
  - Checked against the declarations (2026-09-30): the `folio.` segment first proposed is redundant — qou IS an instance named `qou`. Only DECLARED directories are addressable, so qou must declare `library` and `computations` (it declares only `folio` today) — qou work, ask the author before any qou PR.
- **One resolver, run BEFORE Jekyll / the IG Publisher / LaTeX,** substitutes every declared, non-pass-through prefix; anything else (`site.*`, `page.*`) passes through untouched. Filters: `| precision: N` (significant digits), `| scientific`. Every resolution carries provenance (the file, the path, and the witness `commitSha`/`scriptHash` when present).

## Done when
- [x] declaration: optional Liquid prefix (default name; `passThrough` for fhir-harness's `site.data`)
- [x] resolver: declaration scalars + witness JSON under a declared directory (library datasets follow the CODATA bean `uyp8`)
- [x] both render paths (LaTeX, Markdown) run the same resolver; a cross-target test — one fixture, the same text everywhere
- [x] `:val` kept as a deprecated alias (LaTeX path, unchanged); the `witnessed-values` skill documents the new syntax and why Liquid won
- [x] an unresolved own-prefix reference is visible in the output AND reported, never silently dropped


## 2026-09-30: Liquid references are validated
validate-value.ts runs val-resolves / val-precision-bounded / val-block-computation (and val-filter) on {{ … }} references too. Without it, qou's :val→Liquid migration (58 refs, 29 files, LaTeX byte-identical) would have removed their validation. Measured on qou: a planted broken reference is caught as val-resolves; the real corpus stays at the same 4 issues.


## Summary of Changes
- #1591: liquid-values.ts, one resolver for the PDF, blueprint and site; declared prefixes; fhir-harness site.data is pass-through; precision/scientific filters; provenance per value; a visible ⟦unresolved⟧ marker.
- #1620: Liquid references are validated by the :val rules (val-resolves, val-precision-bounded, val-filter, val-block-computation).
- qou adopted it: pin cb194b1, 58 refs migrated with LaTeX byte-identical (qou#7492).

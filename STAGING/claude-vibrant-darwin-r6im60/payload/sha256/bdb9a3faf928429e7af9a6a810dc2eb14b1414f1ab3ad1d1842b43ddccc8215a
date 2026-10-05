---
# folio-assistant-6dvy
title: 'Witnessed values (:val): prose bug, just-the-docs substitution, namespacing by source'
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:08:52Z
updated_at: 2026-09-30T15:42:28Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: fix the platform; first analyze consistency with the just-the-docs pipeline, and how to namespace values by source (paper, dataset e.g. CODATA with provenance via ingestion, FHIR IG metadata).

## Done when
- [x] prose :val resolves names with underscores (render-latex), tested and calibrated
- [x] consistency analysis across PDF / just-the-docs / blueprint / FHIR IG, recorded (below)
- [x] namespacing-by-source design, owner decision recorded — moved to bean `kott` (harness-dotted keys); FHIR site.data to bean `bamf`
- [x] just-the-docs render path substitutes :val — SUPERSEDED, not done: the site path resolves Liquid {{ … }} (render-markdown, #1591) and :val is deprecated; qou migrated all but 4 refs (qou#7492). :val itself is still not substituted on the site
- [x] blueprint export wired into the folio blueprint.yml (#1492) — done in #1598 (blueprint-layout.ts, run by the paper blueprint.yml template)

## Consistency analysis, 2026-09-30 (two research passes, spot-checked)
| mechanism | PDF | blueprint | just-the-docs | FHIR IG |
|---|---|---|---|---|
| `:val` in prose | honoured (fixed here, 183a6f85f) | honoured (from main.tex) | RAW | n/a |
| `:val` in math | honoured | honoured | RAW, and no MathJax loaded | n/a |
| `:defterm`/`:refterm` | honoured | honoured | RAW | n/a |
| `{{ site.data.* }}` | n/a | n/a | platform templates only, never folio values | IG Publisher only; raw in dak-pdf.ts |

Also: no folio block reaches just-the-docs today (qou's site builds docs/ only); gen-docs-pages copies block bodies with no `{% raw %}`; nothing in CI preloads the value registry, so a CI build meeting `:val` would throw (inferred from code, not run); the `:val` grammar admits no separator.

## Owner decisions, 2026-09-30
- Namespacing: first *"Yes, as proposed"* to `prefix:name`, then refined: *"can we do something like boostrap.blah, cat-harness.blah.blah"* — harness-dotted keys, the 12s9 rule applied to values. Bean `kott`.
- FHIR: *"site.data ... should be made available in justthedocs pipeline w/ fhir harness responsible for declaring/populate fhir metadata jekyll tooling"*. Bean `bamf`.
- The one-resolver question was dismissed pending the next instruction; the kott design (one store, two readers) is the consistency answer offered.


## Summary of Changes
The consistency analysis led to kott (Liquid, #1591, #1620), uyp8 (CODATA, #1591) and a1ku (blueprint, #1598). :val is a deprecated alias that is still rendered on the LaTeX path, not on the site; see the superseded item.

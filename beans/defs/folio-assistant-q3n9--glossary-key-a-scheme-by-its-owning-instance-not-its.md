---
# folio-assistant-q3n9
$schema: bean/1.0.0
title: 'GLOSSARY KEY: key a scheme by its owning instance, not its file path, once glossaries move to their layers (from wvzp)'
status: todo
type: task
priority: normal
created_at: 2026-10-24T08:55:00Z
updated_at: 2026-10-24T08:55:00Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-24 08:41Z, on wvzp: *"B clean break. migrate to propoer way. analayze as part of goal 1."*

## Where it stands
wvzp keys the term-mapping record by the scheme's **file path** (`litlfred/cat-harness#524`, `litlfred/cat-harness-tools#708`, `litlfred/folio-assistant-core#206`). Unique today (33 schemes, 33 keys), but a path is not an identity:
- it changes when a file moves, and GOAL 1 is expected to move glossary files out of `folio-assistant-core/glossary/` into each layer;
- it depends on the checkout layout: `folio-assistant-core/glossary/...` in the index, `glossary/...` in a standalone core checkout.

## Analyse, as part of the separation
- Where does each glossary file live after separation? If every layer holds its own `generated/` and authored schemes, the declaring instance IS the owner, and the key can be (instance, scheme) with no path rule.
- The two rules that exist today and must not drift: the glossary page's `schemeOwner` (core) and the path rule measured in wvzp (`generated/<instance>/`, then `<instance>.glossary.json`, then the directory's owner). Both agreed on all 33 schemes on 2026-10-24.
- Whether a glossary file should state its instance explicitly (an `instance` field in `folio-glossary/v1`), written by `glossary-extract.ts`.
- Published SKOS is already named `<instance>--<scheme>.skos.jsonld`, so (instance, scheme) matches what is published.

## Done when
- [ ] the key after separation is decided by the owner (instance, explicit field, or other), with the analysis above recorded here
- [ ] the term-mapping record, `termState` and the glossary page move from `file` to that key in one migration, and the `file` field is retired
- [ ] a test fails if the page's owner and the record's key disagree for any scheme

Session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU.

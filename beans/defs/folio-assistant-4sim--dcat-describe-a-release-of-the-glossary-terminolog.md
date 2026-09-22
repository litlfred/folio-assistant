---
# folio-assistant-4sim
title: 'DCAT: describe a RELEASE of the glossary / terminology as a published dataset — held until the term model lands'
status: todo
type: task
created_at: 2026-09-22T11:48:00Z
updated_at: 2026-09-22T11:48:00Z
parent: folio-assistant-1swy
---

Owner, 2026-09-22, ruling on #596's ruling 2: **"DCAT: hold as bean as render of whatever we land on."**

So this is deliberately NOT built, and the reason is in the ruling's own words: DCAT renders *whatever we land on*, so building it before the term model is settled would render a moving target.

## What DCAT is and is not

**Not a term model.** It describes a `dcat:Dataset` and its `dcat:Distribution`s — a published, versioned, discoverable thing with a licence, a download URL and a media type. That is the one question SKOS and FHIR both answer badly, and it is complementary to both rather than competing with either.

Recorded in [`vocabulary-authority`](../../cat-harness/skills/folio-core/vocabulary-authority.md): a release of any authoritative vocabulary is DCAT's subject.

## What it would describe here, once there is something to describe

- `_kg/<instance>-glossary.jsonld` and its per-locale siblings — already emitted, already versioned by the ledger's `firstSeen` / `retiredOn`
- `_kg/<instance>.jsonld` and `ns/*.jsonld`
- a folio's FHIR terminology artefacts, if the folio publishes them

## Done when

- [ ] The term model is settled enough that a release has stable boundaries
- [ ] Decide whether DCAT is EMITTED or only referenced — `external-schemas/` can pin the edition without this repo producing any `dcat:Dataset`
- [ ] If emitted: one `dcat:Dataset` per published graph document, with `dcat:distribution` per serialisation and per locale
- [ ] `check:invocation-parity` extended — a preview that publishes a dataset description must publish the distribution it names, the same failure `inScheme` already has

## Not this bean

The authoritative-scheme question is answered: SKOS for meaning, DC for resources, FHIR for clinical codes. DCAT sits beside all three and arbitrates none of them.

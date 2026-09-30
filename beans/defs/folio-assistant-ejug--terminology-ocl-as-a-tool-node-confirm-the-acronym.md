---
# folio-assistant-ejug
title: TERMINOLOGY / OCL as a Tool node — confirm the acronym first
status: todo
type: task
priority: normal
created_at: 2026-09-25T04:51:48Z
updated_at: 2026-09-29T22:01:31Z
parent: folio-assistant-5yhm
---

Under `5yhm`. Owner, 2026-09-25: *"we will integrate, for example, OCL at some
point as a Tool"*.

**CONFIRMED by the owner 2026-09-29:** *"OCL = open concept lab, will be used
for WHO smart guidelines tetrminolgy mgnt as a tool"*. Open Concept Lab
(openconceptlab.org), not the Object Constraint Language, and the use case is
named: **terminology management for WHO SMART Guidelines**.

That settles the acronym and narrows the scope with it. The first consumer is
the SMART Guidelines side, so this Tool serves `authoring-who-smart-guidelines`
as much as it serves `7wou`'s generic mapping check — and the two must not
fork: one Tool node, one mapping contract, whatever the caller.

Checked 2026-09-29: neither reading appears anywhere in `cat-harness/` source.
The only hits in the tree are inside ingested WHO PDF data and image files, so
there is nothing here to be consistent with and nothing to migrate.

A terminology service here is a **Tool node** in `cat-harness/tools/index.ts`
satisfying a named skill, gated by `check:tools` — like every other script and
service. It is not a client library imported from the mapping skill.

## Still open, before any code

- Which collections/sources, and whose. A terminology service is not one
  vocabulary, and `vocabulary-authority` decides what each is authoritative
  FOR before anything maps to it.
- Offline behaviour. A service that cannot be reached yields `undetermined`
  with its reason — never `unmapped`. That is `7wou`'s third state and this
  Tool is the thing most likely to break it.
- Local index or live query — `library/arxiv-2605.03537v1` ran TF-IDF over
  ~1.01 M authorised headings locally and hit an API only for name
  authorities, to avoid a 44 GB download. Either is fine; what a reader may
  assume about staleness differs, and has to be said.

## Done when

- [x] OCL confirmed by the owner 2026-09-29 — Open Concept Lab, for WHO SMART Guidelines terminology management
- [ ] a Tool node satisfying the `7wou` mapping skill, passing `check:tools`
- [ ] unreachable-service behaviour is the third state, with a test that
      proves it rather than a comment that claims it

## 2026-09-30 — "OCL source in github i think", checked

The owner's steer, and it splits in two. Both halves verified by fetching,
not recalled.

**`OpenConceptLab/oclapi2` IS on GitHub and IS readable from this session**
(this environment's git proxy serves anonymous reads of public repos; probed
`raw.githubusercontent.com`, HTTP 200). But its own README says what it is:

> `# oclapi2` — The new and improved OCL terminology service v2

Django, Elasticsearch, `docker compose up`, a Swagger endpoint. It is the
**service's source code**. Cloning it yields a server to run, not a single
concept — the terminology lives in the database that server fronts, and that
is `api.openconceptlab.org`, which this environment's network policy refuses
(403 on CONNECT).

**So the GitHub route to OCL's CONTENT does not exist.** What exists is a
route to the software.

## But there IS a git-backed route to the FHIR terminology, and it works here

`WorldHealthOrganization/smart-base` — fetched 2026-09-30, HTTP 200:

```yaml
id: smart.who.int.base
canonical: http://smart.who.int/base
title: SMART Base
description: Base SMART Guidelines implementation guide to be used as the
             base dependency for all SMART Guidelines IGs
fhirVersion: 4.0.1
license: CC-BY-SA-3.0-IGO
```

That is the WHO SMART Guidelines base IG, holding FHIR terminology as
resources in git, under an open licence, reachable from this checkout today.
It is the same authority `vocabulary-authority` assigns to FHIR, reached by a
different transport.

**This is an authority question, not an implementation detail, so it is not
decided here.** Resolving the `fhir` half against a git-backed IG and
resolving it against a live OCL instance are not the same assertion: one is
"this code exists in the published base IG at version X", the other is "this
code exists in the collection this organisation curates today". They can
disagree, and which one the check asserts is the owner's call.

## Done when — revised

- [x] OCL confirmed by the owner 2026-09-29 — Open Concept Lab, for WHO SMART
      Guidelines terminology management
- [x] its GitHub presence checked: source code yes, terminology content no
- [ ] **owner:** does the `fhir` half resolve against `smart-base` in git
      (works today), against a live OCL instance (blocked in this
      environment), or both with the source recorded per row?
- [ ] a Tool node for whichever lands, passing `check:tools`
- [ ] unreachable-service behaviour stays the third state, with a test

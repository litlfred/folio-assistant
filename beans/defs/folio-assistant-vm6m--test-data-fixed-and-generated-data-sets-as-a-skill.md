---
# folio-assistant-vm6m
title: 'TEST DATA: fixed and generated data sets as a skill family, specialised per content type'
status: todo
type: feature
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "need fixed
and generated data sets skills" and "need generate data sets (e.g. fhir data
templating system, etc) so need egneral processes and specialization for content
ttype, subprocess etc."

## Two kinds, and they are not degrees of the same thing

**Fixed** data is committed, reviewed, and cited. It is evidence: an SME looked
at this exact record and said the decision support gave the right answer. Its
value comes from being unchanged.

**Generated** data is produced from a template plus parameters. Its value comes
from covering a space no one would hand-author — boundary ages, every
combination of two indicators, a thousand encounters.

They fail differently and must not share a store. A fixed record silently
regenerated has lost the review that made it evidence.

## The shape #363 asks for

"general processes and specialization for content type" — so this is the same
adapter/profile question `AGENTS.md` §"Content types" already answers for block
kinds. A general data-set process, with per-content-type specialisation: a
paper folio's test data is not a DAK's, and a DAK's FHIR templating is not a
document folio's.

Before designing, check which it is: does a DAK need different **code**, or only
different **rules**? If only rules, it is a profile plus a subclass, not a new
adapter. That question has been got wrong here before and is written up.

## Done when

- [ ] fixed and generated sets live in separately declared graph directories,
      and a consumer can tell which it is reading from the file, not the path
- [ ] the general process is BPMN under `processes/`, with the
      content-type specialisation as a called subprocess
- [ ] FHIR templating is one specialisation, named as such, not the design

## Depends on

`TEST MODE: a test run is repeatable only if its data and process are hashable
and signable` — a generated set is only usable as evidence if regenerating it
gives the same bytes, so the hashing story constrains the generator's design.

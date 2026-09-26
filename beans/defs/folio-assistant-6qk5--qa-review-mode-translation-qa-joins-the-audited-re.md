---
# folio-assistant-6qk5
title: 'QA REVIEW MODE: translation QA joins the audited review record under test/results'
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "qa review
mode: test results go under things like test/results and same for trnslations
b/c Q&A is part of an audited review process".

## Half of this has landed; the bean is the other half

Measured 2026-09-19 against `harness.json`: `test/results/` **is** declared, as
the `qa` graph, holding three kinds distinguished by their own `$schema` —
`qa-results/v1`, `qa-witness/v1` and `kg-qa/v1`. The declaration's description
records the owner's rule from the same day: *placement follows PROVENANCE* — an
artefact generated primarily as a QA reviewer's output belongs there, regardless
of file family or who fetches it afterwards.

So the principle #363 states is already the repository's rule. What remains:

1. **Translations.** #363 says "and same for trnslations". Translation QA output
   is a reviewer's verdict about a translation and by the provenance rule belongs
   under `test/results/`. Today `witnesses/` carries a `translation` family, so
   part of it is already there — check what is not, rather than assuming.
2. **The 122 stragglers.** The declaration's own description names them: "STILL
   OUTSIDE: the 122 block verdicts `*.qa.json`, which sit beside their blocks and
   move next." That move is unclaimed.

## Why "audited review process" changes the requirement

An audited record is not merely stored, it is **attributable and immutable in
practice**. That pulls in the sibling bean on hashing and signing: a verdict
whose auditor and criterion are not recorded cannot be audited, only read.

## Done when

- [ ] translation QA output is under `test/results/`, or there is a written
      reason why a given artefact is not
- [ ] the 122 block verdicts have moved, or a separate bean owns that move
- [ ] every kind under `test/results/` declares itself via `$schema`, per the
      existing contract — extension is a coincidence, a declaration is a contract

## Related

`folio-assistant-2634` (QA outputs live under test/results — verdicts and
witnesses both, by provenance) is the parent move. Check it before starting;
this may be a child of it rather than a peer.

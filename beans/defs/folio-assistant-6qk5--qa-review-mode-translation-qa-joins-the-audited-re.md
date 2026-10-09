---
# folio-assistant-6qk5
title: 'QA REVIEW MODE: translation QA joins the audited review record under test/results'
status: completed
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-10-09T20:59:00Z
parent: folio-assistant-1swy
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

- [x] translation QA output is under `test/results/`, or there is a written
      reason why a given artefact is not
- [x] the 122 block verdicts have moved, or a separate bean owns that move
- [x] every kind under `test/results/` declares itself via `$schema`, per the
      existing contract — extension is a coincidence, a declaration is a contract

## Closed 2026-10-09

- **Evidence**:
  1. `test/results/translation-qa/` is established under `test/results/` holding translation QA verdicts (e.g. `test/results/translation-qa/docs/index.ar.translation-qa.json`) declaring `"$schema": "translation-qa/v1"`.
  2. The 122 block verdicts have moved into `test/results/block-qa/` (e.g. `test/results/block-qa/content/docs/guides-managing-agent-context/three-things-one-word.qa.json`) declaring `"$schema": "block-qa/v1"`.
  3. All result families under `test/results/` declare their format and version via explicit `"$schema"` (`block-qa/v1`, `translation-qa/v1`, `kg-qa/v1`, `qa-results/v1`, `qa-witness/v1`).
  4. Verified in repository tree on `main`.

## Related

`folio-assistant-2634` (QA outputs live under test/results — verdicts and
witnesses both, by provenance) is the parent move. Check it before starting;
this may be a child of it rather than a peer.


_2026-09-29_ — **Re-parented `5a3l` → `1swy`** by subject, per todo-manager §"WHICH parent" (owner choice '1 2 3' on the LSI epic-filing proposal, bean ansc). Translation QA joining the audited review record is QA's subject; nothing here is deployment.

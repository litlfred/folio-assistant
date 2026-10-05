---
# folio-assistant-4pla
title: 'JSON-LD VOICE, MECHANICAL HALF: publish:verify checks object properties are links and no document leans on a remote @base'
status: completed
type: task
priority: normal
created_at: 2026-10-03T07:23:50Z
updated_at: 2026-10-03T07:24:00Z
parent: folio-assistant-whlc
---

The linked-data voice (bean 9y9j) holds 7 rules, all judgementOnly: a reviewer applies them, nothing checks the emitted documents. Two are decidable by a JSON-LD processor over the emitted files and belong in publish:verify's verifier set, which already runs on the built site before deploy (docs-site.yml) and on every PR's staging build (feature-staging.yml).

Measured 2026-10-03 over the 7,059 committed .jsonld documents that are ours:
- ld-object-property-is-a-link / ld-coercion-belongs-to-the-term: 1 literal under an object property — prov:agent "costateixeira" in crdm--folio-assistant-b94c.prov.jsonld, written as an EXPLICIT {"@value"} by prov-jsonld.ts's three-state rule (no release address; the reason goes to the PROV-O QA/QC report). Sanctioned, not a defect.
- ld-no-base-in-a-remote-context: 0 documents rely on the content context's @base (bh4q's two-part context).
- ld-no-context-fetched-at-run-time: already enforced — jsonld-expand's localLoader refuses any context without a held copy.

Object properties come from the HELD contexts (every term coerced to @id/@vocab), never a hand-written list.

## Done when
- [x] verifier jsonld-object-links: a bare value under an object property that expands to a literal is a finding; an explicit {"@value"} is counted as a declared literal, not a finding
- [x] verifier jsonld-own-base: a document referencing a held remote context that carries @base must state its own @base inline
- [x] tests: both fire on a planted defect and pass on the real corpus
- [x] green on CI, PR ready — 12 of 12 check runs success or intended skip on `dd8357926` (Code-quality gates, feature-staging `stage` running both verifiers on the built site, jsonld-sibling sync)

_2026-10-03T07:24:00Z_ — Claimed by claude/zealous-thompson-y8dcf1-jsonld (session https://claude.ai/code/session_01Jf39Vh4B8EQT6TBYzTtMCA). Claimed on the branch only, NOT pushed to main: the owner's standing rule for this session is no writes to main, and the bean is new, so no sibling can be holding it.

## Measured with the verifiers (2026-10-03)

Over the whole checkout as a stand-in for `_site` (1.3 s): `jsonld-object-links`
pass, 7,059 checked, 264 out of scope, 1 declared literal noted (the
`costateixeira` association above); `jsonld-own-base` pass, 7,059 checked. The
held contexts make 10 content-context terms (`uses`, `cites`, `derivedFrom`, …)
and 6 PROV-JSONLD terms (`agent`, `activity`, `entity`, `role`, …) object
properties. A planted `{"@value"}` under `uses` in a copy of a real library
block is counted as declared, so the walk reaches content-context documents and
not only the PROV reports.

## Summary of Changes

`cat-harness/scripts/publish-verify.ts` gains two verifiers, run wherever
publish:verify already runs (docs-site deploy, every PR's staging build):

- **`jsonld-object-links`** — expands each document with the held contexts and
  flags a literal under any property a held context coerces to `@id`/`@vocab`.
  An explicit `{"@value"}` is a *declared* literal: counted in the result's new
  `note` field, not a finding. A compact-IRI key (`prov:agent`) that bypasses
  the term's coercion is named as the cause.
- **`jsonld-own-base`** — a document naming a held remote context that carries
  `@base` must state its own `@base` inline (bh4q's two-part context).

Object properties are read from the held contexts, never listed by hand.
Tests plant each defect and run both verifiers over the real PROV reports,
located via `siteDirFor()`. Real corpus: 7,059 documents, both pass, one
declared literal (the `costateixeira` association).

Not done here: the other five linked-data-voice rules stay judgementOnly.

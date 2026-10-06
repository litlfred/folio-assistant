---
# folio-assistant-vigi
title: 'JSON-LD is a CONVENTION here, not a construction: 28 deps, zero RDF/JSON-LD processors, nothing validates an @context'
status: completed
type: task
priority: normal
created_at: 2026-09-22T08:50:21Z
updated_at: 2026-09-23T21:29:14Z
parent: folio-assistant-zzmr
---


Found 2026-09-22 while answering ruling 2 on #596 — the owner asked what is
JSON-LD-centric in this ecosystem and what has pre-existing wrappers. The
answer to the second is **nothing**, and that turns out to matter beyond the
question that produced it.

## Measured

**28 dependencies, and not one is an RDF, JSON-LD, SPARQL or FHIR library.**

Every JSON-LD document this repository publishes — the content `@context`,
`ns-export`'s vocabulary, `kg-export`'s graph, `glossary-export`'s concept
scheme, `harness-schema-export`, `fsh-guts-export` — is **hand-rolled object
literals with a hand-written `@context`**, serialised with
`JSON.stringify`.

## Why that is a finding rather than a style

The graph is JSON-LD **by convention, not by construction**. Concretely, none
of these is checked by anything here:

- an `@context` that does not expand — a prefix bound to a malformed IRI, a
  term mapped to a keyword, a `@type: "@id"` on something that is not an IRI
- a term used in `@graph` that the `@context` does not declare, so a
  processor silently DROPS it. `kg-export` has `undeclaredTerms` and
  `undeclaredRootTerms` precisely because this bit once — but those are
  hand-written scans for the shape somebody thought of, not an expansion.
- a node whose `@id` is a relative IRI where an absolute one was meant
- round-trip failure: expand → compact should be stable, and nothing tries it

`ns:check` asks whether a minted TERM has a definition. `kg-export`'s QA
sidecar asks whether a LINK dangles. Neither asks whether the document is
valid JSON-LD, because neither can: that question needs a processor.

## The cheapest honest fix

`jsonld.js` (the W3C reference implementation, MIT, no native deps) as a
DEV dependency, and one test per published document that expands it and
asserts the result is non-empty and round-trips. That is the check that
cannot be faked by a hand-written scan, and it is about 20 lines.

It does NOT need to become a runtime dependency: the generators can keep
emitting object literals. The processor is for the test, which is where the
question belongs.

## What this does NOT claim

No defect has been observed. The documents may well all be valid — several
have been eyeballed and the shapes are conventional. The finding is that
**nobody would know**, which is the `xom7` shape applied to a serialisation:
a malformed context and a correct one look identical from inside this
repository.

## Done when

- [x] a JSON-LD processor expands every published document — in a test AND, per the owner, as the first verifier of a pre-deploy verification sub-process that blocks the deploy
- [x] the test fails on a deliberately malformed `@context` — falsified, not
      assumed (an undeclared key, a network context, nothing-to-verify = could-not-tell)
- [x] round-trip (expand → compact) is asserted stable for at least one
      document (the glossary), since that is what a consumer actually does
- [x] the decision to keep generators hand-rolled is recorded, or reversed
      with reasons — KEPT: jsonld.js is a dev dependency used only by the verifier and its test; generators still emit object literals, and the verifier is what makes them JSON-LD by check rather than by convention

Related: `lqo9` (the ruling-2 analysis that surfaced it), `3190` and `blv9`
(terms and IRIs that did not resolve — the same class, caught by hand-written
scans after the fact).

## Reshaped by the owner, 2026-09-23

"vigi should be a set of post processing tools for verification that a failure triggers an alert to the publisher manager (or whatever role is in process already that makes sense). new sub-process" — "before deployment" — and "there is another alert needed for deployment failure. every step post 'push the publish button' should be same".

## Summary of Changes

- `processes/publish-verification.bpmn` (new sub-process): the verifier set over the built tree, before the deploy; pass / fail / could-not-tell.
- `processes/publish-alert.bpmn` (new sub-process): ONE alert — a `publication-manager`-labelled tracking issue, opened then commented on, triaged by the existing publication-manager role.
- `processes/docs-site-publish.bpmn`: verify after the export and block on anything but a pass; every failure edge (incomplete export, verification, deploy, lost preview) calls the one alert; a clean publish closes it.
- `.github/workflows/docs-site.yml`: the verify step before the deploy, the alert step `if: failure()`, the close step `if: success()`, `issues: write`.
- `scripts/publish-verify.ts` (`publish:verify`): the verifier set — first entry `jsonld-expand` (jsonld.js, network refused, ours-only scope); `publish-verify.test.ts`.
- Two real defects the processor found, fixed: `ns-export` dropped `layer` on all 159 terms; `fsh-guts-export` dropped `skipped` — both now declared terms.
- Skill `publish-verification`, bound to the publication-manager and build-pipeline roles.

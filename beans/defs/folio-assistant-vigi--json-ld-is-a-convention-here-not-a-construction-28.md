---
# folio-assistant-vigi
title: 'JSON-LD is a CONVENTION here, not a construction: 28 deps, zero RDF/JSON-LD processors, nothing validates an @context'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:50:21Z
updated_at: 2026-09-22T08:50:42Z
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

- [ ] a JSON-LD processor expands every published document in a test
- [ ] the test fails on a deliberately malformed `@context` — falsified, not
      assumed
- [ ] round-trip (expand → compact) is asserted stable for at least one
      document, since that is what a consumer actually does
- [ ] the decision to keep generators hand-rolled is recorded, or reversed
      with reasons

Related: `lqo9` (the ruling-2 analysis that surfaced it), `3190` and `blv9`
(terms and IRIs that did not resolve — the same class, caught by hand-written
scans after the fact).

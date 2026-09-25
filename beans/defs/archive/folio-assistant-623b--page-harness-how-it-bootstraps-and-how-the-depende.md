---
# folio-assistant-623b
title: 'PAGE: Harness — how it bootstraps, and how the dependency tree is walked from the lowest instance up'
status: completed
type: feature
priority: high
created_at: 2026-09-21T16:21:34Z
updated_at: 2026-09-21T19:50:29Z
parent: folio-assistant-2upx
---

Owner, 2026-09-21: a page covering how the Harness bootstraps, and how agents are steered by Processes (BPMN), Actors, Roles, Skills and Tasks.

**The mechanism to document:** the dependency tree of the harness is walked starting from the LOWEST (bootstrap) in an ORDERED dependency hierarchy. The harness is declared in the KG. The page MUST explain how bootstrap plus zero or more harnesses can be initiated.

**Also required (owner):** split bootstrap the same way as the KG taxonomy — `bootstrap/tools`, `bootstrap/processes`, `bootstrap/scenarios`.

Overlaps `x3bd` (top-level topical KG directories, bootstrap first), `b5f0` (what instantiation means) and `hfkl` (bootstrap is the exception). Check each before writing; this page SHOULD reference them rather than restate them.


## Added 2026-09-21 — HarnessKind, the instantiation stub, and what "harnessing" obliges

Owner, verbatim:

> 'harness declared as subtypes of ??HarnessKind??  harness initiated with <harnnes-stub>.config.json in repo, which add interface to LHS navbar. hanress repsosible for visulation that will live at <baseurl>/<harness-stub>  harness need to also decribe how it "harnesses" directories (or datastores like git) too, through tools.  it uses docs/ for documentation on the harness and all harness should.   if it harnesses a directory, then it must 1: make sure <dir>.json(ld) etc. is renderd containing/desrcbing the contente and 2:  provide a visualization of the content'

And, clarifying instantiation:

> 'not required that harness-declaration = stub name.  if harness declared/defined as "folio-assistant" then someone can do "my-folio-assistant.config.json" (not config points to the definition), but then the page <baseurl>/my-folio-assistant would be live....'

### What the page MUST cover

- **A harness is declared as a subtype of a HarnessKind** (name undecided —
  the owner's own question marks).
- **Instantiation is `<harness-stub>.config.json` in the repo**, which adds the
  instance's interface to the LHS navbar.
- **THE STUB IS NOT THE DEFINITION'S NAME.** A harness defined as
  `folio-assistant` MAY be instantiated as `my-folio-assistant.config.json` —
  the config points at the definition — and `<baseurl>/my-folio-assistant` is
  then live. So definition identity and instance identity are separate, and
  the URL follows the STUB.
- **The harness owns the visualisation at `<baseurl>/<harness-stub>`.**
- **The harness describes how it HARNESSES a directory** — or a datastore such
  as git — **through Tools**.
- **`docs/` is where a harness documents itself, and every harness SHOULD have
  one.**

### The two obligations of harnessing a directory

If a harness harnesses a directory it MUST:

1. ensure `<dir>.json` / `.jsonld` is rendered, containing or describing the
   content; and
2. provide a visualisation of that content.

These are conformance requirements and SHOULD be written with RFC 2119 key
words per the `technical-writer` voice, since they are exactly the case that
voice exists for: requirements an implementer must be able to find.

Relates to `o7eq` (URL space), `b5f0` (instantiation), `x3bd` (topical KG
directories), `yj32` (harness as interface).

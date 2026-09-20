---
# folio-assistant-8xtj
title: 'INSTANCE NAMES: folio-assist-core published every core term to a path no term names — fixed, plus the 247-reference residue a sweep must not touch'
status: in-progress
type: bug
priority: high
created_at: 2026-09-20T19:01:42Z
updated_at: 2026-09-20T19:01:42Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus): *"fix stub name mismatxhes."*

**The load-bearing one is fixed; this bean is the residue**, which needs
per-site judgement rather than a sweep.

## Fixed already — it was breaking a published artefact

`CORE_NS` is `…/folio-assistant-core/ns#`, so every `fac:` term names that
stem. Both `docs-site.yml` and `feature-staging.yml` published that layer's
namespace document to `_site/folio-assist-core/ns.jsonld` — the **dead short
name**, from #477's rename until now. So every core term dereferenced to
nothing: the document sat where no term pointed, and where every term pointed
there was no document.

Two literals changed, plus a ratchet
(`cat-harness/scripts/tests/ns-document-resolves.test.ts`) that reads the loop
out of the YAML and compares each published directory against that layer's
namespace constant, with a vacuity guard and both mutations confirmed caught.

The file's own comment already stated the rule it was breaking — *"each of
those is an IRI stem, so each needs a document or `bs:Actor` dereferences to
nothing"* — and `ns-export.ts` asserts the outcome outright: *"each of which
IS a file and dereferences."* Both false for one of three, and nothing read
either claim. That is what the test now does.

## The residue — 247 references, and a sweep would be WRONG

| area | refs | what to do |
|---|---|---|
| `beans/` | 90 | **leave.** A bean is a record of what was true when written; `7po1` says this for its own 48. |
| `cat-harness/docs/` | 51 | mostly generated from skills — regenerate, do not hand-edit |
| `cat-harness/schemas/` | 35 | per-site: at least one is a **deliberate** non-rename, below |
| `cat-harness/scripts/` | 23 | per-site |
| `cat-harness/skills/` | 11 | prose about the current instance — correct these |
| `.github/`, `who-iris/` | 2 | one fixed here, one prose |

**The trap, in the code's own words** (`landing-sticky.test.ts:72`): the
landing card's id is `folio-assist-core` and *"is deliberately NOT renamed
with it: a card id is a published identifier on the landing page, the
directory is where the files sit, and this line is the one place they differ
— which is exactly why it broke when they were assumed to be one string."*

So `folio-assist-core` is simultaneously a dead directory name, a live card
id, and 90 historical records. A `sed` over all three is how a rename breaks
a published identifier.

## The OTHER mismatch, not yet ruled on

`folio-assist-sci` carries the short form in both its name and its directory,
51 references. #477 recorded it and declined to assume: *"`folio-assist-sci`
still carries the short form. By the rule above it would be
`folio-assistant-sci`, but that was not raised and is not assumed."* The
owner's ruling that produced `folio-assistant-core` was *"cat- prefix does not
extend to folio-assistant-*"*, which implies the long form here too — but it
is a rename of a staged instance and wants saying out loud.

And one more, which `o7eq` raises: **cat-harness's `stub` is
`folio-assistant` and the repository root's `name` is also
`folio-assistant`.** Under the URL rule the root is addressed by that name
while cat-harness publishes its graph at `<base>/folio-assistant.jsonld` from
the stub, so the two vocabularies now meet in one path space.

## Done when

- [x] The namespace documents are published where their terms name them
- [x] A ratchet stops that drifting again
- [ ] The owner rules on `folio-assist-sci` → `folio-assistant-sci`
- [ ] The owner rules on the root-name / cat-harness-stub collision
- [ ] The prose references that describe the CURRENT instance are corrected,
      leaving beans, the landing card id, and generated files alone
- [ ] A check reports a declared instance directory whose name no consumer
      resolves, so a dead instance name cannot sit in a live path again

## Evidence for "a sweep would be WRONG" — a sweep was run, and reverted

*2026-09-20, later the same day, from PR #584. Not a claim on this bean; the
owner's ruling was "leave it to 8xtj, just note what you learned."*

This bean says the residue is 247 references and **a sweep would be wrong**.
Another session ran one anyway — `folio-assist-core` → `folio-assistant-core`
across **103 files** — before reading this bean. It has been reverted in full.
What it broke is worth recording, because it is this bean's own table
demonstrated rather than argued:

| what the sweep renamed | why it was wrong |
|---|---|
| the **landing card id** in `folio-assistant-core/harness.json` | the exact trap this bean quotes from `landing-sticky.test.ts` — a card id is a PUBLISHED identifier and does not move with a directory. It even rewrote the comment that says so, into "`folio-assistant-core` … is deliberately NOT renamed with it", which is now a sentence about itself. |
| `{ id: "core", name: "folio-assist-core" }` in `scripts/partition/instance-rules.ts` | a live identifier in the repo partition, not prose |
| **90 bean files** | this bean's first row: *leave — a bean is a record of what was true when written* |
| two sentences DOCUMENTING the rename, in `cat-harness.test.ts` and `instance-render.test.ts` | both became "X became X". The generic hazard of a `sed` over prose: the sentences most likely to mention an old name are the ones explaining why it changed. |

**Nothing caught it.** `bun test` stayed at 0 fail, `tsc` and `eslint` clean,
and sixteen check scripts green — including `check:instance-render` and
`kg:audit:check`. The card id only surfaced because the reverting session
compared `docs/_data/stickies.json` against `main` by hand. So the residue is
not merely "needs judgement": **it is unguarded**, and a gate asserting the
card id against a literal would have turned this into a red build instead of a
near-miss. Worth considering as part of this bean.

The revert used a three-way merge (base = main normalised to the new spelling,
theirs = main, ours = the swept tree) to lift only genuine changes back onto
main's spelling, rather than discarding the session's other work. 53 files
restored outright, 11 three-way merged, 4 hand-re-applied.

### One part is NOT reverted, and this bean predicted it

> *"The OTHER mismatch, not yet ruled on: `folio-assist-sci` carries the short
> form in both its name and its directory"*

The owner ruled on it that day — **full word everywhere** — so
`folio-assist-sci` → `folio-assistant-sci` stands, directory and declared name,
with references following because it is a live directory that actually moved.
That is the opposite case from `folio-assist-core`, which is a *dead* directory
name whose references are history. Beans were left alone for both.

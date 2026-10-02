---
# folio-assistant-6f1x
title: 'MAINTAINS: the unproduced check is now blind to every producer but one'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:55:59Z
updated_at: 2026-09-20T14:37:20Z
parent: folio-assistant-d308
---

Opened by the change that caused it, in the same session, rather than left for
someone to discover.

## What was narrowed and why

`kg:schema:check` reconciles `maintains` declarations against produced artefacts
in both directions. `unproduced` catches a declaration that rotted — a Tool still
claiming an artefact this instance no longer writes, **which a consumer of the
published graph would follow to a 404.** That reasoning is sound and is not in
question.

It had encoded a stronger premise than `maintains` ever carried: *an artefact a
Tool maintains is produced by the schema exporter.* True of the three original
zod carriers and of nothing else. `ns-vocabulary` and `content-context` were the
first counterexample — both published by `.github/workflows/docs-site.yml`, which
copies `ns/content/v1.jsonld` and runs `ns-export --out
_site/ns/vocabulary.jsonld`. Both declarations true, both reported as drift.

So `unproduced` now runs only over artefacts whose declaring Tool invokes
`bun run kg:schema`.

## The cost, stated plainly

**Coverage of every other producer's artefacts is now ABSENT, not narrower.** An
artefact maintained by a Tool that some other command produces can rot to a 404
and nothing notices. Today that is two artefacts; it will be more as `d308`
proceeds, because most of the thirteen groups' Tools are not the schema exporter.

The narrowing was still right: this script cannot see whether the site build
wrote a file into `_site/`, and a check that answers a question it cannot see is
worse than one that declines to. But "right to decline" is not "covered".

## What would actually close it

The question is about the **published tree**, not about any one command's output,
so the check belongs where the published tree exists:

1. **In the site build**, after `_site/` is assembled: every `maintains.artefact`
   must be a file in `_site/`. This is the strongest form — it tests the real
   artefact at its real path, and it is the only place the answer is knowable
   with certainty.
2. **Against the served base**, as a link walk: resolve each declared artefact
   against `canonicalUrl` and require a 200. Catches a publish that silently
   stopped; needs network, so it cannot be a local gate.

(1) first. (2) is the one that would have caught the case this whole family
exists for — `ns/` was minted as an IRI stem that **nothing served**, and a test
exempted it BY NAME until the terms had to be defined rather than merely
identified.

## The three-state rule applies to the new check too

An artefact whose presence cannot be determined — `_site/` not built, network
refused — is **not** a pass. It is `could not determine`, reported as such, and
it does not clear the artefacts it did not reach.

## Done when

- [x] `_site/` assembly asserts every `maintains.artefact` is present —
      `scripts/check-maintained-artefacts.ts`, wired into `docs-site.yml` after
      assembly
- [x] could-not-determine distinguished from present, and never rendered as clean
      — **exit 2** for no argument, a missing directory, or zero claims; **exit 1**
      for a real absence; **exit 0** only on a populated tree. All four verified
- [x] `kg:schema:check`'s narrowing note updated — it now says the cost "is now
      paid" and names the check, rather than describing an open gap
- [x] the drift test extended to cover the restored direction — a **third suite**
      asserts the PARTITION rather than either side of it,
      `scripts/tests/maintains-coverage-partition.test.ts`

---

## Done 2026-09-20 — the question is asked where the answer exists

`scripts/check-maintained-artefacts.ts`, run by `docs-site.yml` **after `_site/`
is assembled**, because that is the only place the answer exists. It does not
build the site: then it would be testing its own build rather than the one that
ships — the same seam `strip-preview-seo` uses.

### The third state is the whole design

| exit | meaning |
|--:|---|
| **0** | every claim's artefact is a file in the tree |
| **1** | a claim names a path the built site does not carry — a 404 waiting to be followed |
| **2** | **could not determine** — no argument, no such directory, or no claims at all |

Exit 2 is why this is a script rather than a test. A test on a developer's
checkout has no `_site/`, and one that quietly passed there would be green in
exactly the place nobody built the site. That is how `docs-site.yml` failed all 30
runs over two months without anybody noticing (bean `xom7`), and the shape is
worth refusing twice.

Zero claims also exits 2, not 0: a green run over no rows reads as coverage that
is not there.

### A directory at the artefact's path counts as ABSENT

`maintains.artefact` names a document a consumer dereferences. A directory there
serves an index or a 404 depending on the host, so passing on it would be passing
on a coincidence of the filesystem. Pinned by a test that creates the path first
as a directory, then as a file, and asserts the verdict flips.

### One mistake worth recording

The workflow step first went in by string-anchoring on a line inside a `run: |`
block — which spliced YAML keys into the middle of a shell script and broke the
file. Caught by parsing the YAML rather than by eyeballing the diff, reverted, and
re-inserted at the real step boundary found by walking up past the next step's own
leading comments. **Anchor on structure, not on a line that happens to be
unique.**


---

## CLOSED 2026-09-20 — the gap was between the suites, not inside either

The last criterion asked for the drift test to be "extended". Extending it would
have been the wrong shape, and reading both suites is what showed why.

**Each suite was correct and complete about its own scope.**
`artefact-declaration-drift.test.ts` asserts that `ns/vocabulary.jsonld` and
`ns/content/v1.jsonld` are **not** reported as drift — the narrowing, correctly
pinned. `check-maintained-artefacts.test.ts` has five tests over a built tree.
Neither file mentions the other.

So *"correctly declined here"* and *"covered over there"* were asserted in separate
files and **their conjunction was asserted nowhere.** If the site check narrowed,
was renamed, or stopped iterating every Tool, the drift test would still pass — it
asserts an ABSENCE — and the artefacts it declines would be covered by nothing,
silently. Which is this bean's own sentence turned into a test:

> **"right to decline" is not "covered".**

That is `covered-is-not-reachable` one level out: each instrument reports success
over its own scope, and nobody asks whether the scopes **tile**.

### What the new suite asserts

Five tests, all set relations over the two scopes:

1. both sides of the split are non-empty — the guard that stops every assertion
   below from holding trivially
2. every artefact the drift check **declines** is a subject of the site check
3. every declared artefact is judged by **at least one** check — the partition as
   a whole, which is what breaks if a third producer appears
4. both checks read **one** declaration (set equality against
   `declaredArtefacts()`), since the site check iterates `tools()` directly while
   the drift check goes through `declaredArtefacts`
5. `ns/vocabulary.jsonld` and `ns/content/v1.jsonld` named explicitly, covered by
   the site check **and** still declined by the drift check — the pairing is the
   invariant

`declined` is derived from **behaviour**, not from the `SELF_INVOCATION` constant:
an empty produced-list makes the drift check indict everything it considers its
own, so whatever it leaves alone is precisely what it declined. Reading the
constant would make the test agree with the implementation by construction.

### Mutation-checked, because a green partition test proves nothing by itself

Simulated a narrowed site check (schema files only) and confirmed the bridge test
**would fail**, naming all four declined artefacts. A partition assertion that
cannot fail is worse than none.

### The bean's own prediction came true the same day

It said: *"Today that is two artefacts; it will be more as `d308` proceeds."*

It is **four**. `assets/css/themes.css` and `assets/css/avatars.css` joined the
declined set this morning, when `site-presentation-assets` was authored and
`themes-css` / `avatars-css` entered the graph (bean `yean`). Both are published
by the site build, so neither is the schema exporter's — exactly the shape that
was uncovered. Measured: `declared=7`, `driftJudges=3`, `declined=4`.

### Verified

- `bun run gates` — 56 of 56 pass
- the new suite: 5 pass, 0 fail, and demonstrated capable of failing

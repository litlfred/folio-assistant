---
# folio-assistant-6f1x
title: 'MAINTAINS: the unproduced check is now blind to every producer but one'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:55:59Z
updated_at: 2026-09-20T04:55:59Z
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

- [ ] `_site/` assembly asserts every `maintains.artefact` is present
- [ ] could-not-determine distinguished from present, and never rendered as clean
- [ ] `kg:schema:check`'s narrowing note updated to point at the new check
      instead of describing an open gap
- [ ] the drift test extended to cover the restored direction

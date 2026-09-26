---
# folio-assistant-lx2s
title: 'Feature-branch staging under gh-pages (issue #215)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-17T22:29:53Z
updated_at: 2026-09-20T14:37:30Z
parent: folio-assistant-1xhc
---


_2026-09-19T00:41:01Z_ — Verified RESOLVED, 2026-09-19 on main at 17dc1e6. .github/workflows/feature-staging.yml exists with 32 STAGING references and is demonstrably working — it deployed previews for PRs #298 and #308 in this session, each commenting the STAGING URL. Note this bean has an EMPTY body: title and issue #215 only, no statement of what 'done' means, so this verification is against observed behaviour rather than against the bean's own gate. NOT closing it — not my bean to resolve.

_Body written 2026-09-19, same situation as `t8g3`: this bean was a title and an
issue number. Reconstructed from
[issue #215](https://github.com/litlfred/folio-assistant/issues/215) and the
workflow on disk._

## Correction to my own note above

I noted this bean RESOLVED earlier today on the strength of
`feature-staging.yml` working — it deployed previews for PRs #298 and #308.
**That was too fast.** Issue #215 is still **open**, reopened after
[PR #217](https://github.com/litlfred/folio-assistant/pull/217) merged, so the
owner does not consider it finished. The mechanism runs; the issue's scope is
wider than the mechanism.

## What the owner asked for

- Feature branches render at `<owner>.github.io/<instance>/STAGING/<branch>/`.
  **Done** — `feature-staging.yml` does exactly this, with cleanup on merge or
  close.
- **All rendered content stamped with the commit sha**, so a reader can tell
  whether what they are looking at matches main, has been deployed, or is
  stale. Partially done: the injected banner carries branch and sha, and the
  KG export is stamped, but "all rendered content" is a stronger claim than a
  banner on HTML pages.
- Staging is **the place reviewers retrieve rendered changed content for
  comparison against main** during publication review. The deep-link half of
  this landed as bean `g4dv`.
- **BPMN documenting the skills and workflow per SOP.** Not evident.

The issue's worked scenario is the acceptance test worth holding it to: an
author changes an immunization schedule, the agent helps with narrative blocks
and deterministic logic and surfaces downstream implications, the guidance
review committee compares before and after on STAGING, approves, and only then
does the change merge and publication begin.

## Todo
- [ ] establish what "all rendered content is stamped" covers beyond the HTML banner
- [x] BPMN for the feature-branch review SOP: `content-change-review.bpmn`, extended by bean `en2d` (2026-09-23) with the review coordinator lane, sliced review, withdrawal, adjudication and a DMN coverage gate
- [ ] walk the issue's immunization-schedule scenario end to end and record where it breaks

## Done when
Issue #215 can be closed by its author.

## The sha-stamping inventory, measured 2026-09-19 (`938d876`)

Issue #215 asks that **all** rendered content be stamped "so it is easy to see
if rendered matches main, has been deployed, is stale". I said in #318 that only
the injected HTML banner carried a stamp. **That undersold it**, and I am
measuring rather than repeating the claim, having just had to retract the
equivalent note on `t8g3`.

Read from `feature-staging.yml` at `938d876`:

| published artefact | stamped? | where |
|---|---|---|
| every `.html` page | **yes** | banner injected into `find ./_site -name "*.html"`, carrying branch + sha; nothing is missed because the find is unfiltered |
| any page wanting build metadata | **yes** | `docs/_data/` gets `sha`, `short_sha`, `built_at`, `branch`, `staging`, `staging_slug` (:140-146), so Jekyll can surface them anywhere |
| `<stub>.jsonld` — the KG export | **yes** | `d.staging = { branch, sha, pr, run }` (:358-360) |
| `<stub>.json` — its alias | **yes** | copied **after** the stamp, deliberately, "so the two documents cannot disagree about which build they came from" (:366-367) |
| **`harness-schema-export.ts --out-dir ./_site`** | **NO** | writes `<stub>.schema.json`, `tool.schema.json` and siblings (:355); takes `--base-url` and carries no build identity at all |
| CSS, JS, images, PDFs | no | and not in-band fixable — see below |

### The one real gap

**Two self-describing data artefacts are published side by side and only one is
stamped.** `kg-export.ts` writes `<stub>.jsonld` on line 354 and is stamped four
lines later; `harness-schema-export.ts` writes its schema documents on line 355
and is never touched. A reviewer holding `tool.schema.json` off a STAGING URL
cannot tell which build produced it — which is the exact question #215 exists to
answer.

The asymmetry looks accidental rather than reasoned. The same step takes visible
care over a *weaker* case: the `.json` alias is copied after the stamp precisely
so the pair cannot disagree. That care simply was not extended to the sibling
export on the adjacent line.

`harness-schema-export.ts` already accepts `--base-url`, so it has a natural
place to accept build identity too, and the schema documents are JSON objects
with room for a `staging` key exactly like the `.jsonld`.

### The limit worth stating

CSS, JS, images and PDFs cannot carry an in-band stamp in any useful way. "All
rendered content" can only reach them through a **manifest** — one document
listing every published path with the sha that produced it. That is a design
decision, not an oversight, and it belongs to whoever owns #215 rather than
being assumed here.

### Not done

No code. This is the inventory; the schema-export stamp is a small change and
the manifest question is the owner's.

---

## Done, 2026-09-19 — the stamp, and a second defect in the one that existed

**The schema exports are stamped.** `harness-schema-export.ts` wrote
`<stub>.schema.json`, `tool.schema.json`, `tool-types.schema.json` and 44 skill
I/O contracts into `_site` with no build identity, beside a `.jsonld` that
carried one. Both exporters now stamp their own output from a single
`stagingStamp()` (`scripts/staging-stamp.ts`), and the inline `bun -e` rewrite
is gone from `feature-staging.yml`. Two stamps would have given the two
documents independent notions of one build — the failure the workflow's own
comment guards against when it copies the `.json` alias *after* the stamp.

Stamped at **write** time, not in the builders: `buildDeclarationSchema` and
friends say what a declaration IS, which is the same answer in every run, and a
run id folded in there would make two calls in one process return documents
that differ.

### The second defect: the stamp that existed was being dropped

The workflow appended a top-level `staging` key to the JSON-LD, and `staging`
was **not in the `@context`**. A JSON-LD processor discards a property that is
neither declared nor an absolute IRI — so the one artefact this build stamped
carried its stamp in the one form the consumer the export exists to serve
cannot read. It is written, published, and not there.

That is precisely the `ovkk` defect `kg-export.ts` records on
`inputSchema`/`outputSchema`, one level up on the **document root**, which is
where `undeclaredTerms` does not look: it walks `@graph`. The term is now
declared, with `branch`/`sha`/`pr`/`run` in a **scoped** context (JSON-LD 1.1
§4.1.8) rather than four global terms — they are words a graph node could
plausibly use for something else.

### Open, and deliberately not taken here

**The same root-level blind spot covers `counts`, `problems`,
`undeclaredTerms`, `danglingLinks` and `undeclaredSchemaModules`** — all
undeclared, all dropped by a processor. Whether those are graph DATA that
should survive expansion or a build REPORT that has no business being RDF is a
design call, not a bug fix. Recorded rather than decided.

**CSS, JS, images and PDFs are still unstamped**, for the reason stated above:
only a site-root manifest reaches them, and its costs (a second answer to
"which build", staleness if anything writes to `_site` afterwards, and a PDF
fetched on its own still carrying nothing) make it the owner's decision.


## 2026-09-20 — swept under `0pes` and deliberately NOT closed

The other five beans carrying *"Verified resolved … NOT closing it — not my
bean to resolve"* were discharged today under the new evidence-not-authorship
rule in `bean-coordination`. **This one was not**, and the reason is in this
bean already: the correction above walks its own resolution back.

Its *Done when* is **"Issue #215 can be closed by its author."** An agent never
closes an issue on its own say-so, so this is not an agent's to discharge under
any rule — that is obligation 2 of the new §"Closing a bean whose work has
already landed", and this bean is the worked example it cites.

Three items remain open and none is mechanical:

- [ ] establish what *"all rendered content is stamped"* covers beyond the HTML banner
- [x] BPMN for the feature-branch review SOP: `content-change-review.bpmn`, extended by bean `en2d` (2026-09-23) with the review coordinator lane, sliced review, withdrawal, adjudication and a DMN coverage gate
- [ ] walk issue #215's immunization-schedule scenario end to end and record where it breaks

The mechanism runs — `feature-staging.yml` deploys previews, and it did so for
this very sweep's PRs. The issue's scope is wider than the mechanism, which is
what the earlier correction established and why *"it works"* was too fast.

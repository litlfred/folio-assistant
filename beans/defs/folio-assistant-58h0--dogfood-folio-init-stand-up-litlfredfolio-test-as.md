---
# folio-assistant-58h0
title: 'Dogfood folio_init: stand up litlfred/folio-test as a paper folio'
status: completed
type: task
priority: normal
created_at: 2026-08-28T15:22:51Z
updated_at: 2026-08-28T15:33:31Z
---

First real use of the folio_init scaffolder from PR #142, against an empty repo. Verifies the scaffolded layout works end to end outside the platform's own test fixtures.

## Summary of Changes

First use of `folio_init` outside its own test fixtures. `litlfred/folio-test`
is now a paper folio — litlfred/folio-test#2.

Verified on a machine with **neither Lean nor TeX**: `content_list` reports the
one block, `content_profile_check` confirms the paper profile, and
`document_render_md` assembles the folio to Markdown with zero issues. That
last one is the load-bearing check — it is the whole point of a paper being a
document plus Lean-bearing blocks rather than a separate thing, and it is the
render an author actually uses while drafting.

### Two real defects it shook out (fixed on the `ehve`/`fs18` branch, PR #142)

**`content_list` reported every block in every folio as `unknown`.** It read the
kind with `/kind:\s*["\'](\w+)["\']/`, and no builder-authored manifest contains
that — `prose({ label: … })` yields `kind: "prose"` at *runtime*, the source
never spells it out. So the match failed always and fell through to the default.

This is the **eighth** hand-rolled kind detector `qa-utils.ts`'s docstring warns
about, and the most broken: the seven it names were merely incomplete; this one
never matched anything at all. Now uses `readBlockManifest` /
`readUnlabelledBlockManifest`, which also returns `undefined` for a non-block
`.ts` — fixing the second defect in the same output, where the chapter manifest
was listed as one of that chapter's content objects. The `(N blocks)` header now
counts rows emitted rather than `.ts` files, which differ by exactly that
manifest.

Tests pin both the fixed behaviour **and** that the old regex could not have
satisfied it — asserting only the former would leave open that the two were
equivalent and something else was wrong.

**`init-folio --skip-vcs`** told the caller to add the submodule even when it was
already present, which is exactly when someone passes that flag.

### Worth noting for whoever picks this up

The folio-test submodule is pinned to #142's **branch**, not `main`, because the
scaffolder that generated it has not merged. The README and the PR both carry
the bump command. This should not be left pinned to a branch indefinitely —
merging #142 first is the cleaner order.

### What the dogfood did NOT cover

`paper_render_pdf`, `formula_render` and the Lean lifecycle were never exercised
— no TeX Live, no elan in this container. The paper folio is verified as far as
a machine without those toolchains can verify it, which is real coverage of the
draft-time path and no coverage at all of the publish-time one.

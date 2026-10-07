---
# folio-assistant-42u5
title: '#1955 hand-off to the merge manager: kept merged with main by its session, by hand'
status: todo
type: task
created_at: 2026-10-04T12:31:39Z
updated_at: 2026-10-04T12:31:39Z
parent: folio-assistant-whlc
---

**For the merge manager — #1955 is kept merged with `main` by its owning session, by hand.**

The `merge-main` bot cannot land `main` into this branch:
- it refuses two **authored** conflicts, which have no declared pattern, correctly so (`merge-conflict-patterns`):
  - `cat-harness/scripts/check-retired-front-matter.ts` — both sides added an import; both are kept (this branch's `checkoutRootFor`, bean `g43f`; `main`'s `exitUnlessMounted`);
  - `cat-harness/test/attestations/kg-qa/processes/sdlc/merge-base.attestations.json` — `main`'s hashes, confirmed current by `regen` and `kg:audit:check`;
- the merge carries workflow-file changes, which its token cannot push (#1829).

So each `main` merge here is done locally with the post-merge checklist:
- `bun run regen`, run until it settles, with the `fsh-guts` branch store mounted (`state:mount`);
- `docs:pages`, then `check:l1-complete --write`;
- `kg:export:check`, `check:kind-validators:require-all`, `check:partition`, `check:process-index` (89 of 89);
- the lost-file guard (bean `vsv7`).

**Head:** `295bb2dbafe`, containing `main` at `145670b0b86`.
**Owed `pull_request` runs:** running on this head; this bean is updated when they report.

**Submodules:**
- `bootstrap-tools` is at `08e42b8`, its `main`, which contains both `main`'s pin `7ac5150` and #7's merge `ce5a2ce`;
- `bootstrap` is at `5761204`, the same as `main`.

**What it carries since the last summary:**
- bean `t8c4`: bootstrap's diagrams are covered through its own published subgraphs (`seeAlso`), 89 of 89;
- bean `vsv7`: the merge tool can no longer lose a file both sides have;
- bean `g43f`: the root instance's skills are read from the checkout;
- bean `324x`: a verdict projection that has lost a top-level key fails;
- two test timeouts fixed: `harness-state`, and `claim-branch-store`, which came in from `main`.

This bean is the work-plan record; the PR comment carries the same text.

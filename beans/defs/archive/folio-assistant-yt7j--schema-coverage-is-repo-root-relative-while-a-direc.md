---
# folio-assistant-yt7j
title: ""
status: completed
type: task
priority: normal
created_at: 2026-09-21T10:13:34Z
updated_at: 2026-09-21T10:13:34Z
---

## RULED 2026-09-21 — repository-root relative, and one exported resolver

The owner, choosing from four options with their costs:

> One exported resolver, no schema change.

So `coverage.visualiser` and `coverage.docs` resolve against the **repository
root**, full stop, and `resolveCoveragePath(repoRoot, coveragePath)` in
`schemas/cat-harness.ts` is that ruling as code rather than as prose. No new
field, no migration of the declared paths, and the base stops being something
each consumer re-derives.

### Re-measured before touching anything — the corpus has grown

| | 2026-09-20 (this bean) | 2026-09-21 |
|---|---|---|
| coverage paths | 27 | **45** |
| resolve from the repo root | 25 | **45** |
| resolve from the instance root only | 0 | 0 |

So dropping the instance fallback breaks nothing, and the check's output is
byte-identical before and after: 151 findings, 67 major, 84 minor.

### The fallback was not tolerance — it was what stopped this being enforceable

`targetExists` tried the instance root and then the repository root, accepting
either. A path incorrect in its declared base passed anyway through the other,
so the axis could not enforce the convention its own schema documents and the
corpus was free to drift into a mix nobody could read. It resolves against one
base now, and a test plants a file where only the old code would have found it.
**Falsified rather than asserted**: reintroducing the fallback turns exactly
that one test red, and restoring it turns it green.

### The fixture had been passing against the fallback

Eight tests went red the moment it came out, all for the same reason: the
fixture wrote its `realTargets` *under the instance* while the real corpus puts
all 45 at the repository root. They were green because of the fallback, not
because of the convention. The fixture now mirrors the corpus.

### A latent defect found on the way, in the same file

```ts
const isRoot = resolve(root) === resolve(repoRootFor(root));
```

A directory compared with its own **parent** — equal only at the filesystem
root. So `isRoot` was `false` for every instance INCLUDING the repository root,
and the guard it feeds (*"the repository root legitimately owns the
repository's files"*) could never fire for the one instance it exists for.

**Not visible today**: this repository's root declaration carries two assets
and neither has a `scope`, so nothing was being wrongly accused yet. It would
have fired the first time the root declared a repository-scoped asset — which
`cat-harness` itself used to do for the root README before #592 split them.

`auditInstance(root, repoRoot)` now takes the repository root rather than
guessing at it, which is the same fix as the resolver's and is why the two
landed together. Three tests cover it, including the unscoped case that
explains why it stayed latent.

## Done when
- [x] The two bases are stated on the schema, where a consumer reads them
- [x] Decided and recorded: repository-root relative, via one exported resolver
      (owner, 2026-09-21)

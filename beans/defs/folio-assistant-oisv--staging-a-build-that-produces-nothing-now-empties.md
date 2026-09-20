---
# folio-assistant-oisv
title: 'STAGING: a build that produces nothing now EMPTIES a preview instead of leaving the last good one'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T17:03:25Z
updated_at: 2026-09-20T17:09:46Z
parent: folio-assistant-1xhc
---

Owner-approved 2026-09-20, in the same breath as `85im`'s `rm -rf`: *"Yes +
guard an empty build"*. Filed separately because it is a risk the fix
**introduces**, not part of what `85im` set out to do — that bean's three
Done-when boxes are met and it is closed.

## The gap

`feature-staging.yml`'s deploy step now does, in order:

```sh
rm -rf "pages/STAGING/$STAGING_SLUG"
mkdir -p "pages/STAGING/$STAGING_SLUG"
cp -R _site/. "pages/STAGING/$STAGING_SLUG/"
```

**Nothing between the `rm` and the `cp` checks that `_site` holds anything.**
Measured 2026-09-20: `grep -n "_site" .github/workflows/feature-staging.yml`
returns twelve uses — chown, SEO strip, api, kg-viewer, kg-export, the banner
walk — and **not one asserts the directory is non-empty** before the deploy.

So a build that fails *while still exiting 0* — a generator that writes
nothing, a step whose `|| true` swallowed a failure, a path that moved —
replaces a working preview with an empty one.

## Why this is worse than the bug `85im` fixed, not better

`85im` traded a preview that **over-reports** (stale files linger) for one
that **mirrors the build**. That is the right trade, and the reason is that a
reviewer can act on a mirror. But the same property makes a broken build
indistinguishable from a deliberate deletion: the preview 404s either way, and
the reviewer concludes their change took effect.

An empty preview is *"could not determine"* wearing the costume of a
determined answer — the third-state failure this repository fixes everywhere
else (`check:l1-complete`, `ci-health`, `toc_source`, `readme-sections`).

## Done when

- [ ] a build that produces an empty `_site` **fails the job** rather than
      deploying, with an error naming what was empty
- [ ] the guard runs **BEFORE** the `rm`, which is the whole safety argument —
      a check after the delete protects nothing, and a test pins the ORDER
      rather than the presence
- [ ] the previous preview is still standing afterwards, because nothing was
      removed

## Not in scope

Deciding whether a *partial* build should deploy. "Non-empty" is a floor, not
a correctness check, and a threshold ("at least N pages") needs calibration
this bean does not have — the same argument that stopped `6xaz` shape two from
inventing one.


## 2026-09-20 — the guard, before the `rm`, proven by running it

```sh
if [ -z "$(ls -A _site 2>/dev/null || true)" ]; then
  echo "::error::the build produced an empty ./_site — refusing to deploy, so STAGING/$STAGING_SLUG keeps its last working preview"
  exit 1
fi
rm -rf "pages/STAGING/$STAGING_SLUG"
```

`2>/dev/null || true` covers the ABSENT case as well as the empty one: `ls` on
a missing directory writes to stderr and exits non-zero, and `set -eu` would
otherwise kill the job with no message naming the cause.

### Run against all three states, not argued from the source

A shell condition that never fires is the vacuity this repository keeps
removing, so it was executed with a previous preview in place:

| `_site` | result | the previous preview |
|---|---|---|
| **absent** | refuses, `exit 1`, error printed | *"the last good preview"* — **intact** |
| **empty** | refuses, `exit 1`, error printed | **intact** |
| **has content** | deploys, `exit 0` | replaced with the new build |

The third column is Done-when 3, and it is the one that could not be read off
the source: it needed the `rm` to be shown NOT running.

### Done when — final

- [x] an empty `_site` fails the job rather than deploying, with an error
      naming what was empty
- [x] the guard runs **BEFORE** the `rm`, and the test pins the **ORDER**
      rather than the presence — a guard moved below the delete still passes a
      presence test while protecting nobody, so that mutation is the one that
      matters
- [x] the previous preview is still standing afterwards

### Verification

5 checks added to `scripts/tests/staging-replaces-preview.test.ts` — **the
sibling's `85im` file, extended rather than a rival one beside it** — so the
two properties are read together by whoever meets either. 10 pass there in
total. Six mutations, each caught by a named check:

| mutation | test that fails |
|---|---|
| the guard removed entirely | `an empty build fails the job rather than deploying` |
| **the guard moved AFTER the `rm`** | `the guard runs BEFORE the rm — order is the whole safety argument` |
| the refusal warns but does not exit | `the refusal exits non-zero, so a lost preview is not silent` |
| it becomes a page-count threshold | `an empty build fails the job rather than deploying` |
| the error stops naming the slug | `the error names the slug, so the reader knows WHICH preview was spared` |
| `85im`'s own `rm`-before-`cp` undone | `the guard runs BEFORE the rm` |

`check:workflows` over 39 workflows, `bun run gates --all` **61 pass**, tsc and
eslint clean.

### Deliberately NOT done

A threshold. "At least N pages" needs calibration this has no basis for — the
same argument that stopped `6xaz` shape two inventing one — and a wrong
threshold refuses good deploys, which is worse than the bug. `-z` on `ls -A`
is the only question answerable without a number.

---
# folio-assistant-1hjm
title: merge queue is UNAVAILABLE on this repo — three workflows carry merge_group triggers that can never fire
status: todo
type: task
priority: normal
created_at: 2026-09-30T22:29:45Z
updated_at: 2026-09-30T22:34:13Z
parent: folio-assistant-1xhc
---

Measured 2026-09-30, after the owner asked for the merge queue to be turned on.

## What was found

The repository's **New branch ruleset** form offers thirteen rules. **`Require
merge queue` is not one of them**:

```
Restrict creations · Restrict updates · Restrict deletions
Require linear history · Require deployments to succeed · Require signed commits
Require a pull request before merging · Require status checks to pass
Block force pushes · Require code scanning results · Require code quality results
Restrict code coverage · Automatically request Copilot code review
```

GitHub renders only the rules a repository is ELIGIBLE for, so the absence is
the measurement. Corroborating facts from the API:

```
visibility  public        owner type  User (litlfred)
in org      False         rulesets    0
```

`folio-assistant` is owned by a **personal account**, not an organization,
which is the likely cause. **Stated as the likely cause, not as the rule** —
`docs.github.com` is blocked by this container's egress proxy, so the exact
eligibility text could not be quoted. What is certain is the observed absence.

## What is now WRONG in the repository

`.github/workflows/code-quality-gates.yml:65`:

> *"A merge_group run tests EXACTLY the commit that will land. **Inert until
> the owner turns the merge queue on for `main`**; harmless before."*

That sentence promises a pending state that cannot arrive. Three workflows
carry `merge_group:` triggers — `code-quality-gates.yml`, `feature-staging.yml`
and `jsonld-gen-check.yml` — and `merge_group` runs ever: **0**, which will
not change.

The triggers themselves are harmless and are NOT proposed for removal: if the
repository ever moves under an organization they become correct with no work,
and removing them would have to be undone. What is wrong is only the CLAIM
about why they are inert.

## Why this is worth a bean rather than a silent edit

An agent reading that comment concludes the queue is one owner click away —
which is exactly what happened here, repeatedly, across a whole session. Bean
`391j`'s treadmill (CI green, `main` moves, PR goes `dirty`, merge again) was
diagnosed correctly several times and each time the recommended remedy was a
feature this repository cannot enable. The diagnosis stays right; the remedy
was never available.

That is the `1xhc` family pointed at prose rather than at a gate: a statement
that looks like a pending action and is unreachable, with nothing that would
ever contradict it.

## Owner ruling, 2026-09-30

Asked whether to enable the two features that ARE available — `allow_auto_merge`
and `allow_update_branch`, both currently `false` — the owner chose **neither,
leave settings alone**. Recorded so this is not re-proposed: merging `main` by
hand before each merge is the accepted cost.

## Done when

- [x] the `code-quality-gates.yml` comment says the queue is UNAVAILABLE here
      and why, rather than pending — done; `feature-staging.yml` and
      `jsonld-gen-check.yml` gained a pointer rather than a rewrite, because
      their comments describe what the trigger is FOR and only the
      reachability claim was wrong
- [ ] the eligibility rule is confirmed from GitHub's own documentation by
      somebody whose network can reach it, and written down; until then the
      org-ownership explanation stays labelled as inference
- [x] `391j`'s own text is checked for the same assumption, since it is the
      bean that recommends the queue — done, and it was not the only one. Five
      beans carried the claim: `391j` ("it is the owner's click"), `nytj`
      (an OPEN box naming a settings path that does not exist), `om30` (two
      boxes conditional on the queue going on), `nfv3` ("the moment the merge
      queue is on…") and `mc8h` (a no-queue ruling that was reversed and is
      now right for a different reason). Each carries a dated correction; the
      `nytj` box is closed not-done and `om30`'s is marked moot rather than
      deleted, because both become live again if the repository ever moves
      under an organization

## Not established

Whether moving the repository under an organization would unlock it, and what
that would cost. The owner was offered that investigation and did not take it,
so it is recorded as unexplored rather than ruled out.


## What was changed, 2026-09-30

Three workflows and five beans, in one PR:

| file | change |
|---|---|
| `code-quality-gates.yml` | the false sentence replaced with the measurement, the inference labelled as inference, and why the trigger is KEPT |
| `feature-staging.yml` | a pointer here; its comment also described a hang ("a required check that never reports leaves every queued PR pending forever") that likewise cannot occur |
| `jsonld-gen-check.yml` | a one-line pointer here |
| `nytj` | its open box closed **not done** — it named `Settings → Rules → Require merge queue`, a path that does not exist on this repository |
| `om30` | its two conditional boxes marked moot, kept unchecked |
| `391j`, `nfv3`, `mc8h` | dated corrections; each said or implied the flip was pending |

**No `merge_group:` trigger was removed.** Three of them run on zero events and
will keep doing so; that is not the `dh4f` shape (a consumer scanning nothing
and reporting a clean run) because nothing reads their verdict as coverage —
they are declarations that become correct if the ownership changes. The `1xhc`
failure was the *prose*, and prose is what was fixed.

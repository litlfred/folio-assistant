---
layout: default
title: 'Feature-branch staging'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/feature-staging.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/feature-staging.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/feature-staging.md){: .fa-edit-source }

{% raw %}
# Feature-branch staging

## When to use this skill

When a content change is being reviewed and the reviewer (or the author) needs
to **see the rendered result** before merging. The staging deployment puts the
feature branch's rendered site at:

```
https://<owner>.github.io/<repo>/STAGING/<branch-slug>/
```

## How it works

### 1. Feature branch → staging deployment

When an agent pushes to a feature branch, `feature-staging.yml` automatically:

1. Builds the docs site (Jekyll + TypeDoc + BPMN diagrams)
2. Writes the build's facts — commit SHA, timestamp, branch, PR, issue, build
   log — **once**, to `staging.json` at the preview root
3. Injects a **constant** staging banner at the top of every HTML page, which
   reads those facts in the browser
4. Deploys to `gh-pages/STAGING/<branch-slug>/`
5. Comments the staging URL on the PR

### 2. The staging banner

Every staged page carries a muted-sage banner:

> 🔀 **FEATURE BRANCH** — `claude/update-schedule` · commit `a1b2c3d` · built 2026-09-18T00:30:00Z · PR #42 · issue #215 · compare with main ↗ · build log

This makes it impossible to mistake staged content for the published site.

**Do not describe it as yellow.** It was `#d946ef`, which measured **3.46:1**
against its own white text and so FAILED the 4.5:1 WCAG AA threshold — the
banner was not merely glaring, it was the least readable element on every
staged page. `#4F6F52` measures 5.63:1. Any replacement gets checked the same
way; the pale decorator sages (`#9CAF88`, `#87A96B`) all land near 2.5:1.

#### The facts are fetched, not baked — and that is a storage decision

`cat-harness/scripts/staging-banner.ts` injects a fragment that is
**byte-identical on every page and across every rebuild**, and the browser
derives its preview root from `location.pathname`, fetches `staging.json` and
fills the banner in.

The banner used to be a bash string in `feature-staging.yml` with the SHA and
a `date -u` timestamp interpolated into all ~530 pages. Because the timestamp
changes every run, **every page was unique even across two builds of one
branch**: each re-push added ~27.5 MB of permanently new objects to
`gh-pages`, and the history grew even when the preview count did not. Measured
2026-09-19 (bean `g196`): 9 previews, **346.1 MB**, and **zero HTML blobs
shared between any two previews**.

Three consequences for anyone editing this:

- **Nothing per-build may go back into the fragment.**
  `staging-banner-constant.test.ts` runs two builds with different facts and
  compares the emitted bytes, so any leak fails regardless of how it is
  spelled. Add the fact to `staging.json` instead.
- **A failed fetch must still say PREVIEW.** The static markup carries
  "FEATURE BRANCH" before any fetch happens, and the fetch only ever ADDS
  detail. *"Could not determine" is never rendered as "this is the real
  site"* — the same third-state rule the rest of the repository runs on, and
  here the failure mode is a reviewer approving the wrong artefact.
- **Every value from the JSON goes in as `textContent`, never as markup.**
  Git ref names may contain `<`, `>` and `"` — they are not in git's forbidden
  set, which stops at space, `~`, `^`, `:`, `?`, `*`, `[`, `\` and the control
  characters. The bash version interpolated the branch name into a string;
  the client builds nodes. `staging-banner.e2e.ts` pins this with a branch
  name carrying an `onerror` payload.

Pages still differ **between** previews, because Jekyll's `relative_url`
prepends the `baseurl` to ~235 hrefs per page and the `fa-translation-index`
island publishes `site.baseurl` to JavaScript. Those are coupled to the
language switcher and are `g196`'s remaining half — not fixed here.

### 3. Commit SHA stamping

Both the main site (`docs-site.yml`) and staging sites write `docs/_data/build.yml`:

```yaml
sha: "a1b2c3d4e5f6..."
short_sha: "a1b2c3d"
built_at: "2026-09-18T00:30:00Z"
branch: "feature/update-schedule"
staging: true                      # false on main
staging_slug: "feature-update-schedule"
run_url: "https://github.com/.../actions/runs/12345"
```

A Jekyll layout can read `site.data.build.sha` to display the deployed version.

### 4. Before/after comparison

The reviewer opens both URLs side by side:

| Surface | URL | What it shows |
|---|---|---|
| **Main** (current) | `<pages-url>/` | The published state on `main` |
| **Staging** (proposed) | `<pages-url>/STAGING/<slug>/` | The feature branch's changes |

The commit SHA on each page confirms exactly what is being compared.

### 5. Cleanup

When the PR is merged or closed, the `cleanup` job in `feature-staging.yml`
removes `STAGING/<slug>/` from `gh-pages` so stale previews don't accumulate.

## Agent workflow

When an author requests a content change:

1. **Detect scope** — use `content-graph` and `integration-watcher` to
   identify affected blocks and downstream implications
2. **Create feature branch** — branch from `main`, open PR immediately
3. **Make changes** — edit content blocks, deterministic logic, translations
4. **Push** — the staging deployment happens automatically
5. **Report staging URL** — tell the author the preview is at
   `<pages-url>/STAGING/<slug>/`
6. **Iterate** — each push updates the staging deployment with a new SHA

The BPMN for this workflow is `processes/content-change-review.bpmn`.

## Staleness detection

The SHA stamp means staleness is always detectable:

- **Staging matches PR head** → the staging preview is current
- **Staging SHA ≠ PR head** → the staging preview is stale (push again)
- **Main site SHA = merge commit** → the publication is current
- **Main site SHA ≠ latest main** → docs-site.yml needs to run

## SMART Guidelines example (from issue #215)

An author needs to change the immunization schedule:

1. Agent detects the change affects:
   - Narrative content in the immunization chapter
   - Decision logic (CQL) for scheduling the next visit
   - Indicators that count doses administered
   - Referral logic for follow-up visits
2. Agent creates `feature/update-immunization-schedule`
3. Agent edits all affected blocks, assesses downstream impact
4. Push → staging deployment → author reviews
5. Author submits to the guidance review committee
6. Committee compares `main` vs `STAGING/feature-update-immunization-schedule/`
7. Committee approves → merge → staging cleaned up → main site updated

## Before you hand a staging URL to a person

**Check the ref, then say how long and come back.** A preview push is not a
served page, and the bot's *"Staging preview deployed"* comment reports the
first, not the second. List `STAGING/<slug>/` on `refs/heads/gh-pages` before
relaying the URL; say the `stage` job takes ~2 minutes and Pages adds up to ten
on top; schedule the re-check rather than promising it.

The reason it is a rule: an agent relayed one preview URL to the owner **five
times in a session** without checking anything, each time straight off the
bot's comment. Whether the site served it was never established in either
direction.

The three states, and why the third is not yours to assert, are in
[`staging-review`](staging-review.md) §"Before you hand a staging URL to a
person (STRICT)". It is the same rule and it is written once, there.

## Before you report a staging URL as broken

**Look at the publish ref, not the site.** A staging URL is LOOKED UP in
`gh-pages` under `STAGING/<branch-slug>/`, never composed from the source
path — `docs/<stub>/proposals/x.md` publishes to `/proposals/x.html`, and
composing it from the source path yields a 404 for a page that is there. From
an agent container a `curl` against a Pages URL fails on the proxy regardless,
so a failed fetch is not evidence either way.

Full rule and the measured failure:
[`github-state-inspection`](github-state-inspection.md).
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Staging a feature branch preview, and taking it down](../../processes/feature-staging.html)**.

<img src="../../assets/img/workflows/feature-staging.svg" alt="BPMN diagram: Staging a feature branch preview, and taking it down" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Content Change and Review](../../processes/content-change-review.html) | Create feature branch; Build staging site; Deploy to STAGING/<slug>/; Comment staging URL on PR; Remove STAGING/<slug>/ |
| [CRDM Phase 6 — implement, MVP, acceptance](../../processes/crdm-deliver.html) | Deploy the MVP to staging |
| [Publishing the docs site, and keeping the previews alive](../../processes/docs-site-publish.html) | Restore the OPEN PRs'&#10;staging previews |
| [Staging a feature branch preview, and taking it down](../../processes/feature-staging.html) | Build the docs site Jekyll · TypeDoc · KG export; Publish to STAGING/&lt;slug&gt;; Derive the slug from the head ref |
| [Adopting an upstream version bump](../../processes/upstream-version-adoption.html) | MVP: build the candidate on a staging branch |


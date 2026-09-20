---
name: staging-review
description: >-
  Staging preview and before/after comparison for content review.
  Provides before (MAIN) and after (STAGING) URLs for rendered content
  so reviewers can visually compare changes. Used by CRDM feature
  development workflow and content authoring review sessions.
capability: review
package: folio-core
---

# Staging review — before/after comparison

> Skill id: `staging-review` · Capability: `review` · Package: `folio-core`

Provide before/after URL pairs whenever rendered content has changed in a
feature branch. This is part of every review or feedback session involving
visual content.

## When to provide before/after URLs

Provide before/after URLs in **every** interaction where:

1. **Content has changed** on a feature branch (authoring, editing, translation)
2. **CRDM feature development** — once requirements are agreed and a staging
   preview exists
3. **Review/feedback sessions** — when the user asks to review changes
4. **Translation review** — comparing translated vs source pages

## Before/after URL schema

Every feedback response involving rendered content must include a
`stagingComparison` object:

```typescript
interface StagingComparison {
  /** Feature branch name (e.g. "claude/206-staging-preview"). */
  branch: string;
  /** URL to the branch on GitHub. */
  branchUrl: string;
  /** PR number if one exists. */
  pr?: number;
  /** Pairs of before (main) and after (staging) URLs for changed pages. */
  pages: Array<{
    /** Page title or path. */
    title: string;
    /** URL on the main (production) site. */
    before: string;
    /** URL on the staging preview site. */
    after: string;
    /** What changed on this page. */
    summary?: string;
  }>;
}
```

### Example output

When reporting changes to the user:

```
### 📋 Staging comparison

| Page | Before (main) | After (staging) | What changed |
|---|---|---|---|
| Landing page | [main](https://litlfred.github.io/folio-assistant/) | [staging](https://litlfred.github.io/folio-assistant/STAGING/claude-206-staging-preview/) | Added French translation badge |
| French landing | — | [staging](https://litlfred.github.io/folio-assistant/STAGING/claude-206-staging-preview/fr/index.html) | New page |
| Agent onboarding | [main](https://litlfred.github.io/folio-assistant/guides/agent-onboarding.html) | [staging](https://litlfred.github.io/folio-assistant/STAGING/claude-206-staging-preview/guides/agent-onboarding.html) | Language switcher added |
```

## URL construction

### Main (before)

```
https://<owner>.github.io/<repo>/<path>
```

Read from `harness.config.json` → `readme.pagesBaseUrl`, or construct from
the repo's GitHub Pages URL.

### Staging (after)

```
https://<owner>.github.io/<repo>/STAGING/<branch-slug>/<path>
```

The `<branch-slug>` is the branch name with non-alphanumeric characters
replaced by hyphens (the same transform as `feature-staging.yml`).

### Deriving the slug

```typescript
function branchToSlug(branch: string): string {
  return branch
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
```

## Integration with CRDM

In the CRDM requirements workflow (Phase 5: implementation), once a staging
preview is deployed:

1. **Post the staging URL** on the GitHub issue as a comment
2. **Include before/after table** for every changed page
3. **Link from the PR body** to the staging preview
4. **Remind reviewers** that staging uses the magenta "FEATURE BRANCH" banner

The staging preview is part of the acceptance criteria: stakeholders must
review the rendered output, not just the code diff.

## Integration with content authoring

When an author has made content changes on a feature branch:

1. **List all changed files** in the feature branch vs main
2. **Construct before/after URLs** for each changed docs page
3. **Present the comparison table** to the author
4. **Offer to run the staging workflow** if not already running

## Staging retention

**A MERGED pull request's preview goes away. Everything else is retained by
default.** Owner, 2026-09-20: *"change policy, if merged to main, then staging
goes away"* — replacing a blanket retain-on-close.

The distinction is about **where the content lives**, not about how confident
anyone is:

| the PR was | the preview is | so |
|---|---|---|
| **merged** | the same thing the MAIN SITE now shows | redundant on the instant, and removed automatically — no label |
| **closed, unmerged** | the ONLY rendering of that work | the last copy, and retained unless a person says otherwise |

**The store DRAINS, and the size threshold depends on it.** Under the old
retain-on-everything policy the total only ever grew, so any warning point was
breached once and stayed breached — a permanent verdict rather than a signal.
Now what remains is bounded by **concurrent reviews**, not by cumulative
history, which is why the warning point could move from 100 MB to **500 MB**
on 2026-09-20 and start meaning something again: at the measured ~38 MB per
preview it is about **thirteen concurrent reviews**, and half the documented
1 GB Pages ceiling.

The floor still governs and pruning is still not the action: a live branch's
preview must not be removed, so N concurrent reviews floor the total at
N × ~38 MB. What changed is that the floor now **falls on its own** as work
merges, instead of being carried forever.

**This is not a relaxation of
[`deletion-requires-confirmation`](deletion-requires-confirmation.md) — it is
that rule applied more precisely.** The merge *is* the confirmation: a person
decided this content belongs on `main`, which says more about the preview than
a label does. What the label still guards is the case where nobody decided
anything.

And it does **not** reverse `plj1`. That failure deleted every **open** PR's
preview — work nobody had accepted, mid-review. Nothing here touches an open
PR, and the one-directory-at-a-time shape that bean forced on the job is
unchanged.

**Which mechanism depends on whether the PR is still open, and that is not a
detail.** Three cases, and the label cannot reach a closed PR:

0. **Merged** — nothing to do. `cleanup` reads
   `github.event.pull_request.merged` off the close event and removes without
   a label, recording the reason as `merged`.
1. **While the PR is open, and it will not be merged** — add the
   `staging:cleanup` label. `cleanup` in `feature-staging.yml` fires on
   `pull_request_target: closed` and reads the labels off that event, so the
   label has to be there *before* the PR closes.
2. **Once the PR is closed unmerged and unlabelled** — run
   `feature-staging.yml` from the Actions tab
   with `cleanup_slug: <slug>` and `cleanup_confirm: <slug>`. The confirmation
   repeats the slug so that it names the artefact it confirms, and the job
   re-checks that nothing is still using the preview before it removes
   anything.

**Labelling a closed PR does nothing, and re-running its old workflow run does
nothing either** — a re-run replays the stored event payload, which still
carries no label. That was the state of things until bean `w2g5`: the health
sweep's `staging-preview-orphans` finding can only ever name a preview whose PR
is already closed, so the remedy it documented was unreachable for every orphan
it could report. If you find yourself reaching for a hand-pushed `gh-pages`
commit instead, stop: that is the unilateral removal
[`deletion-requires-confirmation`](deletion-requires-confirmation.md) exists to
stop, and option 2 exists so you do not have to.

### A closed PR is not an abandoned preview

`staging-preview-orphans` does **not** ask "is there an open PR?" any more, and
neither should you. A session that reuses one branch across successive pull
requests has no open PR for the whole gap between one merging and the next
opening — measured at 5m42s on `claude/brave-hypatia-r820sf`, 2026-09-19, and
the sweep landed inside it and called a live branch an orphan. Liveness is
three signals, any one of which means leave it alone: an open PR, a branch on
the remote carrying work not in the default branch, or a tip commit in the last
30 minutes. `scripts/staging-cleanup-preflight.ts --slug <slug>` answers the
same question on demand, and the dispatch above runs it before removing.

## Before you hand a staging URL to a person (STRICT)

**A staging URL is not a deliverable until you have checked the ref, and it is
never "live" on your say-so.** The rule exists because it was broken here: in
one session an agent relayed the same preview URL to the owner **five times**
without once checking anything, each time off the back of the bot's comment —
which says a workflow *pushed*, not that a site *serves*.

Three states, and conflating any two of them is the defect:

| | observable from a container? | how |
|---|---|---|
| the `stage` job succeeded | **yes** | the check run on the PR's head |
| the files are in `gh-pages` | **yes** | read `STAGING/<slug>/` on `refs/heads/gh-pages` |
| the URL serves them | **NO** | see below |

**The third is not available to you, and `curl` will not make it available.**
The proxy blocks `github.io`, so a fetch returns `000` and says nothing either
way. And where Pages is configured as *Deploy from a branch* — as it is here —
its builds produce **no workflow runs at all**: measured 2026-09-20,
`event: page_build` returns `total_count: 0` and there is no
`pages-build-deployment` workflow to query. So there is no API answer either.

So: **verify the ref, and report the third state as unverified rather than
inferring it.** Listing `STAGING/<slug>/` on `gh-pages` and finding
`index.html` proves the build ran and what it published; it does not prove
Pages has rebuilt. Those are different claims and only one of them is yours to
make.

### Say how long, and come back

A person handed a URL with no timing either refreshes a 404 or walks away.
Give them the number and the follow-up, in the same breath as the link:

- **The `stage` job takes ~2 minutes.** Measured 2026-09-20 over three
  consecutive runs: 1m44s, 1m58s, 2m17s. That is the push to `gh-pages`, and
  it is the part the check run tells you about.
- **Pages propagation is on top of that**, and GitHub documents it as up to
  ten minutes. Since it is unobservable from here, quote the bound rather than
  a guess: *"give it ~5 minutes; up to 10 if Pages is slow."*
- **Then actually check back.** Schedule it rather than promising it — the
  same mechanism that watches a PR. Re-list the ref, and if the person reports
  a 404 after the window, that is a real finding worth chasing; before it, it
  is the window.

Never present a URL as though it is already serving. *"Deployed to `gh-pages`,
should be live in ~5 minutes"* is the honest sentence and costs nothing.

## Do not

- **Do not hand over a staging URL without listing `STAGING/<slug>/` on
  `gh-pages` first.** The bot's comment says a workflow pushed, not that a
  site serves, and relaying it unchecked is what this section exists for.
- **Do not say a preview is "live", "up" or "deployed and ready"** unless
  someone has loaded it. You cannot see that from here.
- **Do not provide before/after URLs without checking the staging workflow
  has run.** A URL that 404s is worse than no URL.
- **Do not auto-remove staging previews.** A person confirms every removal —
  the label while the PR is open, or the dispatch with its repeated-slug
  confirmation once it is closed.
- **Do not read "no open pull request" as "abandoned".** It is true of a live
  branch for the whole gap between one PR merging and the next opening.
- **Do not assume all pages are at the root.** Guides are under `guides/`,
  reference under `reference/`, French under `fr/` etc.
- **Do not omit the comparison table.** Even for a single page change, show
  the before/after pair — it is the whole point of staging.

## Before you report a staging URL as broken

**Look at the publish ref, not the site.** A staging URL is LOOKED UP in
`gh-pages` under `STAGING/<branch-slug>/`, never composed from the source
path — `docs/<stub>/proposals/x.md` publishes to `/proposals/x.html`, and
composing it from the source path yields a 404 for a page that is there. From
an agent container a `curl` against a Pages URL fails on the proxy regardless,
so a failed fetch is not evidence either way.

Full rule and the measured failure:
[`github-state-inspection`](github-state-inspection.md).

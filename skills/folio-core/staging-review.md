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

Read from `folio.config.json` → `readme.pagesBaseUrl`, or construct from
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

Staging previews are **retained by default** when a PR is closed or merged.
Removal requires the `staging:cleanup` label on the PR. This ensures
reviewers can continue comparing before/after even after the code is merged.

To clean up a staging preview:
1. Add the `staging:cleanup` label to the PR
2. Re-run the cleanup workflow, OR
3. Manually delete `STAGING/<slug>/` from the `gh-pages` branch

## Do not

- **Do not provide before/after URLs without checking the staging workflow
  has run.** A URL that 404s is worse than no URL.
- **Do not auto-remove staging previews.** The `staging:cleanup` label is
  required.
- **Do not assume all pages are at the root.** Guides are under `guides/`,
  reference under `reference/`, French under `fr/` etc.
- **Do not omit the comparison table.** Even for a single page change, show
  the before/after pair — it is the whole point of staging.

---
name: publish-site
description: >
  Give an instance a site: its Knowledge Graph rendered for publication at
  its site address, and the address answering. Four checks — a workflow
  publishes it, the gh-pages branch exists, Pages serves that branch, the
  address answers. How the rendering is staged and pushed is the toolset's
  own process, not this skill's.
---

# The site: an instance rendered for publication, and its address answering

**One abstract step.** An instance with a `repository` is **rendered for
publication at its site address, and the address answers**. How the
rendering is staged, committed and checked is the toolset's own subprocess
(its render-to-GitHub-Pages skill and diagram), so this skill stays a list
of checks. Owner, 2026-09-30: bootstrap is not to be overloaded with the
publication lifecycle.

**The site is the vehicle, not the goal.** The goal is the harness's JSON
Schemas and JSON-LD answering at the IRIs they name
([`publish-documents`](publish-documents.md), the primary step); a README
page for people rides along.

The site address is the declaration's `iriBase` when it declares one,
otherwise `https://<owner>.github.io/<repo>/`. **An address a declaration
names and that answers 404 is a broken promise**, and every IRI minted under
it breaks with it.

## The checks ([`initialization-steps`](initialization-steps.md))

| step | done when |
|---|---|
| `site:workflow` | a workflow under `.github/workflows/` commits the rendering onto `gh-pages` — bootstrap's [`pages.yml`](../.github/workflows/pages.yml) is the pattern |
| `site:branch` | a `gh-pages` branch exists. **It must exist before Pages can be switched on** (owner, 2026-10-01: *"need to create gh-pages branch before can turn on"*); where it does not, the step says how to create it (an orphan branch with a placeholder page) |
| `site:enabled` | Pages is on, serving `gh-pages` at `/`. Switched on only by an authenticated forge CLI once the branch exists; otherwise the person gets the one step below |
| `site:live` | the address answers 200. 404 after Pages is on usually means the workflow has not run yet. A 403, 407, 5xx or no answer is about the way from here: *could not determine*, never done |

When `site:enabled` cannot be done here, it goes to the person through
[`human-agent-discussion`](human-agent-discussion.md), written so it can be
followed without opening anything else:

> Open `https://github.com/<owner>/<repo>/settings/pages`. Under "Build and
> deployment", set **Source** to **Deploy from a branch**, branch
> **`gh-pages`**, folder **`/ (root)`**. It is free for a public
> repository. Then re-run the Pages workflow from the Actions tab, or push
> to `main`.

If Pages is already on but serves something else, **do not switch it
yourself**: that changes how an existing site is built, so ask.

Never silent: a step that could not be checked is said to be unchecked.

## Cost

Pages on a public repository, and the Actions minutes its workflow uses, are
free. Nothing else is switched on.

---
# folio-assistant-kuxk
title: feature-staging.yml hardcodes /folio-assistant/ as the Jekyll baseurl, 76 lines above the correct idiom
status: todo
type: bug
priority: normal
created_at: 2026-09-19T10:06:56Z
updated_at: 2026-09-19T10:06:56Z
---

Found 2026-09-19 while researching `folio-assistant-1lfx`.

## The defect

`.github/workflows/feature-staging.yml:160`:

```sh
echo "baseurl: \"/folio-assistant/STAGING/${SLUG}\"" >> docs/_config.yml
```

The repository name is a **literal in a platform workflow**. Jekyll uses
`baseurl` to generate every internal link, so in any folio whose repository
is not named `folio-assistant`, every link on every staging page points at a
path that does not exist. The site builds, deploys and looks fine from the
workflow's point of view — it is only wrong in the browser.

## Why this one is cheap to fix and easy to believe

**The correct idiom is already in the same file, 76 lines below** — line 236
composes the main-site URL as:

```sh
MAIN_SITE="https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}"
```

So `${{ github.event.repository.name }}` is available, is already used, and
is what line 160 should read. One expression, no new mechanism.

## The family it belongs to

This is the genericity failure `AGENTS.md` records repeatedly, in a file
nobody re-read when the others were fixed:

- `generate-readme.sh` ended in `cp "$OUT" README.md` with one folio's title
  and badges baked in
- modules were prefixed `QOU.` regardless of the folio's Lake library
- the simulator directory was the literal `folio-assistant/simulators`

Each was found in `scripts/` or `content/pipeline/`. **The workflows were
never swept**, which is worth knowing beyond this one line: the same question
should be asked of every `.github/workflows/*.yml`.

## Done when

- [ ] line 160 reads the repository name rather than spelling it
- [ ] the remaining workflows are swept for the same shape, and the result is
      written down — including "none found", which is a determined answer
- [ ] a test or check catches a folio literal in a workflow, or there is a
      recorded reason why that is not worth automating

## Not verified

That a staging build in another repo actually breaks. The reasoning is from
reading Jekyll's `baseurl` semantics and the workflow, not from standing up a
second folio — which is bean `58h0`'s job, not this one's.

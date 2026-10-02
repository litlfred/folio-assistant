---
# folio-assistant-kuxk
title: feature-staging.yml hardcodes /folio-assistant/ as the Jekyll baseurl, 76 lines above the correct idiom
status: completed
type: bug
priority: normal
created_at: 2026-09-19T10:06:56Z
updated_at: 2026-09-19T10:22:08Z
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

- [x] line 160 reads the repository name rather than spelling it
- [x] the remaining workflows are swept for the same shape, and the result is
      written down — including "none found", which is a determined answer
- [x] a test or check catches a folio literal in a workflow, or there is a
      recorded reason why that is not worth automating

## Not verified

That a staging build in another repo actually breaks. The reasoning is from
reading Jekyll's `baseurl` semantics and the workflow, not from standing up a
second folio — which is bean `58h0`'s job, not this one's.

## Summary of Changes, 2026-09-19

`feature-staging.yml` now composes the baseurl from
`github.event.repository.name`. Guard:
`scripts/tests/workflow-repo-name.test.ts`, proven to FAIL against the real
pre-fix line and pass after — not only against a string fixture.

## The sweep, with its result

All 14 workflows, `grep` for `folio-assistant`. **One** true instance:
line 160. It was the single outlier in its own file — five other places in
`feature-staging.yml` compose the same URL from
`github.event.repository.name` or `GITHUB_REPOSITORY` and are correct.
Only one `baseurl` is written anywhere in the repository's workflows.

**What is NOT the defect**, and why the guard is narrow rather than a
`folio-assistant` grep — a checker that flagged these would be disabled
within a week:

- prose (`::error::folio-assistant is the PLATFORM and carries no papers`)
- the SUBMODULE directory (`folio-assistant/computations`,
  `working-directory: folio-assistant`) — a folio checks the platform out
  into a directory of that name. A fact about the DEPENDENCY, not about this
  repository's own name, and correct as written
- artefact stems (`folio-assistant.jsonld`), which come from the stub

## One thing noticed and deliberately not chased

`discoverability-docs.yml:208` sets `working-directory: folio-assistant`,
and **no such directory exists in this repository** — it is the
platform-as-submodule path, which only resolves when the platform is checked
out inside a folio. Whether that step can ever run here is a separate
question from this bean's, and I did not verify it either way rather than
assert it. Worth someone's look.

## Repo name, not stub

They coincide here and the distinction matters elsewhere: Pages serves at
`<owner>.github.io/<repo>/`, so the browser path is the REPO's, while the
site DIRECTORY is `docs/<stub>` and is `siteDirFor`'s answer. Recorded in
the workflow comment so the next reader does not have to re-derive it.

---
# folio-assistant-x09n
$schema: bean/1.0.0
title: 'Unpinned third-party actions in write-token workflows (smart-base, smart-ra, smart-immunizations)'
status: todo
type: bug
priority: high
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:20:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security (RED FLAG, blocking) · **severity:** major · **rule:** scz-pin-third-party-by-full-sha (security.md row "a third-party action → a runner": `security:gate` blocks this)

**Where (tag or branch refs, no SHA):**
- smart-ra `release.yml`: `actions/checkout@v2` (line 22) and `WorldHealthOrganization/smart-html/.github/workflows/release.yml@main` (38) with `contents`, `pages`, `id-token` and `pull-requests: write`. The most exposed: an OIDC token and a write token handed to another org's moving branch.
- smart-base: `ghbuild.yml` (`JamesIves/github-pages-deploy-action@v4.4.2` ×5 at 984-1055, `docker://hl7fhir/ig-publisher-base:latest` ×3 at 462-476, checkout/setup-python/upload-artifact @v4/v5), `site-publish.yml` (checkout@v4, `oven-sh/setup-bun@v2`, `ruby/setup-ruby@v1`; contents: write), `commit-pot.yml`, `generate_translation_report.yml`, `generate_weblate_yaml.yml`, `pull_translations.yml`, `prune-branches.yml`, `skill-l2-dak.yml` (contents: write), `pr-deploy-slash.yml` / `pr-validate-slash.yml` (`actions/github-script@v7` ×4 each; actions: write), `classify-issue.yml`, `skill-l1/l3/translation` (issues: write), `release.yml` (`WorldHealthOrganization/smart-html…@main`), `fhirbuild.yml`, `kg.yml`, `register_translation_project.yml`.
- smart-immunizations: `site-publish.yml` (checkout@v4, setup-bun@v2, setup-ruby@v1; contents: write), `release.yml` (checkout@v3, `WorldHealthOrganization/smart-html…@main`).
- First-party reusable workflows are called `@main` in all four repos (`litlfred/cat-harness-tools/.github/workflows/layer-*.yml@main`, `litlfred/fhir-harness/.github/workflows/ig-ast-refresh.yml@main`, `litlfred/smart-base/.github/workflows/{ghbuild,fhirbuild}.yml@main`, `litlfred/folio-assistant-core/…@main`). Same owner, so lower risk, but still a moving ref.

**Mitigation today:** almost all of these are `workflow_dispatch` only.

## Done when
- [ ] `bun run cat actions:pin` (cat-harness-tools `scripts/pin-actions.ts`) run in each repo; every third-party `uses:` is a 40-hex SHA with its `# <ref>` comment; docker images carry `@sha256:`
- [ ] the WHO smart-html release call is pinned to a SHA, and smart-ra's release job drops `id-token: write` unless the called workflow needs it

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

---
# folio-assistant-8pyz
title: 'site.data.* undefined renders as empty with no warning: make undefined Liquid variables in IG-site builds a reported finding'
status: todo
type: bug
priority: high
created_at: 2026-10-09T15:38:22Z
updated_at: 2026-10-09T16:05:06Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-09, reviewing the smart-* deployments: *"is a warning made when referenced variable DNE? (QA reports)"*. It is not, for `site.data.*`.

## What was measured (2026-10-09, gh-pages of litlfred/smart-immunizations @ 51454a6)

`testing.html` carries four links of the form
`https://raw.githubusercontent.com///main/testing/docker/logic/.env` — the source
(`input/pagecontent/testing.md`) reads
`{{site.data.features.github.repo_owner}}/{{site.data.features.github.repo_name}}`,
both undefined at build time, both rendered as the empty string. No build error,
no log line, no QA sidecar.

## Why nothing caught it

- `liquid-values.ts` (cat-harness) is NEVER SILENT for prefixes it owns —
  `⟦unresolved: …⟧` plus a report — but fhir-harness declares `site.data` as
  PASS-THROUGH, so those references reach Jekyll untouched.
- The site build's Jekyll config (`cat-harness/docs/_config.yml`) sets no
  `liquid:` block, so Jekyll runs `strict_variables: false`: undefined ⇒ `""`.
- `ig-site-data.ts` lists unfilled `site.data.fhir` fields as `undetermined`
  in the build log only, and nothing outside `site.data.fhir` is tracked at all.

## Plan

Either (a) `liquid: { strict_variables: true }` for IG-site builds — measure
first how many references the theme itself leaves undefined, since a strict
build that fails on just-the-docs internals is worse than none; or (b) a gate
that collects every `site.data.*` reference in staged sources and checks it
against the composed `_data/`, reporting unresolved ones as a finding (and
could-not-determine as unknown, never clean). (b) is safer to land first.

## Done when

- [ ] an undefined `site.data.*` reference in a staged IG page fails the folio-site build or a declared gate, naming page, line and key
- [ ] the result is a QA sidecar (stored on qa-reports), not just console output
- [ ] re-running against smart-immunizations at 51454a6's source flags the four `testing.html` references


## 2026-10-09 — owner: strict, but message rather than error

Owner: *"jekyll strict (if not error out, just message)"*. So: `strict_variables` semantics, but an undefined variable is LOGGED (page, key) and the build continues — not a failed build. Supersedes option (a)/(b) above: do (a) in warn-only form.


2026-10-09: implemented in https://github.com/litlfred/cat-harness/pull/50 — docs/_plugins/liquid-undefined-warn.rb, warn-only. Inert under the github-pages safe-mode build.


2026-10-09: owner chose a CI check outside the render ("1 but CI is in CI not part of render"): https://github.com/litlfred/folio-assistant/pull/2523 — liquid-undefined.yml rebuilds each render's jekyll-source artifact with the plugin; findings are a message, could-not-check fails. Live only after cat-harness#50 merges AND the cat-harness pin includes it.

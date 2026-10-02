---
# folio-assistant-ohhu
title: 'Relicense: Apache-2.0 for code, CC BY 3.0 for prose (was MIT)'
status: completed
type: task
priority: normal
created_at: 2026-09-18T23:12:56Z
updated_at: 2026-09-19T00:09:48Z
---

Owner decision (2026-09-18): move folio-assistant off MIT to a split licence —
**Apache-2.0 for source, CC BY 3.0 Unported for documentation and skill prose.**

Prompted by "match smart-base". Measured this session:
`WorldHealthOrganization/smart-base` is **not** Apache — its `LICENSE.md` is
CC BY 3.0 **IGO**, and its `sushi-config.yaml` declares `CC-BY-SA-3.0-IGO`
(the two disagree with each other). IGO is dropped here because
folio-assistant is not an IGO work, and Apache-2.0 is chosen for code because
CC licences are not software licences — no patent grant, no source/object terms.

Relicensing authority: `git shortlog -sne --all` on 2026-09-18 gives
Carl Leitner (64 commits across two identities) plus agent/bot commits made on
his behalf. Sole human copyright holder, so the change is his to make.

## Todo
- [x] `LICENSE` -> full Apache-2.0 text (canonical apache.org copy, so GitHub detects it)
- [x] `NOTICE` with the Apache attribution notice
- [x] `LICENSE-CONTENT.md` -> CC BY 3.0 Unported grant, scoped to prose
- [x] `package.json` licence field
- [x] `schemas/block-qa-schema/package.json` + `pyproject.toml` (classifier too)
- [x] `schemas/block-qa-schema/README.md` (also links `litlfred/qou`, wrong repo)
- [x] `README.md` badge + License section
- [x] `docs/_config.yml` footer
- [x] `Dockerfile` OCI label `org.opencontainers.image.licenses` (missed by the first grep — the pattern did not match `licenses="MIT"`)
- [x] re-grep for surviving MIT assertions

## Done when
A repo-wide grep finds no file asserting MIT as folio-assistant's own licence,
GitHub's repo sidebar reads Apache-2.0, and the README states which half of the
tree each licence covers.

## Summary of Changes

`LICENSE` is now the canonical Apache-2.0 text from apache.org, appendix filled
with `Copyright 2026 Carl Leitner`, so GitHub's sidebar detects Apache-2.0.
`NOTICE` carries the Apache attribution notice plus the one third-party
component redistributed here (qrcode-generator, MIT, under
`docs/assets/js/vendor/`). `LICENSE-CONTENT.md` carries the CC BY 3.0 Unported
grant with a table naming exactly which paths it covers, and states that a
Markdown file embedding a code sample splits (code Apache, prose CC BY) with
Apache-2.0 as the fallback if one licence is needed for the whole file.

Metadata swept: `package.json`, `schemas/block-qa-schema/package.json`,
`pyproject.toml` (field *and* the OSI classifier), that package's README
`## License` line, `README.md` badge and `## License` section,
`docs/_config.yml` footer, and the `Dockerfile` OCI label.

Verified: a repo-wide grep leaves only third-party MIT mentions (the vendored
qrcode shim and prose describing lean-atlas / docling / LeanDojo as MIT
projects). `readme:audit` reports 19/19 links resolved, 0 dead. `bun test`
gives 698 pass / 101 fail / 91 errors — **identical to the same run with the
changes stashed**, so every failure is pre-existing and none is licence-related.

Not done, deliberately: `schemas/block-qa-schema/`'s `repository`, `homepage`
and `bugs` fields still point at `litlfred/qou`, and its description still says
"QOU block-QA sidecar format". That is package-identity drift from the migration,
not a licence fact; fixing it under a licence change would hide it.

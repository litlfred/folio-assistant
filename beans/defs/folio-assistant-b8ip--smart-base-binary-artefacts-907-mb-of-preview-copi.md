---
# folio-assistant-b8ip
title: 'smart-base binary artefacts: 907 MB of preview copies on gh-pages, release carries only package.tgz, downloads page promises 19 assets'
status: todo
type: task
priority: normal
created_at: 2026-10-02T06:29:45Z
updated_at: 2026-10-02T06:51:49Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-02: *"see what happens on smart-base with binary artefacts on release. add to skills/tools"*.

**Measured** with `ig-binary-audit` on `litlfred/smart-base` `gh-pages` `64ed896d`:
- **Size:** 5,029.7 MB in all, of which 966.5 MB is Publisher binaries.
- **Previews:** 907.1 MB of those binaries (94 %) sit in 29 `branches/` previews.
- **Largest single file:** `full-ig.zip` takes 644.7 MB in 30 copies.

The full account of what each workflow does is in `dak-postprocessing` §"Binary artefacts on deploy and on release":
- `ghbuild.yml` deploys every binary under 100 MB, to every branch preview.
- `release.yml` hands off to smart-html's `ig_publisher.py`, which uploads only files over 100 MB plus `package.tgz` as release assets.
- `create_package_release.py` is never called.
- `downloads.md` promises 19 release assets that no release carries.

Related, and NOT the same question: `rjug` §2 (whether a binary release is a declared graph kind).

## Proposed (the owner's call, in the WHO repositories)
1. A branch preview deploys no Publisher binaries: exclude them in `ghbuild.yml`'s candidate deploy.
2. A release uploads what `downloads.md` lists, by wiring `create_package_release.py` or by widening `ig_publisher.py`'s asset step. Make the page's list and the release's actual assets one list.
3. Whether to remove the existing 907 MB of preview binaries from `gh-pages` is a deletion, so it waits on the owner (`deletion-requires-confirmation`).

## Done when
- [ ] the owner has chosen among 1–3
- [ ] the chosen changes are proposed as PRs on the WHO repositories (or the fork), not here
- [ ] `ig-binary-audit` re-run on the branch after the change, with the numbers recorded here

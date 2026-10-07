---
# folio-assistant-b8ip
title: 'smart-base binary artefacts: 907 MB of preview copies on gh-pages, release carries only package.tgz, downloads page promises 19 assets'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T06:29:45Z
updated_at: 2026-10-02T07:57:50Z
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

## Owner ruling 2026-10-02

*"previews dont get binary, only releaes. KG should point to release binaries so people can materialze if they want. also so can list on ig justthedocs pages somewhere"*

1. **A preview carries no Publisher binaries.** Releases are the only place they are published.
2. **The KG holds pointers, not bytes.** Each release asset is recorded with its name, size, digest and download URL, so anyone can materialise it on demand.
3. **The IG's just-the-docs site lists them**, on a page generated from those pointers.

Option 3 of the proposal (removing the existing preview binaries from `gh-pages`) is a deletion. It is still not decided, and it is not part of this ruling.

## 2026-10-02: pointers and page built

- `fhir-harness/schemas/ig-releases.ts` declares `ig-releases/v1`. `ingest-ig-releases.ts` (a Tool) writes `<instance>/fhir-artifact-index/releases.json` from GitHub's release list. It records pointers only: name, size, SHA-256 and download URL.
- **smart-base:** 2 releases and 10 asset pointers, from `litlfred/smart-base`.
- **smart-trust:** 0 releases.
- `build-ig-site` writes a generated `releases` page when the instance has a record. I rendered it in Jekyll with smart-base's record: 10 download links and 2 tables.
- **Gap:** smart-base has no `menu.json`, so `stage-ig-sites` does not stage its IG site, and the page only shows on smart-trust's site, which has no releases yet.
- **Open, for the owner:** our own staging preview still serves `smart-trust/fhir-artifact-index/package.tgz` (228,587 bytes), which the resource JSON views read in the browser. "Previews dont get binary" would remove it, so the views would need another source.

## Owner, 2026-10-02: "2y"
Read as agreeing to the stated default: our staging preview keeps serving `smart-trust/fhir-artifact-index/package.tgz` (228,587 bytes) for now, because the resource JSON views read it in the browser. This is a recorded exception to "previews dont get binary", and it stays until the JSON views have another source. If the owner meant to remove it, this is the line to change.

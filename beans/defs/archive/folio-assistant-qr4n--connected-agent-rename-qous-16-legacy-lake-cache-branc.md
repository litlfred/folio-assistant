---
# folio-assistant-qr4n
$schema: bean/1.0.0
title: 'CONNECTED AGENT: rename qou''s 16 legacy lake-cache/* branches to cat/folio-assistant-sci/lake-cache/* with the GitHub rename API'
status: completed
type: task
priority: normal
created_at: 2026-10-24T07:58:00Z
updated_at: 2026-10-24T10:03:45Z
parent: folio-assistant-fs43
---

Unblocks `folio-assistant-32f6` (box 5) and `folio-assistant-oycs` (precondition 3).
The owner chose this on 2026-10-24 07:45Z (card "A. I rename all 16") and asked at 07:54Z
for a bean that a connected agent runs. It runs on the owner's machine because the cloud
sessions' GitHub proxy refuses the rename API (`POST /repos/{owner}/{repo}/branches/{branch}/rename`
returned HTTP 403 "Write access to this GitHub API path is not permitted through this proxy").
**You only rename and report.** The cloud thread "Drain KG tools beans" closes 32f6 and does oycs.

Rules:
- use the rename API only: it keeps a redirect from the old name and deletes nothing;
- never `git push --delete`, never push copies under the new names;
- touch no other qou branch and no file in qou;
- open no PR, merge nothing, run no GitHub Actions;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`.

## 0. Claim

Set `status: in-progress`, add a Log line, then commit and push.

## 1. Dry run

reset; cd ~/space_cats/qou && git fetch && git ls-remote --heads origin 'lake-cache/*' 'cat/folio-assistant-sci/lake-cache/*'

Expect 16 `lake-cache/*` heads and 0 under `cat/folio-assistant-sci/lake-cache/`. Measured
2026-10-24 07:40Z: `Qq-v4-24-0-e2e-test`, `qou-docgen4-v4-24-0`, `qou-v4-24-0`,
`qou-v4-24-0-h4-wedderburn-cone`, `qou-v4-24-0-logbounds-summable`,
`qou-v4-24-0-mathlib-gap-modules`, `qou-v4-24-0-new`, `qou-v4-24-0-pre-2026-08-08`,
`qou-v4-24-0-repthy-wedderburn`, `qou-v4-24-0-root-import-closure`, `qou-v4-24-0-test`,
`staging-test`, `toolchain-v4-24-0`, `ugb-v4-24-0`, `zz-ugb-basetest`, `zz-ugb-streamtest`.
If the list differs, stop and record the difference here.

## 2. Rename

for b in $(git ls-remote --heads origin 'lake-cache/*' | awk '{print $2}' | sed 's#refs/heads/##'); do gh api -X POST "repos/litlfred/qou/branches/${b//\//%2F}/rename" -f new_name="cat/folio-assistant-sci/lake-cache/${b#lake-cache/}" -q .name; done

A failure on one branch: record it and go on with the rest.

## 3. Verify

Re-run step 1. Expect 0 `lake-cache/*` and 16 `cat/folio-assistant-sci/lake-cache/*`. Then
check one redirect: `gh api repos/litlfred/qou/branches/lake-cache%2Fqou-v4-24-0 -q .name`
should answer with the new name.

## Done when

- [x] 16 heads under `cat/folio-assistant-sci/lake-cache/`, 0 under `lake-cache/` (step 3 output pasted below)
- [x] the redirect check answers with the new name
- [x] Log line with the time; status `completed`

### Step 3 verification output (2026-10-24)

```text
$ cd ~/space_cats/qou && git fetch --prune && git ls-remote --heads origin 'lake-cache/*' 'cat/folio-assistant-sci/lake-cache/*'
73bfc79c2fb03714b52a16a76647a231899da2fe	refs/heads/cat/folio-assistant-sci/lake-cache/Qq-v4-24-0-e2e-test
30162f211fd94cef4c04107fb97593254d62da62	refs/heads/cat/folio-assistant-sci/lake-cache/qou-docgen4-v4-24-0
a792c46d01b6e350fb346e4b2965a97d6bc16248	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0
0c0376eb2ffffde18868e9a375e12a0cf237ce0c	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-h4-wedderburn-cone
68b5458116a6e5c2b971f85f931bc4adc84ea9f7	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-logbounds-summable
2004227c91856e1db5ea9edc11853568cc8e43f7	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-mathlib-gap-modules
55dcf154e2103b5929cf275425913e74edb40a60	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-new
3068be7b233caaaff32cb498e03b54a5ca4c7294	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-pre-2026-08-08
7780af5b1e1eabe8c6faa1594da3109b34919bdb	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-repthy-wedderburn
03662b00b64f754dd3b3cbcafa1079ba1f5c120c	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-root-import-closure
20e9c8e1ba038a9ab63322bac61bb54066de3ae2	refs/heads/cat/folio-assistant-sci/lake-cache/qou-v4-24-0-test
d630b7b1f946bbb35281234a5b0c3b0e246d0f7c	refs/heads/cat/folio-assistant-sci/lake-cache/staging-test
6c5ad8f0402b2cf22f053065d61f9bbfe3fb8063	refs/heads/cat/folio-assistant-sci/lake-cache/toolchain-v4-24-0
b235d787a3d278720cabe5a7c628bac74a6792b8	refs/heads/cat/folio-assistant-sci/lake-cache/ugb-v4-24-0
6104387fbc90debb7eae40e25a175aa7c2e841cd	refs/heads/cat/folio-assistant-sci/lake-cache/zz-ugb-basetest
830fef16dfaf059c7e8478eda45eb86f5477b7bf	refs/heads/cat/folio-assistant-sci/lake-cache/zz-ugb-streamtest

$ gh api repos/litlfred/qou/branches/lake-cache%2Fqou-v4-24-0 -q .name
cat/folio-assistant-sci/lake-cache/qou-v4-24-0
```

## Log

- 2026-10-24T09:59:15+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Running Steps 1–3 in background subagent.
- 2026-10-24T10:03:45+02:00 — Renamed all 16 `lake-cache/*` branches on `litlfred/qou` to `cat/folio-assistant-sci/lake-cache/*` via the GitHub rename API (`POST /repos/litlfred/qou/branches/{branch}/rename`), verified 16 heads under `cat/folio-assistant-sci/lake-cache/` and 0 under `lake-cache/`, and verified redirect (`lake-cache%2Fqou-v4-24-0` -> `cat/folio-assistant-sci/lake-cache/qou-v4-24-0`). Marked `status: completed`.
- 2026-10-24T08:12Z — Cross-checked from the cloud: `git ls-remote` on litlfred/qou shows 16 `cat/folio-assistant-sci/lake-cache/*` and 0 `lake-cache/*` heads; the redirect answers the new name. Closes the way for `32f6` (closed) and `oycs`. Session https://claude.ai/code/session_01AnAGBDDY8TMwCApxe4b3pX.

---
# folio-assistant-qr4n
$schema: bean/1.0.0
title: 'CONNECTED AGENT: rename qou''s 16 legacy lake-cache/* branches to cat/folio-assistant-sci/lake-cache/* with the GitHub rename API'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T07:58:00Z
updated_at: 2026-10-24T09:59:15Z
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

- [ ] 16 heads under `cat/folio-assistant-sci/lake-cache/`, 0 under `lake-cache/` (step 3 output pasted below)
- [ ] the redirect check answers with the new name
- [ ] Log line with the time; status `completed`

## Log
- 2026-10-24T09:59:15+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Running Steps 1–3 in background subagent.

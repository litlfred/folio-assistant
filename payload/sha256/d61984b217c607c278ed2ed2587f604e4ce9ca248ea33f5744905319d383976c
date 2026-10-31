---
# folio-assistant-vl71
$schema: bean/1.0.0
title: 'smart-base ghbuild.yml runs ~36 scripts curled from WorldHealthOrganization/smart-base@main with a write token'
status: completed
type: bug
priority: high
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T20:26:05Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security (RED FLAG, blocking) · **severity:** major · **rules:** scz-pin-third-party-by-full-sha, scz-audit-what-you-run, scz-least-privilege

**Where:** litlfred/smart-base `.github/workflows/ghbuild.yml` lines 152-157 (`SCRIPTS_BASE_URL=https://raw.githubusercontent.com/WorldHealthOrganization/smart-base/main`), then 36 `curl -L -f -o input/scripts/*.py "${SCRIPTS_BASE_URL}/…"` steps (e.g. 208, 227, 251, 295, 307, 313, 368-372, 394, 422-424, 446, 811-815); the job holds `contents: write` and `pull-requests: write` (lines 99-103). `input/scripts/stamp_deploy.py:43-46,102` also downloads `stamp_deploy_metadata.py` from the same moving `main` and runs it.

**Evidence:** the comment at 120-125 says pinning to `main` protects against a caller-supplied `scripts_ref`. It does, but `main` of a repository in another organisation is still a moving ref: whatever lands there next runs in this job with its token. No hash or commit pin is checked.

**Mitigation today:** ghbuild.yml is `workflow_call`/`workflow_dispatch` only (owner decision 2026-10-06), so it runs only when started by hand.

## Done when
- [x] the scripts come from this checkout (or a commit SHA recorded in the repo), not a moving branch of another org
- [x] or each download is verified against a recorded sha256 and refused on mismatch

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T08:25Z_ — Fixed in https://github.com/litlfred/smart-base/pull/255 (`SCRIPTS_BASE_COMMIT`/`SCRIPTS_BASE_URL` pinned to immutable 40-hex commit SHA `49178a48d460bb53acf6e90d8c0aee3f0146d8f7` in `litlfred/smart-base` with one-step git checkout seeding for downstream callers; `stamp_deploy.py` pinned by commit SHA and verified against SHA-256 `4a82437fb69a894b4539b638cdf4caa08e4f5dca3cedfcee3a80164c2d977022`).

_2026-10-31T20:26:05Z_ — All fix PRs merged (owner card choice A, 2026-10-31 20:22Z, thread "Drain workplan, issues and beans"); bean completed.

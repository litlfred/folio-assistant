---
# folio-assistant-towy
$schema: bean/1.0.0
title: 'smart-base issue skills: issue body reaches an LLM unfenced and LLM-chosen labels are applied unchecked'
status: todo
type: bug
priority: normal
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:20:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** minor while dormant, major if the triggers return · **rules:** scz-screen-handover-fields, scz-report-never-extends-the-plan, scz-pin-third-party-by-full-sha

**Where:** litlfred/smart-base `.github/skills/dak_authoring/actions/classify_issue_action.py:150-177` and `dak_authoring_action.py:31-47`; workflows `classify-issue.yml`, `skill-l1-review.yml`, `skill-l2-dak.yml`, `skill-l3-review.yml`, `skill-translation.yml`.

**Evidence:**
- the issue title and body (`ISSUE_BODY`, first 4000 chars) are formatted straight into the prompt (`common/prompt_loader.py`, `str.format_map`) with no `fenceUntrusted` / `screenHandover` (zero-trust-handover.md).
- `classify_issue_action.py:170,177`: `labels = result.get("labels", [])` from the model is POSTed to the issue as-is. There is no allowlist, and labels are what start the other skills (`skill-l2-dak.yml` gates on `content:L2`).
- each workflow runs `pip install litellm requests` unpinned in a job whose env holds `GITHUB_TOKEN` and `DAK_LLM_API_KEY`.

**Mitigation today:** all five are `workflow_dispatch` only, and their `if:` conditions read `github.event.issue`/`label`, which a dispatch does not carry, so none of them can run as written.

## Done when
- [ ] either the dead skills and workflows are removed, or: labels are refused unless in a fixed allowlist, the issue text is fenced as untrusted, and pip installs are pinned by hash

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

---
# folio-assistant-fa9v
title: 'QA witness drill-down: click a block''s QA icon for sidecar detail and witnesses'
status: in-progress
type: task
created_at: 2026-09-18T19:46:50Z
updated_at: 2026-09-18T19:46:50Z
---

Asked on 2026-09-18: in translations, a QA icon on each content block; clicking it shows the detailed QA sidecar data (e.g. semantic roundtrip); opening a criterion shows every witness — which script/model/agent/human ran it, when, staleness, and SHA. Same behaviour for every content QA sidecar, with a different icon per QA family.

Follows bean g6yr (per-block QA icons, shipped #274), which rendered state only: a non-interactive <span> with the counts in its title. The witness data already exists in <block>.qa.json (QaCriterionEntry.reviewer {kind,id,version,script_hash,script_commit_sha,agent_model,agent_session,agent_skill}, reviewed_at, reviewed_sha, field_hash); nothing publishes it to the reader.

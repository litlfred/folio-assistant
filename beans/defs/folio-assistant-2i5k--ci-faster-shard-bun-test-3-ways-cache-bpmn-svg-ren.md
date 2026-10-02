---
# folio-assistant-2i5k
title: 'CI FASTER: shard bun test 3 ways, cache BPMN SVG renders by input hash, sparse publish-branch checkout'
status: todo
type: task
priority: high
created_at: 2026-10-01T19:18:56Z
updated_at: 2026-10-01T19:18:56Z
parent: folio-assistant-7x5n
---

Owner-approved (via merge steward, 2026-10-01). Measured medians: bun test 6.8 min, BPMN render 5.3 min, playwright 4.5 min, publish-branch checkout 2.4 min. No check dropped or weakened.

## Done when
- [ ] bun test runs as 3 shards (matrix), every test file still runs in exactly one shard
- [ ] BPMN renders cached per diagram by a key covering everything the drawing is a function of; render:bpmn:check still compares full bytes
- [ ] staging deploy checks out only the paths it writes on the publish branch
- [ ] PR green, merged; before/after job times recorded here

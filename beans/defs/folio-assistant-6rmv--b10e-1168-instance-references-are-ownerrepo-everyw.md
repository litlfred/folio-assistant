---
# folio-assistant-6rmv
title: 'B10e (#1168): instance references are owner/repo everywhere'
status: todo
type: task
created_at: 2026-09-30T14:59:54Z
updated_at: 2026-09-30T14:59:54Z
parent: folio-assistant-tr05
---

Owner 2026-09-30: owner/repo everywhere (over the recommended instance names). 137 instance values (136 names, 1 owner/repo) across AssetSource.instance, ThemeRef, voices, role refs, session-context, tool-invocation, site-indexes. Needs the instance→repo mapping from each <instance>.json.
## Done when
- [ ] every instance-reference field is RepoFullName-typed and every value converted

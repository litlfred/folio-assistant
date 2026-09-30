---
# folio-assistant-6rmv
title: 'B10e (#1168): instance references are owner/repo everywhere'
status: todo
type: task
priority: normal
created_at: 2026-09-30T14:59:54Z
updated_at: 2026-09-30T17:02:48Z
parent: folio-assistant-tr05
---

Owner 2026-09-30: owner/repo everywhere (over the recommended instance names). 137 instance values (136 names, 1 owner/repo) across AssetSource.instance, ThemeRef, voices, role refs, session-context, tool-invocation, site-indexes. Needs the instance→repo mapping from each <instance>.json.
## Done when
- [ ] every instance-reference field is RepoFullName-typed and every value converted



## Scope added by the owner, 2026-09-30
- "we should also update namespaces/IRIs etc for owner/repo everywhere for consistency"
- "owner/repo => IRI map?" "(even dynamic generated based on overlays)"
So: an owner/repo → IRI-base map DERIVED from each instance's declaration and its dependency overlay (orderedDependencies), not a hand-kept list; namespaces and minted IRIs keyed through it.
## Open question to put to the owner before starting
Pre-split, cat-harness, smart-base, bootstrap, folio-assistant-core… are directories of ONE repo (litlfred/folio-assistant); owner/repo alone cannot tell them apart. Their planned own repos (AssetSource's doc says litlfred/cat-harness), or owner/repo + path?

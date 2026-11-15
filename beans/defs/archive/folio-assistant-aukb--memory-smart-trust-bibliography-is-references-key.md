---
# folio-assistant-aukb
$schema: bean/1.0.0
title: 'Memory: smart-trust bibliography is references/<key>.json (folio-reference/v1 CSL) rendered into IG pages by input/scripts/references.ts; PR litlfred/smart-t...'
status: completed
type: task
priority: low
created_at: 2026-11-01T19:12:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-references.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-trust bibliography is references/<key>.json (folio-reference/v1 CSL) rendered into IG pages by input/scripts/references.ts; PR litlfred/smart-trust#123

2026-11-01, thread "Make smart-trust references computable" (cmsg_017WNUkNK8kdDziPK58Pv6G9QhkzY4rXo4jj9kzfR9cNMM).
- Harness bibliography format = core `references` typology: one folio-reference/v1 CSL-JSON per work at `references/<key>.json` (not renderable by the harness site, so IG pages need their own rendering).
- smart-trust: 23 entries, declared dir `references` in smart-trust.json. `bun input/scripts/references.ts` writes lists between `<!-- references:begin style=bracket|ol|ul keys=… -->` / `references:end`; `--check` catches stale lists and dangling `#ref-<key>` citations. decision_support.md is CRLF (script preserves it).
- Issue #121, PR #123 MERGED 2026-11-01 20:31Z (3736afc, Q-REF-2 A). Upstream bugs: smart-trust#124 (fhirbuild.yml trailing "# main" breaks site publish detectPublisher), who-iris#160 (fixed upstream; re-pin smart-trust#125 by sibling). Left as-is: DIVOC narrative links, onboarding "[Document N]" (no list exists), cert-governance "ICAO model [2]" cites eHealth spec.
- Staging via workflow_dispatch site-publish.yml on the branch → https://litlfred.github.io/smart-trust/STAGING/<branch>/

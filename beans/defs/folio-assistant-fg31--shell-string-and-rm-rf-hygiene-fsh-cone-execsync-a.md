---
# folio-assistant-fg31
$schema: bean/1.0.0
title: 'Shell-string and rm -rf hygiene: fsh-cone execSync and smart-base mount-platform.sh'
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

**Category:** security · **severity:** minor (not exploitable as written) · **rules:** scz-value-never-becomes-program-text, scz-refuse-never-repair

**Where and evidence:**
- fhir-harness `scripts/fsh-cone.ts:738-740`: `execSync(`git ${args}`)` builds a shell string. Today the values are `Number(--history)` and SHAs from `git rev-list`, so nothing can break out, but the shape is the one the voice forbids. Use `execFileSync("git", [...])`.
- smart-base `.claude/mount-platform.sh:18-23` (SessionStart hook): `ref` read from `index.lock.json` goes unchecked into `M="${TMPDIR:-/tmp}/smart-base-mounter-$ref"`, then `rm -rf "$M"`. A ref with `/..` segments only resolves if the prefix directory exists, so this is not a working traversal, but the guard should refuse anything that is not 40 hex before it names a path. smart-ra `.claude/hooks/session-start.sh` uses `mktemp -d` and does not have this problem.

## Done when
- [ ] fsh-cone calls git with argv
- [ ] mount-platform.sh refuses a `ref` that is not `^[0-9a-f]{40}$` before building `$M`

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

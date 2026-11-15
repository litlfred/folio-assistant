---
# note on folio-assistant-tsh9 from claude/declare-ig-docs-site-compose
$schema: folio-bean-note/v1
bean: folio-assistant-tsh9
branch: "claude/declare-ig-docs-site-compose"
created: "2026-11-05"
---
## Stale mounts make a local "pass" meaningless (2026-11-05)

The SessionStart hook (`.claude/settings.json`) runs `bash .github/mount-from-lock.sh --root . >/dev/null 2>&1`. A container that comes up with mounts not matching the lock gets "left untouched … no longer hash to the lock" for each instance (10 of 12 in this session). That message goes to /dev/null, so the session works on stale layers without knowing.

**Consequence seen:** `render:bpmn:check` "passed" in agent containers for a long time and failed in CI. The stale fhir-harness mount had no `processes/tools/`, so the new diagram was never rendered. Root cause: a missing `builtAtPublish` line (fixed in litlfred/cat-harness#1041; derivation follow-up is bean folio-assistant-akiq). A fresh worktree with `mount:lock --root` at the lock reproduced CI exactly.

**Proposed fix:**
1. The hook stops discarding mount output: it prints a loud MISSING section (instances and the remedy), like the Bun-pin section of the coord sweep.
2. Pre-push and local check runners refuse to give a verdict while `mount:lock:check` is not OK: "cannot judge: mounts are not at the lock".

---
$schema: folio-memory/v1
id: could-not-determine-is-a-third-state-everywhere
label: trap
summary: "\"could not determine\" is a THIRD state, everywhere"
createdAt: 2026-09-19
roles:
  - code-reviewer
agents:
  - platform-boundary-guard
---
A section that cannot read its source returns `skip` and the region is left
exactly as it was. Not decoration:

- qou configures its simulators under `folio-assistant/simulators`, which
  exists only once the platform submodule is checked out. The first version
  rendered "directory absent" as "this folio has no simulators" — replacing a
  correct nine-row table with a sentence.
- A shallow clone with no `gh-pages` must not silently blank a contents table
  that was right yesterday.

**An empty directory is still a determined empty.** Distinguish absent from
unreadable, always.

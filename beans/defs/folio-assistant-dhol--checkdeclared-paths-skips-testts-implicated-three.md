---
# folio-assistant-dhol
title: check:declared-paths skips *.test.ts — implicated three times now
status: todo
type: task
created_at: 2026-09-20T12:08:49Z
updated_at: 2026-09-20T12:08:49Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 while moving CRDM into its own subgraph (bean `g43o`):
**two tests broke on hardcoded paths**, which is precisely the defect
`check:declared-paths` exists to prevent.

- `scripts/tests/log-writer.test.ts` composed
  `../../skills/workflows/crdm-requirements.bpmn`. Worse than a plain
  break: it went ENOENT and the test reported *"the process does not
  declare folio:log"* — a false finding about the CORPUS rather than
  about itself.
- `scripts/tests/todos.test.ts` had already paid for this once. Its own
  comment says so: *"this is the second hardcoded path in a test to break
  today"*, and, explicitly, *"`check:declared-paths` cannot catch this:
  it skips `*.test.ts`. That exemption is worth revisiting."*

So the exemption has now been implicated three times, by two different
relocations.

## Why this is not a drive-by widening

The exemption presumably has a reason, and **finding out is the work**.
Candidates, none verified:

1. **Fixtures.** A test that builds a throwaway tree writes literal paths
   into it by necessity — `"skills/folio-core/a.md"` inside a `mkdtemp`
   fixture names nothing in this repository and must not be resolved
   against the declaration.
2. **Assertions about the layout itself.** A test pinning that
   `bootstrap/skills/` is declared has to name it.
3. **Volume.** The check refuses a literal unless it is marked with a
   reason; if tests carry hundreds, turning it on is a large annotation
   pass before it is a fix.

(1) is the likely one and it is also the answer: the distinction is not
test-versus-source but **fixture-versus-corpus**. A literal naming a path
in a temp directory is fine; a literal naming a path in THIS repository is
the defect, and the existing `declared-path-literal: <reason>` marker
already expresses "I know, and here is why".

## Done when

- [ ] the reason for the `*.test.ts` exemption established — read the
      check's history, not guessed
- [ ] measured: how many literals in tests name a real repository path
      versus a fixture path
- [ ] if the fixture/corpus split holds, the exemption narrowed to
      fixtures rather than removed
- [ ] the two already-fixed call sites left as they are — both now resolve
      through the declaration

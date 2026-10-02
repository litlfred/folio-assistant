---
# folio-assistant-w095
title: who-style-guide/ — the three one-voices out of cat-harness, citing who-iris across the boundary
status: completed
type: task
priority: normal
created_at: 2026-09-20T08:02:32Z
updated_at: 2026-09-20T08:02:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: 'the 3 one-voices, should reference the 3 artefacts in the who-iris library, but the 3 one voices are derived from the cataloge and in their own repo/dir.' Dir name per the 2026-09-19 decision recorded in `r1lz`.

The three, with what each already cites (measured from `voices/*.json` this session):
- `who-editorial` -> `who-pub-tps-931` (WHO Editorial Style Manual, 1993)
- `who-guideline-development` -> `9789241548960-eng` (handbook for guideline development, 2nd ed, 2014)
- `who-publication-design` -> `wpr-rdo-2020-003-eng` (WPRO style guide, 2020)

`milnor` -> `milnorlink` does NOT move; different domain, different destination.

BLOCKED BY the cross-instance library reference. Doing this first produces three voices whose every rule cites evidence the check cannot resolve, which is the `source: null` defect `r1lz` was opened over, wearing a different hat.

## Done when
- The three voices live in `who-style-guide/voices/`, each citing `{ instance: 'who-iris', ... }`.
- `check:voices` green from BOTH instance roots.
- folio-assistant's own docs still carry NO voice (#208), and voices stay opt-in.


## Done 2026-09-20

`who-style-guide/` is a staged instance declaring `voices/` and nothing else —
no `library`, because it holds no corpus and that absence is load-bearing
(`resolveLibraryRef` answers `no-library-graph`, which is more actionable than
"that section is missing").

The three moved by `git mv`. `milnor` stayed, per this bean.

## The "Done when" clause that mattered was the third

*"check:voices green from BOTH instance roots."* It could not be, and the
reason was not the move:

  check-voices.ts read `ROOT = resolve(import.meta.dir, "..")` and nothing else.

Predicted before moving, then CONFIRMED by moving, which is the only way to
tell a guess from a finding. The first run after the `git mv`:

    Voice graph  (1 voices, 12 rules)
    ✓ every rule cites a source that resolves, with a quote long enough to check
    rc=0

**Twenty-five rules across three voices went unchecked and nothing said so.**
The `dh4f` defect inside the gate whose entire subject is citations that do not
resolve — and the third instance of that shape this session, after
`check:declared-assets` (a hardcoded list of two while the repo had eight) and
`check:l1-complete` (a no-op in CI over 1,402 files).

Fixed the same way, and deliberately NOT by adding `who-style-guide` to a list:
the check now ENUMERATES the instances shipping a `voices/` directory. A
hardcoded list is a declaration nobody declared, and the next instance would be
invisible in exactly this way.

Two things fell out of enumerating, both of which would have been wrong
answers delivered confidently:

- Each voice keeps the root it was LOADED from. A bare citation resolves
  against whoever wrote it, so resolving everything against `cat-harness`
  would have answered a who-style-guide voice's bare reference out of the
  PLATFORM's library — the wrong corpus, reported as a resolution.
- `kgRef` is a node of the voice's own graph, so it is looked for under the
  declaring instance rather than the platform.

Verified by breaking it: a rule pointed at `page-99999` fails by name, and the
message carries the cross-instance path
(`who-iris/library/who-pub-tps-931/sections/page-99999.md`).

Now: 4 voices, 37 rules, across two instances. Before: 1 and 12.

## Not done, and it is somebody else's bean

`milnor` cites `folio-assist-sci` and that instance now EXISTS — its
destination stopped being hypothetical when `frs5` created it. Noted on `r1lz`
rather than acted on: this bean scopes it out in as many words, and resolving
a sibling's bean because one clause of it came true is what `bean-coordination`
forbids.

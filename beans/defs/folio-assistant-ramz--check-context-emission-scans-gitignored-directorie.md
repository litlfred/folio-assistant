---
# folio-assistant-ramz
title: check-context-emission scans GITIGNORED directories, so local residue fails a test about the repository
status: completed
type: task
priority: normal
created_at: 2026-09-25T16:02:11Z
updated_at: 2026-09-25T16:21:36Z
parent: folio-assistant-ahvw
---


Found 2026-09-25 by a `goal-review` sweep, by causing it rather than reading it.

`bun test` on a clean checkout of `main` reported **1 failure**:

    (fail) the real corpus > every spoken prefix is bound and every own prefix is a stub
    + "count": 145,
    + "example": "cat-harness/ingest-staging/agent-skills---google-antigravity-docs/manifest.jsonld",
    + "prefix": "folio",

`cat-harness/ingest-staging/` is **`.gitignore`d** (`.gitignore:219`) and
untracked. The 7 directories in it were residue from an ingestion five days
earlier, on this machine only. Moving them aside makes the test pass — verified,
not assumed.

## Two separate problems, and the second is the worse one

1. **A false failure.** Any contributor with staging residue, a scratch
   checkout, a vendored copy or a local build output under a gitignored path
   gets a red test about code they did not touch. That is expensive on its own.

2. **The test's corpus is not the repository's corpus.** The assertion is
   named *"the real corpus"*, and what it scanned included 145 files that are
   not in the repository at all. A test that disagrees with `git ls-files`
   about what the repository contains can fail on absent files AND pass over
   present ones, and nothing in its output says which set it used.

The second is why this is a gap rather than a nuisance: the fix is not
"ignore that directory", it is that a corpus check must derive its file set
from the DECLARATION or from the index, the same rule every scanner here
already follows.

## Done when

- [ ] The scan enumerates tracked files (or declaration-resolved paths), not
      a bare filesystem walk.
- [ ] A fixture proves it: a gitignored file carrying an unbound prefix is
      NOT a finding, and a tracked one still is. Both halves, or the fix
      could be "skip everything".
- [ ] Any sibling check doing a bare `Glob`/`readdirSync` walk over the tree
      is audited the same way — this one was found by accident, so the
      question "which others?" has not been asked.

## Done 2026-09-25

`contentDocuments` asks git: `ls-files --cached --others --exclude-standard`.

Not `--cached` alone. A `.jsonld` a contributor has written and not yet staged
is part of the change under test, and a check that cannot see it passes on the
file it exists to examine.

Verified by causing both halves on this checkout, not by reading the code: a
`.jsonld` under the gitignored `cat-harness/ingest-staging/` is invisible
(3633 documents, 0 from staging), and a new one under a tracked directory
raises the count by exactly 1.

Where `repo` is not a git work tree — every temp fixture — it falls back to
the old walk and the fallback is the LOOSER set, so it can only over-report.
`gitListed` returns `undefined` for "ask something else" and `[]` for "git
looked and there are none"; collapsing those two is how a check reports a
clean corpus it never read.

- [x] The scan enumerates what git accounts for, not a bare filesystem walk.
- [x] A fixture proves both halves (`scripts/tests/check-context-emission.test.ts`,
      a real temp git repo with a `.gitignore`), verified by disabling the fix
      and watching that one test fail.
- [ ] **The sibling audit is `folio-assistant-xd1g`.** Asked, and answered:
      **11** scripts under `cat-harness/scripts/` walk from the instance or
      repository root with no gitignore awareness — `check-agents-claims`,
      `check-code-accounting`, `check-docs-templates`, `check-image-roles`,
      `check-lane-documentation`, `check-process-documentation`,
      `check-source-licence`, `check-viewer-backticks`, `glossary-export`,
      `ns-export`, and `check-subgraphs` (which walks DECLARED directories, so
      its root is derived, but it is not ignore-aware within them). Only
      `scan-repo-content` and this file ask git.

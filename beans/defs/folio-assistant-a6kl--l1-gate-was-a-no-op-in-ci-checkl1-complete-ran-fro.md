---
# folio-assistant-a6kl
title: 'L1 GATE WAS A NO-OP IN CI: check:l1-complete ran from the repo root and found no declaration'
status: todo
type: bug
priority: critical
created_at: 2026-09-20T10:20:54Z
updated_at: 2026-09-20T10:20:54Z
parent: folio-assistant-kupb
---

FOUND 2026-09-20 while excising `directoryForGraph`, and it predates that work.

`.github/workflows/code-quality-gates.yml` runs `bun run check:l1-complete` and `-- --check` from the REPOSITORY ROOT. The script resolved its corpus with `checkAll(resolve("."))` -- the CWD. The repository root carries no `harness.json`: the declaration is one level down, in `cat-harness/`. So `directoryForGraph(repoRoot, "library")` returned undefined, `checkAll` returned `[]`, the script printed **'no library/ entries -- nothing to check'** and **exited 0**.

FOUR DOCUMENTS, 1,402 TRACKED FILES, NOT CHECKED. And `--check` passed for the same reason rather than a second one: an empty report list has no stale sidecars, so the freshness gate was green over nothing too.

THE SCRIPT'S OWN COMMENT HAD THE RULE RIGHT and then broke it, on the next line:

> // Absent declaration is "nothing to check", never "complete".
> const lib = directoryForGraph(root, "library");
> if (!lib || !existsSync(lib)) return [];

`[]` IS 'complete' to every caller. Stating a rule is not enforcing it.

AND SO DID THE TEST. `ingest-and-l1.test.ts` carried `test("no library/ is 'nothing to check', not 'complete'")` -- the name is exactly right -- asserting `expect(checkAll(root)).toEqual([])`. The assertion encoded the defect its own name forbids, so the gap was pinned rather than caught.

WHEN IT BROKE is worth knowing and I have not established it. The split into `cat-harness/` moved the declaration away from the CWD; before that, `resolve(".")` and the instance root were the same directory. So this was almost certainly silent from the split onward, and the gate looked green the whole time. Bean `wggr` tracks the split.

## Fixed here
- `checkAll` THROWS `NoDeclaredLibrary` rather than returning `[]`, for both 'no declaration' and 'declared but absent' (the second is the `dh4f` shape).
- the CLI resolves `INSTANCE_ROOT` (the directory holding the declaration) instead of the CWD; `--root=` still overrides, so a folio checking its own corpus is unaffected.
- the test now asserts the throw, with the CI story in a comment so the assertion cannot quietly revert to `[]`.
- verified: from the repo root the gate now reports all four entries and every derivable requirement green, and `--check` reports 4 current verdicts.

## Still open
Whether any OTHER gate wired in that workflow has the same CWD-vs-instance-root defect. `check:l1-complete` was found by accident. Nothing has swept the rest.

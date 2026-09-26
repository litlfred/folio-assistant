---
# folio-assistant-a7t8
title: ingest-document's 'run the remaining arms' line double-nests the pdf-images output
status: todo
type: bug
created_at: 2026-09-22T20:13:04Z
updated_at: 2026-09-22T20:13:04Z
parent: folio-assistant-ahvw
---

Hit while ingesting the SWOT paper, 2026-09-22.

## What happened

`bun run ingest <pdf>` stages, then prints:

> Next: run the remaining arms with `-o ingest-staging/<slug>`, then: ... --promote

Following that literally:

```
python3 cat-harness/scripts/pdf-images.py -o cat-harness/ingest-staging/gurel-tat-2017-swot-analysis <pdf>
  wrote cat-harness/ingest-staging/gurel-tat-2017-swot-analysis/gurel-tat-2017-swot-analysis/images.json
```

**The slug appears twice.** `pdf-images.py` composes `<out>/<slug>/` itself, exactly as `pdf-pages.py` does, which is why the staging step used `-o ingest-staging` and landed correctly. The guidance line names the deeper path, so the two arms disagree about what `-o` means.

## Why it is worse than a wrong path

It fails SILENTLY in the direction that reads as success. `pdf-images.py` exits 0 and prints the file it wrote, so the arm looks done. The next `--promote` then reports `image-descriptions: no images.json` -- a requirement failure pointing at the arm you just ran, with no indication the output went one directory too deep. Working it out means reading the arm's source.

Same class as the three `'scripts/<name>.py'` CWD-relative paths that module's own docstring describes as "the least visible place a path can hide".

## Two candidate fixes, not chosen here

1. **Fix the message** -- print `-o <staging-root>`, matching what the arms do. One line, and it makes the printed recipe copy-pasteable.
2. **Fix the arms** -- have `-o` mean the entry directory everywhere, and have `ingest-document` pass the parent. Bigger, and it changes a published CLI.

(1) unless somebody wants (2). Either way `l1-blocks.ts` takes `-o <staged-entry-dir>`, the DEEP path, so today three arms use two conventions and nothing says which is which. That is the finding, more than the wrong line.

## Done when

- [ ] the printed recipe works when copy-pasted, for every arm it names
- [ ] the two `-o` conventions are reconciled, or each arm's `--help` says which it takes
- [ ] a test pins it, since this failure mode exits 0

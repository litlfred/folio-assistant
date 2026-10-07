---
# folio-assistant-ig4a
title: 'EXTRACTION: an indented code fence is not recognised, so list-item code blocks are extracted as prose — 74 code fragments offered to translators and 16 real strings hidden'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T08:56:47Z
updated_at: 2026-09-26T10:14:10Z
parent: folio-assistant-bzyu
---

Found while deriving `.po` catalogues for #206 (bean `tbdg`). Measured
2026-09-26. Same family as `lrbx` — the extractor's segmentation is not the
reader's — and a separate cause.

`MD_CODE_FENCE_RE = /^(`{3,}|~{3,})/` is anchored at column 0 and is matched
against `line`, not `stripped`:

```ts
const fenceMatch = line.match(MD_CODE_FENCE_RE);
```

An **indented** fence — the ordinary way to put a code block inside a list item —
is therefore never recognised, and the block's body is extracted as translatable
prose. From `docs/contributing.md:56`:

```md
- **Skill schema reference** is generated — never hand-edit
  `docs/reference/skills/*.md`. Edit the JSON Schemas under
  `schemas/skills/<skill>/` and regenerate:

  ```sh
  bun run scripts/gen-schema-docs.ts
  ```
```

extracts `"````"` as a **paragraph**, at lines 58 and 66. Translators have been
offered shell commands and backtick runs as prose.

## Both directions, measured over the whole corpus

Anchoring the fence to `stripped` instead of `line`, over `cat-harness/docs/`:

| | |
|---|---|
| markdown files | 618 |
| files whose msgid set changes | **27** |
| msgids removed (code offered as prose) | **74** |
| msgids ADDED (prose that was being swallowed) | **16** |

The 16 additions are the half that is easy to miss, and they are the more serious
direction. Where an opening fence sat at column 0 and its closing fence was
indented, the extractor stayed `inCodeBlock` and skipped every line until the next
column-0 fence — so real sentences were **invisible to the pipeline entirely**.
All 16 are ordinary prose; four examples, each currently unreachable by any
translator:

- `lean-environment-setup.md:139` — *"search; works with or without Lean installed). The full source ships with any clone…"*
- `prepare-merge-auto.md:93` — *"action (accept / modify / reject / escalate) BEFORE making changes — so the user can redirect…"*
- `crdm-requirements-workflow.md:263` — *"With one sentence per arrow explaining why the dependency exists."*
- `formalizer.md:748` — *"exists only to feed the next tactic, pass it inline:"*

So the current behaviour both **wastes** translator attention on 74 code
fragments and **hides** 16 real strings. A count of translatable strings taken
from this extractor is wrong in both directions at once.

## Why this was not just fixed

The one-line change is measured and its direction is not in doubt, but it
regenerates `.pot` files in 27 places and obsoletes msgids in existing `.po`s —
corpus-wide, with the same owner-visible consequence as `6b8u`. The two should be
decided together, since both change the msgid set and doing them in separate
commits regenerates the corpus twice.

## Done when

- [x] a fence is recognised wherever markdown recognises one — indented inside a
      list item, and its closing fence matched at the same indentation
- [x] MEASURED AFTER: no msgid in any `.pot` is a bare fence or backtick run, and
      the 16 recovered strings are present
- [ ] every `.pot` regenerated with tooling; removed msgids obsoleted rather than
      silently dropped from the 19 existing `.po` files
- [ ] checked against a folio other than this one — extraction is shared


## 2026-09-26 — fixed, and a SECOND copy of the fence found while shipping it

`MD_CODE_FENCE_RE` is now anchored to the stripped line, so an indented fence is
a fence. Measured over `cat-harness/docs/` (618 files): 74 msgids removed, 48 of
them a bare fence run, and **16 added** — real sentences a column-0 opening fence
with an indented closing fence had kept swallowed.

**`po-inject.ts` had its own copy of the regex**, also anchored at column 0.
Found by checking whether anything else shared the fact before committing, which
is the half of this defect the corpus measurement could not see: fixing the
extractor alone would have left the two halves of a round trip using different
definitions of a fence. Consolidated — `po-inject.ts` now imports the one
definition, which is why it is exported.

### A claim I made about it, and withdrew after measuring

I wrote — in the code comment, the call site and a test — that the old anchor let
the injector **substitute a translation into an indented code block and corrupt
the command**. It reads like the obvious consequence. **It is false.**

Measured against the old anchor, on the indented-fence case and again on a fence
whose body is ordinary prose rather than a command:

| | substituted inside an indented fence? |
|---|---|
| old anchor (`line`) | **no** |
| new anchor (`stripped`) | no |

Something else already protects the injector. So the test I had written asserting
`not.toContain("CORRUPTED")` **would have passed before the fix too** — a test
that cannot fail is not evidence, and it was the more persuasive-sounding half of
the change. Withdrawn in all three places rather than left standing.

What survives is narrower and true: **one definition instead of two**, pinned by
a test that fails if either module re-declares it, plus the extractor and injector
contracts asserted separately. The consolidation is hygiene, not a bug fix, and it
is now described that way. No substitution changes on any input tried, and the
column-0 case behaves exactly as before.

### The consolidation is proven behaviour-neutral, not assumed

Stronger than the fixtures: `injectMarkdown` run over **every one of this
instance's 16 real (catalogue, source) pairs**, old anchor against new, output
compared byte for byte — **0 differ**. A refactor has to be provable as one, and
on a round-trip pipeline the fixtures are the weaker evidence.


### Where the canonical checklist stands

First two ticked above. The third is unticked on its second half only: the
artefacts were regenerated with tooling, but the **removed msgids are not
obsoleted** in the 19 existing `.po` files. Left for one pass alongside `6b8u`'s
additions and `lvk9`'s 3785 — three separate rewrites of every catalogue would be
three chances to leave one stale.

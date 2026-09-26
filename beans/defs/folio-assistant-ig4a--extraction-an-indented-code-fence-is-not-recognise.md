---
# folio-assistant-ig4a
title: 'EXTRACTION: an indented code fence is not recognised, so list-item code blocks are extracted as prose — 74 code fragments offered to translators and 16 real strings hidden'
status: todo
type: bug
created_at: 2026-09-26T08:56:47Z
updated_at: 2026-09-26T08:56:47Z
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

- [ ] a fence is recognised wherever markdown recognises one — indented inside a
      list item, and its closing fence matched at the same indentation
- [ ] MEASURED AFTER: no msgid in any `.pot` is a bare fence or backtick run, and
      the 16 recovered strings are present
- [ ] every `.pot` regenerated with tooling; removed msgids obsoleted rather than
      silently dropped from the 19 existing `.po` files
- [ ] checked against a folio other than this one — extraction is shared

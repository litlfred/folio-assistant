---
# folio-assistant-zdrf
title: 'Zod silently stripped fields TS declared — including `lean` on every provable'
status: completed
type: bug
priority: high
created_at: 2026-08-08T00:30:00Z
updated_at: 2026-08-08T00:45:00Z
---

Fixed by session `3bada08b` on branch `claude/agent-4673-validation-9hffrd`.

Started as one loose end from `folio-assistant-tsca`: `EquationBlock` was the
only member of the `Block` union with no `uses`. It was the visible edge of a
broader drift between `schemas/types.ts` (the TS contract) and
`schemas/constraints.ts` (the Zod schemas that actually validate).

The Zod objects are neither `.strict()` nor `.passthrough()`, so the default
applies: **an unknown key is stripped, silently, and the parse succeeds**.
Verified directly — a prose block carrying `uses: ["def:a"]` parsed clean and
came back with `uses === undefined`.

What was being stripped:

| kind(s) | field | corpus impact (qou) |
|---|---|---|
| theorem, lemma, proposition, corollary, algorithm | **`lean`** | the link into Lean, on exactly the kinds whose point is to carry one |
| proof | `of` | 8 blocks — the canonical reverse link to the provable |
| example | `interprets` | (algorithm and remark already had it) |
| prose, diagram | `title`, `uses` | 25 + 4 blocks with `uses`, 106 with `title` |
| equation | `uses`, `title` | 0 blocks today |

`lean` is the serious one. `DefinitionSchema` declared it; `ProvableBaseSchema`
did not, so every theorem/lemma/proposition/corollary/algorithm had its
`lean: { ref: … }` dropped at the validation boundary. Nothing crashed, because
no caller consumes the parsed output — `safeParse` is used for success/failure
only, and the constraint rules read the original imported block. The cost was
that Zod could never *validate* those fields.

Fixed by bringing Zod up to TS in each case, and `EquationBlock` up to its
three standalone siblings (`+uses +title +tags`).

`scripts/tests/schema-ts-zod-parity.test.ts` pins field-set agreement per kind,
resolving TS `extends` and Zod `.extend()` chains on both sides. 17 tests.
Two traps worth recording: the two Zod base schemas are declared WITHOUT
`export`, so a regex requiring it silently yields empty field sets and the test
passes vacuously; and several schemas nest `z.object({…})` inside a field, so
bodies need brace counting rather than a lazy `\n\}`.

## `uses-resolve` covered 9 of 15 kinds

Found while measuring the above. The check that catches dangling editorial
references skipped `algorithm`, `proof`, `prose`, `equation`, `diagram` and
`table` — **925 blocks in qou declare `uses` on a skipped kind**, `proof` (435)
and `table` (445) being the bulk. AGENTS.md calls `uses[]` the relation every
ordering metric is computed from.

Widened to all fifteen. Measured before landing: **19 findings**, not hundreds.

  - 9 genuine dangling labels, e.g. `lemma:cyclotomic-strand-doubling` where
    the convention is `lem:`.
  - 10 `*-table-data` blocks carrying `uses: [""]` beside
    `title: "Data table N from "` — an extraction generator that failed to
    substitute its source label.

The empty entry had been passing through as a non-finding; it is now reported
explicitly, and labels are quoted in the message, because `Unresolved uses: `
with nothing after it reads as a checker bug rather than a content defect.

**Those 19 are qou content and are NOT fixed here** — they are the owner's.

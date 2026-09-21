---
name: voice-overlay-review
description: >
  Review a block against the active voices' rules and record the verdict on its
  QA sidecar. The human/agent half of the voice overlay; the mechanical half is
  whatever `patterns` and `terminology` a rule carries.
allowed-tools: Read Edit Bash Grep Glob
---

# Voice overlay review

## What you are reviewing, and against what

One block, against the rules of the voices the folio has **activated** — not
every voice it ships. `<name>.config.json` holds the list; an empty list means
there is nothing for this skill to do and that is a pass, not a gap.

```sh
bun run check:voices    # the voices, their rule counts, and that every citation resolves
```

## The rule's citation is the argument, so open it

Every voice rule carries a `source` that resolves to a real file — a
`library/<doc>/sections/<section>.md` for a rule read from an ingested document,
or a `kgRef` for a house standard. It also carries the `quote` the rule was read
from.

**Open the citation before upholding a finding.** Two reasons, and the second is
the one that catches errors:

1. A reviewer who has read the source can say *why* the rule applies to this
   block, which is what makes a finding actionable rather than a citation of a
   citation.
2. **The rule may be wrong.** A rule derived from a document can misread it. The
   only defence is that the quote is right there — if the quote does not support
   the rule, the rule is the defect and the bean goes against the voice, not
   against the block.

## Three outcomes, as with the house voice axis

Identical to `voice-editorial-review.md`, because the shape of an editorial
judgement does not change with its source:

1. **The finding stands** — the register is wrong for this block. Fix the prose.
2. **The rule does not apply to this content** — record it, and consider whether
   the rule needs `appliesTo` scoping on the voice. One scoping edit beats ten
   per-block overrules, and it leaves a record of why nobody should see it again.
3. **The rule applies and this block is an exception** — a reviewer entry on the
   sidecar saying why. It leads the criterion, so the block reads `pass` with the
   reasoning attached and nothing is silently rewritten.

## A mechanical match is a question

A `pattern` is a regex over text; it does not know what the block is about. This
platform has paid for that three times and the measurements are worth carrying:

- `voice-scholarly-default` fired on ten documentation pages whose register is
  correctly second-person (bean `hbsh`).
- `voice-editorializing` fired four times on `merely` inside a comparative,
  where the contrast was the block's claim (bean `nwus`).
- `voice-editorializing` flags `clearly`, and the exemplar the Milnor gate is
  named after uses it fourteen times as proof economy (bean `2t41`).

So: **verify before upholding**, and when a rule fires repeatedly across a
corpus on the same non-defect, that is evidence about the RULE.

## Recording the verdict

Voice findings go on the block's QA sidecar like any other, through the same
writer, so the icon and the published witness agree with what you decided:

```sh
bun run content/pipeline/qa-merge-findings.ts --file findings.json
```

`insertAdjudication` places your entry ahead of the script entry, because
`list[0]` is a criterion's effective verdict. The script's opinion is kept
beneath yours — the disagreement between a checker and a reviewer is information,
and deleting it loses the record that anyone looked.

## Do not

- **Do not uphold a finding you have not traced to its quote.** The citation is
  one file read away, and a rule that misreads its source is the failure this
  whole design exists to prevent.
- **Do not review against a voice the folio has not activated.**
- **Do not delete a script finding from a sidecar.** The sweep rewrites its own
  entries; a hand-removed one returns with no record that anyone looked.
- **Do not resolve a conflict between two active voices in the prose.** Both
  rules stand: name them and let the editor decide.

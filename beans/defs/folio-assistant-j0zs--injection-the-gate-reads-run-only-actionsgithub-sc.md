---
# folio-assistant-j0zs
title: 'INJECTION: the gate reads `run:` only — `actions/github-script` blocks are JavaScript and carry the same laundering'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T13:59:53Z
updated_at: 2026-09-26T13:59:53Z
parent: folio-assistant-1xhc
---

Split out of `6bhf` rather than widened into it, because extending the scanner to
a second language changes what the gate CLAIMS to read, and that is a decision
rather than a fix.

## What is true today, measured 2026-09-26

`check-workflow-injection.ts` grades `${{ }}` expressions inside `run:` blocks.
Its docblock says so, and `scanWorkflows` enforces it. That was the right scope
when the surface was bash.

`actions/github-script` `script:` blocks are a SECOND shell in the same sense: a
`${{ }}` is substituted into the script **text** before V8 parses it, so a value
containing an apostrophe closes the surrounding JavaScript string exactly as it
closes a bash one. Two sites in this corpus:

    .github/workflows/feature-staging.yml:1164   const slug = '${{ steps.slug.outputs.slug }}';
    .github/workflows/feature-staging.yml:1449   const slug = '${{ steps.slug.outputs.slug }}';

**Neither is exploitable today**, and the reason is not the quoting. Its producer
reduces the value to `[A-Za-z0-9._-]` with a `sed`, so it cannot contain `'`.
That is the same character-class constraint the provenance work (#1408)
deliberately declined to recognise for `run:` blocks — so if the scanner is
extended, these two sites will report, and the remedy there is not `env:` (a
`script:` block does not read process env the way bash does) but the
`github-script` `with:` inputs, read as `process.env` or via a parameter.

## Why this is not just "run the same regex over `script:`"

Three things differ and each is a decision:

1. **The remedy is different.** `env:` plus `"$VAR"` is the answer for bash. For
   `github-script` it is `env:` plus `process.env.X`, and the gate's advice
   string currently names only the first.
2. **A `script:` block's safe band is not bash's.** `${{ }}` into a JS
   *expression* position (`if (${{ ... }})`) is worse than into a string, and a
   gate that reports both identically teaches nothing.
3. **`with:` is currently declared NOT graded**, on the reasoning that `with:` is
   where values are passed as data. `script:` lives under `with:`. So the scope
   line "`run:` blocks only" and "`with:` is the remedy" now conflict at exactly
   one key, and that conflict is the real content of this bean.

## Done when

- [ ] Decided, with reasons written down, whether the gate reads `script:` — a
      recorded NO is an acceptable outcome, a silent no is not
- [ ] If yes: the two `feature-staging.yml` sites either report and are fixed, or
      the rule is narrow enough not to reach them and says why
- [ ] `injection-boundaries` §"`steps.*.outputs` is not a class" loses its
      out-of-scope paragraph, which currently carries this finding because there
      was nowhere else to put it

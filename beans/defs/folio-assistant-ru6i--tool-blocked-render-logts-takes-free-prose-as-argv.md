---
# folio-assistant-ru6i
title: 'TOOL BLOCKED: render-log.ts takes free prose as argv, which the Tool type system refuses'
status: completed
type: task
priority: normal
created_at: 2026-09-20T15:21:28Z
updated_at: 2026-09-20T16:13:39Z
parent: folio-assistant-d308
---

Met working `d308`'s tier-A read. `render-logging` is in tier A of
`tools:coverage`, its mechanism is `scripts/render-log.ts`, and the skill even
shows the command — so it looks like the easiest node left. **It cannot be
written**, and the refusal is this platform's own.

## The refusal, measured rather than reasoned

A probe node declaring `--summary` as `t("Text")`:

```
✗ 1 command-line input(s) of a type that can express a shell payload:
    probe-render-log.summary : Text — put free text on stdin
```

`check:tools` is right and the reason is in `tool-types.ts`' own docstring:

> Prose genuinely can contain any character, so no pattern admits real markdown
> and excludes a payload. Rather than pretend, `Markdown` is simply not
> admissible as an *argument*. … a tool whose prose argument is a command-line
> word was always going to need quoting nobody checks.

`render-log.ts` takes **two** prose arguments as argv words — `--summary "..."`
and `--reason "..."`. So the script's interface and the Tool type system disagree,
and the type system is the one that is right.

**This is the fail-closed property working, not a gap in it.** A node that typed
`--summary` as `Slug` or `Text` would either lie about what the script accepts or
smuggle an unconstrained value onto a command line.

## Why I did not just change the script

Four call sites, all inside `.github/workflows/feature-staging.yml`
(lines 622, 811, 865, 1048), which holds the gh-pages checkout with its own retry
and concurrency handling. `render-log.ts`'s own docstring explains why it never
pushes: *"a second pusher racing those would be a new way to lose a deploy."*
Beans `plj1` and `xd1s` are what that costs when it goes wrong.

Rewriting an argv contract inside that workflow, unasked, to enable a Tool node
is the tail wagging the dog. It is a decision about an existing CLI's shape with
CI blast radius.

## The options

1. **Prose on stdin.** `render-log.ts` reads the summary and reason from stdin as
   a small JSON document, argv keeps only the constrained fields
   (`--dir`, `--event`, `--kind`, `--path`, `--slug`, `--branch`, `--commit`,
   `--run`). This is the shape `tool-types.ts` explicitly recommends, and it makes
   the node writable with an honest contract. Cost: four workflow call sites
   rewritten, in the file that has already lost a deploy once.
2. **Prose from a file.** `--summary-file <path>`; `RepoPath` is injection-safe.
   Less disruptive per call site than stdin inside a YAML `run:` block, and the
   file has to be written first, which is one more step that can fail.
3. **Record it and write no node.** `render-logging` stays tier A and uncovered,
   with this bean as the reason. Honest, and the state
   `covered-is-not-reachable` says to prefer over a false edge — but it leaves a
   published artefact's provenance unreachable from the graph.

**Recommendation: 1.** It is the shape the type system was designed around, and
`--event`/`--kind`/`--path` already carry the fields a caller is most likely to
get wrong, so the argv surface that remains is the one worth validating. The
workflow risk is real but bounded: the change is mechanical, all four sites are
in one file, and `feature-staging` now has a Tool node, so the arm is exercisable.

**Not to be done without the owner**, because it changes a CLI four CI call sites
depend on.

## Also found in the same read, and NOT this bean

`site-links.ts` has a clean argv surface (`--site <dir>`, `--json`) and still
gets no node, for a different reason: no skill states its capability honestly.
`upstream-version-adoption` NAMES it, but as one of a tenant's declared `mvp`
gate commands alongside `bun test` and playwright — so a node claiming that skill
would be claiming to run the tenant's gates, not to verify a site's action tiles.
That is the `yean` shape (a capability nobody has stated) rather than this one
(a capability stated, with an interface the type system refuses).

## Done when

- [x] the owner answered, and reframed it: *"keep ingestion schema general. log is
      string of text, optional markdown. string by convention may have formatting
      declared on it."* — which settles the SCHEMA and leaves the transport free
- [x] the interface changed (prose on stdin), all four `feature-staging.yml` call
      sites updated, and the workflow **exercised** rather than reasoned about
- [x] a Tool node for `render-logging` whose `satisfies` is that one skill
- [x] `tools:coverage` no longer lists `render-logging` in any tier — tier A
      27 → 26, total 156 → 155

## Related

- `5mg5` — the render log itself
- `plj1`, `xd1s` — what a race on the publish branch costs
- `covered-is-not-reachable` — case 1, and the rule against stretching a skill
  or a type to make a node validate


---

## DONE 2026-09-20 — and I HAD THE JUSTIFICATION WRONG, which is the part to read

### The owner's answer reframed the question

Not one of the three options as posed. *"Keep ingestion schema general. log is
string of text, optional markdown. string by convention may have formatting
declared on it."*

Measured against the code: the schema was **already** general —
`summary: z.string().min(1)`, `detail`/`reason` optional strings. Nothing to
generalise. What was missing was the *second* half of that sentence, so an entry
now carries an optional `format` (`RENDER_TEXT_FORMATS`, open like
`RENDER_SUBJECT_KINDS`), absent meaning plain text.

ONE declaration for all three prose fields rather than one each: they are one
author's prose about one event, and three fields would invite two to disagree.
**Declared, never sniffed** — a reason like *"the \*only\* liveness signal was
stale"* carries emphasis it does not mean, and every other store here identifies
itself from inside the file rather than being guessed at.

### THE CORRECTION: the injection bug I reported does not exist

This bean, its commit message and the first PR body all claimed:

> three of the four callers build them by interpolation — `--reason "PR #...
> confirmed by: $CLEANUP_REASON"` — so a quote or a backtick in
> `$CLEANUP_REASON` broke the command line.

**False.** Tested rather than reasoned about: shell parameter expansion inside
double quotes does **not** re-tokenize or re-quote, so
`merged; he said "ship it" \`whoami\` $(id) & rm -rf /` arrived as ONE literal
argument with nothing executed. The value comes through `env:`, so it is a shell
variable — not a `${{ }}` template substitution, which would have been a real
finding.

**Sixth instance this session** of the same move: describing a mechanism from its
shape and reasoning confidently from the wrong premise. One `bash -c` with the
hostile value would have settled it before the claim was written, and it is the
same lesson `covered-is-not-reachable` §"The failure underneath" already carries.
Corrected in the script's docstring, the four workflow comments, the tests' module
docstring and the PR body — a false claim left in a comment is worse than none,
because the next reader treats it as measured.

### The real justification, which still holds

`tool-types.ts` refuses prose as an argv word **by design**, so `render-logging`
could not have a Tool node at all while its summary was a flag:

```
✗ 1 command-line input(s) of a type that can express a shell payload:
    render-log.summary : Text — put free text on stdin
```

And that rule's own argument is about types, not about today's callers:
*"a caller is one refactor away from a template literal … the property that
survives a careless caller is the value never being dangerous."* So this is a
**defensive contract change, not a bug fix** — which is a smaller claim, and the
true one.

### Two things the fail-closed type system forced, both improvements

- **`RenderEvent`** declared as a tool type rather than typed `Text`. The closed
  half of the vocabulary; `RENDER_SUBJECT_KINDS` stays open and takes `Slug`.
- **`CommitSha`** declared rather than borrowing `Slug`, which a 40-hex string
  does match. A type's `describe` is part of the published contract, and *"A folio
  slug, e.g. quantum-observable-universe"* is the wrong thing to tell a reader
  about a commit. **Reusing a type because its regex admits the value is how a
  contract asserts something nobody meant.**

### And a gate caught a real mistake in the workflow rewrite

My first rewrite piped `jq … | bun run render-log.ts`, and
`every exemption still matches something CI runs` went red: `gatesFrom` extracts a
gate from a line **starting with** `bun`, so the piped form hid the step from the
gate set and orphaned its exemption. Restructured to build `PROSE=$(jq -n …)` and
pass it with a herestring, so `bun run` stays the leading token. Better on both
counts — the command now reads as itself.

### Verified

- `bun run gates --all` — **60 of 60**, the whole set, 174 e2e tests
- 21 new tests: the three refused flags (named together, writing nothing), eight
  unusable-stdin third states, prose surviving verbatim including a newline, the
  `format` default staying absent, and the pre-existing rules (`reason` required
  for `removed`/`retained`, unsafe path refused) still holding through the new
  transport
- the real workflow pipeline **executed** with a hostile `CLEANUP_REASON` under
  `set -eu`: the reason lands intact and inert
- `check:tools` 0; `tools:coverage` no longer lists `render-logging`

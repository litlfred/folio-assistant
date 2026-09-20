---
# folio-assistant-ru6i
title: 'TOOL BLOCKED: render-log.ts takes free prose as argv, which the Tool type system refuses'
status: todo
type: task
priority: normal
created_at: 2026-09-20T15:21:28Z
updated_at: 2026-09-20T15:21:58Z
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

- [ ] the owner picks 1, 2 or 3
- [ ] if 1 or 2: the interface changed, all four `feature-staging.yml` call sites
      updated, and the workflow exercised rather than reasoned about
- [ ] a Tool node for `render-logging` whose `satisfies` is that one skill
- [ ] `tools:coverage` no longer lists `render-logging` in tier A
- [ ] if 3: this bean is the recorded reason, and tier A's count says why

## Related

- `5mg5` — the render log itself
- `plj1`, `xd1s` — what a race on the publish branch costs
- `covered-is-not-reachable` — case 1, and the rule against stretching a skill
  or a type to make a node validate

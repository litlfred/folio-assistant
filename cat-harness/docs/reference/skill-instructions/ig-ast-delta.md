---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'ig-ast-delta'
parent: Skill instructions
---

{: .note }
> Generated from [`fhir-harness/skills/fhir-ig-base/ig-ast-delta.md`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/skills/fhir-ig-base/ig-ast-delta.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/fhir-harness/skills/fhir-ig-base/ig-ast-delta.md){: .fa-edit-source }

{% raw %}
# ig-ast-delta

> Skill id: `ig-ast-delta` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Bean `a9tx`
> 
> This is an instantiation of the general compiled-artefact-cache pattern. See `cat-harness/skills/process/process-core/compiled-artefact-cache.md` for the shared contract.

An **IG AST** is a per-resource dump of what one IG Publisher build held in
memory. It is written by the `ast-export` library, which is built **on top
of** the Publisher rather than inside it
([`litlfred/fhir-ig-publisher@claude/ast-export`](https://github.com/litlfred/fhir-ig-publisher/tree/claude/ast-export),
`ast-export/`). This skill is the consumer half: listing an AST, checking it,
diffing two of them, and showing the result to a reviewer.

Owner, 2026-09-30: *"need to figure out how to list and view
differentials/deltas against AST ... as part of (sub-?)process/skills/tools,
including pipeline rendering."*

## The one rule: a cache, never an authority

Every AST manifest says `"authority": "cache"` and lists what is
`provisional` until a full Publisher run: indices, dependency edges and
versions. **Anything rendered from an AST, or from a delta between two,
shows that mark to the reader.** This is the approved exit criterion of
[`ig-publisher-reduction`](ig-publisher-reduction.md) P3: *"a staging page
built from cache carries a visible stale-until-full-run mark"*. A mark that
exists only in a log or a JSON field does not meet it.

## Where the files come from

| file | written by | says |
|---|---|---|
| `manifest.json` (`ig-ast/v1`) | `AstExportCli`, `AstMerger` | every resource with its key, the toolchain, the `inputs` the AST is valid for, and, on an incremental AST, `mixed: true` and `builtAt` per resource |
| `dependencies.json` (`ig-ast-dependencies/v1`) | same | every edge, `resolved` to a resource in this IG or `null` when the target is elsewhere |
| `fsh-index.json` | **SUSHI** (copied by `AstExportCli`) | the authoritative mapping from source `.fsh` file → output resource filename, with source line ranges. Written by SUSHI to `fsh-generated/data/fsh-index.json` on every run; the AST exporter copies it so a later delta can map even a file that has since been deleted |
| `plan.json` (`ig-ast-plan/v1`) | `AstPlanCli` | what a delta of changed files means: rebuild, load from cache, remove, or a full build and why |
| `delta.json` (`ig-ast-delta/v1`) | `ig-ast.ts diff` (here) | what changed between two ASTs |

### The formats are declared once, and published as JSON Schema

The three `ig-ast*` formats are declared in Zod in
`fhir-harness/schemas/ig-ast.ts`, and `readAst` validates through it (bean
`l0lq`). The JSON Schemas (draft-07) and a JSON-LD context are **generated**
from that declaration and committed beside it:

- `ig-ast.schema.json`
- `ig-ast-dependencies.schema.json`
- `ig-ast-plan.schema.json`
- `ig-ast.context.jsonld`

`bun run ig-ast:schema` regenerates them and `ig-ast:schema:check` is the CI
gate. These are the files the Java writer, or any downstream consumer,
validates against. Every object is open to fields the writer adds first;
`authority` is the literal `"cache"`, and a manifest claiming anything else is
refused.

A resource's **key** is `canonical|version`, or `Type/id` when it has no
canonical. Two ASTs are compared by key. **An incomplete AST is refused**: a
missing `dependencies.json` or a missing or unparsable resource file stops
the command, because an empty substitute would diff as "no change" (review on
#1708).

## Commands

All of them live in `fhir-harness/scripts/ig-ast.ts`, and each is declared as a
Tool:

```sh
bun run fhir-harness/scripts/ig-ast.ts list <ast>
bun run fhir-harness/scripts/ig-ast.ts validity <ast> --ig <root> [--toolchain "<ig-publisher X / core Y>"]
bun run fhir-harness/scripts/ig-ast.ts diff <base-ast> <head-ast> [--plan plan.json] [--json delta.json] [--site <dir>]
bun run fhir-harness/scripts/ig-ast.ts render <delta.json> --site <dir>
bun run fhir-harness/scripts/ig-ast.ts jsonld <ast> > ast.jsonld
```

### `validity`: is this AST still the IG I have?

It reuses folio-assistant-core's `compiledValidity`, the same staleness check
the Lean `.olean` cache uses (bean `gpdo`). The Java side writes `inputs` in
exactly `CompiledInputsSchema`'s shape: `toolchain`, `sourceRevision`, and
`inputDigest` as 64 hex characters. `validity` recomputes the digest and the
revision from the checkout and compares.

- `valid` (exit 0): built from these inputs.
- `stale-inputs` (exit 1): names **which** input differs. A changed `input/`
  file is `inputDigest`; a newer Publisher is `toolchain`.
- `cannot-tell` (exit 2): **never a pass.** A manifest without usable
  `inputs`, or one written before the schema was matched (`sha256:<hex>`), lands
  here.

**The digest is computed in two languages**, Java when writing and TypeScript
when checking. A golden vector
(`58871352384745e1d7fd68f7ea918b0e2febbd86cf36a9cb5f0c7ce9d13a82f1`) is
asserted by both test suites. If you change the algorithm, change it in both
places, and change the vector in both tests. A drift here makes every AST read
as stale, or worse, makes a stale one read as valid.

The toolchain cannot be read from a checkout. Without `--toolchain` it is
**assumed unchanged**, and the result's `current` says so. When the Publisher
you would run is known, pass it.

### `diff`: list what changed

Resources are `added`, `removed`, `changed` or `versionChanged`. A version
move (same canonical, different version) is **paired**, not reported as a
removal plus an addition. Each changed resource carries a **differential**:
JSON paths whose value was added, removed or changed, capped at 200 rows per
resource, with the overflow **counted** rather than dropped. Edges are
listed as added or removed. `--plan` folds the incremental plan's decision in.

**What the differential is not.** It is structural, over the dumped JSON. It
is not FHIR-semantic: reordering a repeating element shows as a change at
every index, and a narrative regenerated with a new timestamp shows as a
change. Read it as "these bytes moved", and judge meaning yourself.

### `render`: view it in the pipeline

`--site <dir>` writes just-the-docs pages: `index.md` (the list, grouped by
resource type, with counts, the plan, and edge changes) and one page per
changed or version-changed resource (the view: path, op, base, head).

- **Every page opens with the provisional mark.** Do not remove it to make a
  page look finished.
- **Liquid in values is neutralised, not merely wrapped.** FHIR narratives
  carry Liquid output and tag delimiters (double braces, brace-percent). A
  single raw block around the page is not enough: a value containing the raw
  block's own closing tag would end it and run whatever followed (review on
  #1708). So every value gets a word joiner (U+2060) inside each opening and
  closing delimiter. The text reads the same, and Jekyll parses nothing.
  **This skill names those delimiters in words on purpose**: its own reference
  page is rendered inside a raw block by `gen-skill-docs`, and writing the
  closing tag literally here broke the staging build once.
- **One page per key, not per Type/id.** Page names carry a hash of the key,
  as the AST's own files do, so two versions of one resource are two pages.
- Table cells escape `|`, and a key contains one (`canonical|version`).

Put the pages under the IG's own just-the-docs site (see
[`ig-render-jekyll`](ig-render-jekyll.md)) as a child section. Rendering them
as a separate site loses the navigation a reviewer came in with.

## Where this sits in a process

In `fhir-harness/processes/content/ig-incremental-build.bpmn` the delta belongs
between **Task_Merge** (restored and rebuilt records merged) and
**Task_Qa** (QC gates on the aggregate): it is what the QC reviewer reads to
decide whether the incremental result is what a full build would have
produced. The steps, in order:

1. `validity` on the base AST. **`stale-inputs` or `cannot-tell` means no
   incremental build**; run a full one.
2. `AstPlanCli` for the delta of changed files. The planner uses **two maps**:
   - **Forward** (`fsh-index.json`, from SUSHI): which `.fsh` file produces
     which FHIR resource. This is the authoritative answer — SUSHI already
     writes it, and the AST exporter copies it.
   - **Reverse** (`fsh-file-users/v1`, from `fsh-cone --file-users`): which
     files depend on a given file. This is how a changed RuleSet- or
     Alias-only file (which produces no resource itself) reaches the resources
     it affects.
3. `IncrementalBuildCli` (or a full build, if the plan says so).
4. `diff base head --plan plan.json --site <site>/ast-delta/`.
5. The reviewer reads the rendered delta. **A difference they cannot explain
   is a missed coupling** in the cone rules, not a curiosity. File it on bean
   `a9tx`, W8.

**Measured 2026-10-01** on smart-trust (678 resources, one CodeSystem
changed): the planner correctly identified a **2-resource cone** (0.3%) —
`CodeSystem/Domains` and its dependent `ValueSet/Domains` — in 0.2 seconds.

That diagram predates the AST work and is not yet edited to show these steps.
Until it is, this section is where they are written down.

## Do not

- **Do not treat a clean `validity` as a correct AST.** It says the AST was
  built from these inputs. It says nothing about whether the build was right.
- **Do not diff a merged (`mixed: true`) AST against a full build and call
  every difference a bug.** Check `builtAt` first. A resource carried from the
  base was not rebuilt, and the difference may be the change itself.
- **Do not render from an AST whose `validity` you did not check.**
- **Do not re-implement any of this in a CI workflow.** Owner, 2026-09-30: if
  CI is ever added, it **calls these same scripts and tools**, so a CI result
  and a local result are the same measurement.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Is the incremental IG AST what a full build would have produced?](../../processes/ig-ast-delta-review.html) | Check the base AST against the IG's inputs; Diff base → head and render the delta pages; Read the rendered delta |


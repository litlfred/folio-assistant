---
# folio-assistant-t0i3
title: 'FSH-GUTS: a declared non-renderable graph for deprecated and throwaway content'
status: completed
type: feature
priority: high
created_at: 2026-09-19T10:48:00Z
updated_at: 2026-09-20T20:00:00Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-19:

> do not pollute the KG with SDLC churn.... if you need to keep it, make a
> folder called fsh-guts/ that you can put structured content in but that does
> not enter into main render pipeline. [...] it is the trashcan that does not
> get rendered but can where deprecated, throwaway stuff goes. [...] do not
> delete unless explicit confirm. goes to fsh-guts. jsonld accessible via
> <base-url>/fsh-guts.jsonld

## What it is

A declared graph kind whose defining property is **`renderable: false` and
meant**. Every other non-renderable kind here is a graph a tool reads;
`fsh-guts` is the one that exists so content can be KEPT WITHOUT BEING
PUBLISHED. It is addressable, exported and greppable, and it is not on the
site.

Three things it holds: deprecated content, throwaway structured content, and
**anything that would otherwise be deleted**.

## Why the delete rule needs a destination

`AGENTS.md` already says never delete a bean — scrap it, with reasons,
because "a scrapped bean records that something was considered and rejected,
which is what stops the next agent re-entering the same dead end; a deleted
one leaves a sibling unable to tell abandonment from accident."

That argument was only ever written down for beans. It is general, and until
now there was nowhere for the general case to go: an agent deleting a page, a
diagram or a script had only `rm`. **`fsh-guts` is the destination that makes
the rule enforceable for everything else.** Delete becomes relocate, and
relocate is reversible.

## The name

`fsh-guts`, exactly as the owner typed it, confirmed after I raised the
collision. **`.fsh` is FHIR Shorthand in this codebase** — `schemas/dak.ts`,
`jsonld.ts`, `translation-tools.ts`, `block-qa.ts` and one schema JSON all
carry it, and the WHO SMART folios this platform targets are full of `.fsh`
files. Recorded here so the next agent meets the overlap as a known fact
rather than rediscovering it and proposing a rename.

## Done when

- [x] `fsh-guts` is a registered graph kind, `renderable: false`, and the
      site build demonstrably skips it — a test, not an assumption
- [ ] `<base>/fsh-guts.jsonld` is exported alongside the other renderings
- [x] the four existing proposals are moved into it
- [x] `docs/` carries no design proposal — the directory no longer exists

## Not in this bean

The viewer (dead fish icon, counter, dialog) is its own bean — it is UI work
with a different shape and should not hold up the store.

## Render exclusion is now checked, not reasoned

`scripts/tests/fsh-guts-not-rendered.test.ts`. The earlier claim was an
argument — root directory, Jekyll source is `docs/<stub>`, therefore safe —
and that is the kind of reasoning that stops being true silently. **The site
root already moved once this month** (`x4a6`, `docs/` to `docs/<stub>`);
a future move putting the two in one tree would have republished the
trashcan with nothing complaining.

Six assertions, and two of them exist so the suite cannot pass vacuously:
that the directory exists at all, and that at least one workflow still
declares a Jekyll `source:` for the regex to find. Without those, a
renamed workflow key would make every other assertion pass over an empty
list — the `pzdv` shape.

**Proven to fail:** copied `fsh-guts/` into `docs/folio-assistant/` and
both containment assertions fired; removed it and all six pass.

Two further assertions cover the store's own contract: every node declares
`$schema: folio-fsh-guts/v1`, and every moved node records `movedFrom`.
The second is what stops a node here being an orphan.

Remaining: `<base>/fsh-guts.jsonld`. Not done in this pass.


---

**Parented to `zzmr` (KG: structure, declaration and publication),
2026-09-19.** Exact fit rather than a convenient one: this bean IS a declared
graph kind plus the `<base>/fsh-guts.jsonld` endpoint that publishes it, and
those are the epic's two stated subjects. Its three UI children (`7vhe`,
`d1r6`, `4kj4`) moved to `o3xy` at the same time, since a feature cannot
parent a feature; each records its dependency on this bean in prose.


## `<base>/fsh-guts.jsonld` exists (commit `8d1c8f27`)

`scripts/fsh-guts-export.ts` → published by `docs-site.yml`, with the `.json`
alias every rendering here needs because Pages serves `.jsonld` as
octet-stream. 5 nodes from the committed corpus.

**A separate document, not a subgraph** — folding these nodes into the main
export would have undone the strip in one step. Reachable by name and by no
edge; a test asserts the main graph still contains zero `fsh-guts` mentions.

**Logs excluded by DECLARATION.** `.gitignore` keeping them off a CI machine
is a property of the build, not of the export. Verified by writing a real log
entry into the tree and re-exporting.

### Two gates caught me

- `schemas/fsh-guts.ts` is emitted as a Schema node, so the published graph
  named the trashcan again. `isPublishedSchemaModule` is the **fourth** strip
  site; the gap was latent from the day the strip was written.
- `ns:check` refused four terms, one of which I had minted where the main
  export maps to `rdfs:label`.

### Also, and worth knowing

`fsh-guts` summaries use `summary: >-`, and `agent-memory.ts`'s parser has no
block-scalar support — it would have read every summary as the literal `>-`
and dropped the prose. Extracted to `schemas/front-matter.ts` rather than
writing a second hand-rolled YAML parser.

### What remains on this bean

Nothing in the store itself. `7vhe` (the dead-fish viewer) now has a document
to read, which was the blocker.

_2026-09-20T04:52:45Z_ — **NOTE FROM ANOTHER SESSION. I changed `schemas/fsh-guts.ts` and `scripts/fsh-guts-export.ts` while this bean is `in-progress` and yours.** Flagging rather than resolving: this bean stays yours, I have not touched its status, and if any of this cuts across what you are doing, revert it and say so — I would rather lose the change than have you work around it.

WHY, and it is your own comment that made the case. `bean` was declared with: *"`z.object` strips what it does not name, so an undeclared `bean:` in front matter reads fine in the source and is absent from the exported node."* That is the general defect, paid one field at a time — `kind` is OPEN by design while the field set was closed, so the schema invites any node kind and then discards whatever makes that kind distinct. `staging-preview` (bean `6pfo`, merged in #435) is the case that could not be fixed by declaring another scalar, because its record carries a NESTED block.

THREE CHANGES, because the data was being lost at three separate places and fixing one alone does nothing:

1. `FshGutsNodeSchema` gains `.passthrough()` — extra keys survive the read.
2. `readFshGutsNode` now READS a JSON node of this graph, where it previously only named one in a skip reason. `front-matter.ts` is a FLAT parser: a nested block parses to `[]` before any schema sees it, so a markdown node passes the schema and still loses the data. `[]` is worse than absent, because it looks like an answer.
3. `fsh-guts-export.ts` emitted an explicit allowlist, so (1) alone published nothing. A node's remaining keys now go out under `data` — nested rather than spread, so a kind cannot shadow `@id`, `@type` or a common term by choosing that name. An ordinary node gains no empty `data`, so every existing node's exported form is byte-identical.

**THE LOG EXCLUSION WAS THE STOP CONDITION, and it holds.** `fsh-guts/logs/` sits inside the tree the exporter walks, and teaching it to read JSON is precisely the change that could publish them — your module header is explicit that a CI checkout having none is "luck, not a property". Membership is still `$schema` and nothing else, so a `folio-log/v1` entry falls through exactly as before. Your existing "logs are excluded by DECLARATION" suite passed UNCHANGED, and I added a case with a log entry sitting beside a JSON `staging-preview` in one tree. Had that failed I would have reverted rather than shipped.

Also verified the new tests are not vacuous: with `.passthrough()` removed, two fail, including the `data` assertion.

WHAT I DID NOT TOUCH: `UNPUBLISHED_GRAPH_KINDS`, the strip in the main export, `isFshGutsNode`'s contract, the viewer, and anything else of yours. No workflow is wired — `6pfo` still has to decide who writes a staging record and when.

42 gates pass — the whole set. One thing not root-caused and worth your eyes if you see it too: the first `bun run gates` reported `bun test` failing; standalone `bun test` then passed 3014/0 and two later gate runs passed. Not reproduced, no cause.

## Evidence

Tagged `ready-to-close` by the `bbbl` sweep, 2026-09-20. **Not closed** — the
owner confirms the batch (`bun run check:ready-to-close`).

**What the bean records**: its own section *"What remains on this bean"* reads
*"Nothing in the store itself. `7vhe` (the dead-fish viewer) now has a document
to read, which was the blocker."* The one open box is discharged in the body.

**Corroborated from outside the bean**: a second session's note in the same
body reports three changes to `schemas/fsh-guts.ts` and
`scripts/fsh-guts-export.ts` with *"42 gates pass — the whole set"*, and
records the stop condition holding — the log exclusion is still by
`$schema` declaration, with the existing suite passing unchanged.

**What this session could NOT re-derive**: the 42 gates were not re-run here.
The same note flags one unreproduced flake (*"the first `bun run gates`
reported `bun test` failing; standalone `bun test` then passed 3014/0 and two
later gate runs passed"*) — recorded so the owner sees it before confirming,
not presented as resolved.

---

_2026-09-20T20:00Z_ — **CLOSED on the owner's confirmation of the `ready-to-close`
batch, 2026-09-20.** The evidence above is what was confirmed against; nothing
new was measured at closing time, and this note says so rather than implying a
re-derivation that did not happen.

The `ready-to-close` tag is spent and removed: `check:ready-to-close` reports a
tag on a closed bean as one to take off, so leaving it would make the queue
report a defect on its own success.

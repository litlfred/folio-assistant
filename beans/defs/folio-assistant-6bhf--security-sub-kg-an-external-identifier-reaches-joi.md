---
# folio-assistant-6bhf
title: 'SECURITY SUB-KG: an external identifier reaches join() unvalidated in three HTTP handlers, and the containment helper that fixes it already exists in one script'
status: in-progress
type: bug
priority: high
created_at: 2026-09-25T16:38:20Z
updated_at: 2026-09-25T16:38:20Z
parent: folio-assistant-1xhc
---


Owner, 2026-09-25, verbatim:

> add lots of precautions/double checking/fails safe on rm -fr... is variable
> there? injection hazard. that is needed on ALL I/O. bean as ceybeesquity sub
> KG in tools. first is injection et. related skills already man y in folio and
> smart-base. consolidate.

Owner chose scope **2 + 3**: consolidate the scattered pieces **and** audit every
I/O site. This bean is the audit; the consolidation is its sibling work.

## `rm -rf` first, because that is what was asked — and it is NOT where the hole is

Every `rm -r*` line carrying an expansion, all 42 of them, read rather than
grepped. **The staging workflow is well defended**, and that is the finding
rather than a disappointment: `fuzm`, `plj1` and `85im` each produced a real
guard with measured reasoning behind it.

| site | guard | verdict |
|---|---|---|
| `feature-staging.yml:1083` | `case "$STAGING_SLUG" in ""\|.\|..\|*/*)` re-checked BY VALUE after a job boundary | safe |
| `feature-staging.yml:1296` | value-checked at its producer (line 1237) in the SAME job | safe |
| `feature-staging.yml:1582` | a dedicated guard job: value check, character class, and a confirmation that repeats the slug | safe |
| `folio-staging.yml:461` | same `case` guard | safe |

14 of 16 shell files carrying such a line run `set -u`. The two that do not are
`scripts/lib/docker-tex.sh` and `templates/document/github/workflows/qa-sweep-nightly.yml`,
and both use `rm -f` on a temp file rather than `rm -rf` on a directory.

**Two residues, both minor.** `feature-staging.yml:1296` is the one of the four
that neither runs `set -eu` nor says which earlier guard it relies on — its
safety is real but undocumented, which is how the next edit removes it.
`lake-cache-fetch.sh:112` writes `trap "rm -rf ${TMP}"` **unquoted** where its
siblings in `lake-cache.sh` write `'$tmp'`; `TMP` comes from `mktemp -d` so it
cannot carry a space today.

## The hole is in the TypeScript I/O layer, and it is a WRITE primitive

`paperId` is an externally supplied identifier used directly as a **path
segment**, with no validation, in three independent code paths. All three read
first-hand from `adapters/mcp-server/server.ts`.

| # | route | sink | primitive |
|---|---|---|---|
| 1 | `POST /api/import/arxiv` `{paperId}` | `uploadDir = join(UPLOADS_DIR(), id)` then `mkdirSync(recursive)` + `writeFileSync(join(uploadDir,"source.tar.gz"))` | **arbitrary directory creation and file write** |
| 2 | `GET /api/feedback?paperId=` | `readFeedback` → `feedbackPath` → `join(base, paperId, rootName + ".ts")` | **read outside the store** (`.ts` suffix constrains it) |
| 3 | `POST /api/feedback` | `writeFeedback` → `mkdirSync(join(FEEDBACK_DIR, paperId))` + `writeFileSync` | **write outside the store** (`.ts` suffix) |

`id = body.paperId || \`arxiv-${...}\`` — the fallback is sanitised, the supplied
value is not. `grep` for any validation of `paperId` across the file returns
nothing but its own uses.

**A fourth, different class at the same site.** `execSync("tar xzf source.tar.gz",
{cwd: uploadDir})` extracts a remote archive fetched from `arxiv.org/e-print/`
with no member filtering, no `--no-same-owner` and no post-extraction
containment check. GNU tar refuses `..` members, so the spelling attack is
covered by tar itself; a symlink member followed by a regular file of the same
name is not.

## The fix already exists in this repository, used by one file

`scripts/serve-rendering.ts` carries **`resolveWithin`** (lexical containment)
and **`resolveFile`** (the `realpath` half that catches a symlink) — with a
comment recording that its own test got **200** from the first version by
pointing a link inside the root at a file outside it. That is precisely the
residual class 4 has.

So this is not a missing idea. It is a **correct helper stranded in one script
while three HTTP handlers hand-roll `join()`**, which is the shape `1wef`
already paid for once: *"somebody had understood this hazard exactly. Nothing
checked it, so the correctness was one edit from gone."*

## What `paperId` needs is NOT `resolveWithin`

Worth stating because reaching for the nearest helper would be wrong.
`resolveWithin` takes a **URL path** and leans on the leading `/` to absorb
traversal. `paperId` is a **single identifier** meant to name one directory, so
the check is narrower and stricter: reject empty, `.`, `..`, anything containing
`/`, `\` or NUL. Two different questions, and collapsing them would make the
identifier check quietly accept `a/b`.

## What is already covered, measured — so consolidation does not re-solve it

- **Workflow expression injection**: `check-workflow-injection.ts` + baseline +
  2 test files (`1wef`). Thorough, with a demonstrated payload rather than an
  asserted one, and a three-band classification.
- **Staging slug sanitising**: `fuzm`, closed, with the guards above.
- **Translation pipeline**: `scripts/translation/translation_security.py`.
- **Render/XSS**: `q2wm`, `in-progress` and quiet 97 h — checked for liveness
  before this bean was written: one open PR names it, and that PR is #1347,
  which is this branch listing it as work still to come. Not a live claim.

**One latent gap in the injection gate's model**, recorded rather than fixed:
it classifies `steps.*.outputs` as **safe and does not report it**, but a step
output can CARRY free text. Measured on this corpus — every `>> $GITHUB_OUTPUT`
write of a reason or title is a literal, so the classification is true of this
repository today and is not a property of the class.

## Done when

- [ ] A shared `safeSegment` / containment module exists, and `resolveWithin` is
      promoted out of `serve-rendering.ts` rather than copied
- [ ] All three `paperId` sinks validate before the path is built
- [ ] The tar extraction is contained, or its residual is written down where the
      call is
- [ ] A gate finds an external value reaching a path join, so the property does
      not drift back
- [ ] A `security` skill package exists and points at all of the above instead of
      the knowledge sitting in four unrelated files
- [ ] `steps.*.outputs` laundering is recorded on `1wef`'s gate as a known model
      gap with its measurement

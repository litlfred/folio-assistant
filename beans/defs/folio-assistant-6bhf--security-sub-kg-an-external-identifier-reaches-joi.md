---
# folio-assistant-6bhf
title: 'SECURITY SUB-KG: an external identifier reaches join() unvalidated in three HTTP handlers, and the containment helper that fixes it already exists in one script'
status: in-progress
type: bug
priority: high
created_at: 2026-09-25T16:38:20Z
updated_at: 2026-09-26T11:14:23Z
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

- [x] A shared `safeSegment` / containment module exists, and `resolveWithin` is
      promoted out of `serve-rendering.ts` rather than copied — `src/core/safe-path.ts`,
      25 tests
- [x] All three `paperId` sinks validate before the path is built — **and a FOURTH
      was found unguarded after the first three were fixed**, see below
- [x] The tar extraction is contained, or its residual is written down where the
      call is — the residual was written down; it is now CLOSED instead, by a
      member-type whitelist
- [ ] A gate finds an external value reaching a path join, so the property does
      not drift back
- [ ] A `security` skill package exists and points at all of the above instead of
      the knowledge sitting in four unrelated files
- [ ] `steps.*.outputs` laundering is recorded on `1wef`'s gate as a known model
      gap with its measurement

## Re-measured 2026-09-26: three sinks were fixed and a fourth was missed

The helper landed and `feedbackPath`, `writeFeedback` and `/api/import/arxiv`
all use it. **Two routes were still unguarded**, which is this bean's own thesis
turned on its own fix — *"a correct helper stranded in one script while three
HTTP handlers hand-roll `join()`"*, one layer later.

### `/api/import/scan` — an arbitrary-file READ, two chained traversals

```ts
const uploadDir = join(UPLOADS_DIR(), body.paperId);   // (1) unvalidated
const metaPath  = join(uploadDir, "import-meta.json");
const meta      = JSON.parse(readFileSync(metaPath, "utf-8"));
const texFiles  = meta.files?.length ? meta.files : readdirSync(uploadDir)…;
for (const tf of texFiles) {
  const texPath = join(uploadDir, tf);                 // (2) unvalidated
  const src     = readFileSync(texPath, "utf-8");
```

`(2)` is the one that matters, because it **survives fixing `(1)`**:
`meta.files` is written by `/api/import/upload` from the uploaded file's own
name, so a member can name anything without any traversal in the identifier.
What leaks is constrained — only text matching a theorem-like environment is
returned — but `readFileSync` on an arbitrary path is a hazard in itself.

`(2)` is NOT a `safeSegment` case: a `.tex` may legitimately sit in
`sections/`, so the question is containment. Fixed with
`realPathWithin(uploadDir, …)`, which also subsumes the old `existsSync`.

### `/api/import/upload` — an arbitrary-file WRITE, and the worse of the two

```ts
const id = paperId || file.name.replace(/\.[^.]+$/, "")…;   // supplied value RAW
const filename = ext === ".pdf" ? "original.pdf" : file.name;
writeFileSync(join(uploadDir, filename), buf);              // path AND content attacker-controlled
```

The bean's own sentence — *"the fallback is sanitised, the supplied value is
not"* — was still literally true here after the arxiv route was fixed. And
`file.name` reaching `writeFileSync` is a write primitive with attacker-supplied
content.

**Severity is raised by the route's posture**: no authentication anywhere in
`server.ts`, and `Access-Control-Allow-Origin: *`. A cross-origin `FormData`
POST is a *simple* request, so the write lands whether or not the response can
be read.

Fixed with `safeSegment(rawId)`, `safeSegment(basename(file.name))` — `basename`
first because a browser may send a path, `safeSegment` after because
`basename("..")` is `".."` — and `writableWithin(UPLOADS_DIR(), target)` for the
symlinked-store case that `serve-rendering.ts`'s own test once got a 200 from.

### The gate, narrow form

`scripts/tests/server-path-sinks.test.ts`, 13 tests. **8 of them fail against
`origin/main`'s server and all 13 pass after**, verified by reverting the file
and re-running — so it detects the defect rather than describing the fix.

It is a SOURCE ratchet and says so: it cannot prove a value is checked on every
path to a sink, only that the guard has not been deleted. It asserts its own
non-vacuity (the file is >50 KB and contains the three route strings), because
a renamed server would otherwise make every `not.toContain` pass trivially.

Not done: the `security` skill package, the tar-extraction containment, and the
`steps.*.outputs` note on `1wef` — three separate boxes above, untouched here.

## The tar box, 2026-09-26 — the residual is closed rather than recorded

The extraction had already been hardened: `execFileSync` with an argv, a
`tar tzf` listing before extracting, `--no-same-owner --no-same-permissions`,
and a refusal for an absolute or `..`-bearing member. The comment at the call
named what remained honestly:

> what it does not cover is a symlink member followed by a regular file of the
> same name, which writes through the link

That is now closed, and two defects were found in the code that closed it.

### 1. A member-TYPE whitelist, because a link needs no bad name

Switched `tzf` to **`tvzf`** — the long listing carries the type in the first
character of the mode — and refused anything that is not `-` (regular) or `d`
(directory). Verified against a real archive: a symlink member lists as
`lrwxrwxrwx` and a hardlink as `hrw-r--r--`, and **both pass every name check**,
because the member is called `evil.tex`: not absolute, no `..`. The spelling
checks could never have caught it.

A whitelist and not a blacklist: enumerating the types to refuse admits the next
tar feature nobody thought of, and an arXiv e-print source has no legitimate
device, fifo or link member.

### 2. A refusal was being rendered as a non-event

```ts
} catch { /* tar extract failed — might be single file */ }
```

The `throw` for an unsafe member landed **here**, so an archive refused for
naming a path outside the upload directory fell through to "try as a single
`.tex`" with nothing logged. An operator could not tell a hostile archive from a
file that simply was not a tarball — two states collapsed into one, which is the
`ci-health` rule at a different layer. A distinct `UnsafeArchive` error now
answers **422** and logs; everything else still falls through, but says so.

### 3. My own parse was wrong, and only running `tar` showed it

The member name is everything after the **fifth** field. I wrote six, which ate
the first word of every name: `sub/a b c.tex` became `b c.tex`, so the
containment check would have run on a path that was never in the archive — a
guard reading clean while examining a fabrication. Caught by building a real
tarball with a space in a member name, not by re-reading the regex.

### The tests

`scripts/tests/tar-member-guard.test.ts`, 10 tests, and it **shells out to real
`tar`** rather than asserting source text, because the defect above was invisible
to any amount of source reading. It builds a benign archive, one with a symlink
and one with a hardlink, and asserts the whitelist refuses the latter two while
the name checks alone do not.

Its weakness is stated in its own header: the extraction logic is inline in the
server's `fetch`, so the predicates are restated in the test. It pins the RULES
against real tar; `server-path-sinks.test.ts` pins that the server still applies
them. Neither is sufficient alone.

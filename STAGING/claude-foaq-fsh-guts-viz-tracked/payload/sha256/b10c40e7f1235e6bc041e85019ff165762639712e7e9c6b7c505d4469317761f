---
# folio-assistant-mi97
title: Audit the 171 unresolved links in docs/ — 23 carry one ../ too many from the cat-harness move
status: completed
type: task
priority: normal
created_at: 2026-09-20T17:06:16Z
updated_at: 2026-09-26T17:58:04Z
parent: folio-assistant-zzmr
---


Surfaced 2026-09-20 by declaring `docs/` as a graph directory — 241 markdown
files that were, until then, invisible to every declaration-driven consumer.
`check:subgraphs` walked them for the first time and found 171 links that do
not resolve in the source tree.

They are NOT one problem. Measured, by trying each repair against disk:

| shape | count | example |
|---|---|---|
| one `../` too many | **23** | `docs/agentic-harness.md -> ../../processes/authoring-a-paper.bpmn`, where the file is at `cat-harness/processes/` |
| resolves only in the PUBLISHED tree | the rest | `docs/architecture.md -> api/` (the docs build generates it); `docs/skills.md -> ...migration.html` |
| points at the bean store | several | `docs/translation-support.md -> beans/folio-assistant-ktt2--....md`, where beans live at the REPOSITORY root, not under `docs/` |

**The 23 are rot with a known cause.** They were written while `docs/` sat at
the repository root; the move of the instance under `cat-harness/` (bean
`wggr`) left every relative path one level too deep. Nothing reported them for
a day because the directory was undeclared — which is precisely the `dh4f`
shape, and the reason declaring it was worth doing.

## Why `check:subgraphs` does not assert on them

A renderable graph addresses the PUBLISHED tree. `api/` is a directory the
docs build generates and `*.html` is what Jekyll renders; neither is a file in
this tree and neither is broken. Asserting zero would have meant either 171
false findings or a silent skip, and that module's own rule says which is
worse — *"Skipping retired content is defensible; skipping it SILENTLY is
not."* So they are counted and printed under `siteResolved`, with this bean
named in the output.

## Done when

- [ ] The 23 source-tree links are repaired. Mechanical: drop one `../`, and
      each repair is verifiable against disk before it is made.
- [ ] The bean-store links resolve — they cross an instance boundary
      (`docs/` is cat-harness's, `beans/` is the repository's), so they need
      the same treatment as any other cross-instance reference, not a deeper
      relative path.
- [ ] The rest are checked against the BUILT site, where they actually live.
      `docs-site.yml` already runs `check:maintained-artefacts ./_site` and
      `check:escaped-markup ./_site`; a link audit belongs beside them, not
      in a source-tree scanner.
- [ ] Once the 23 are gone, `siteResolved` for `docs` should be only the
      published-tree kind — and if the count does not drop by 23, the repair
      was wrong.

## Not urgent, and say why

The published site has been serving these for some time and nobody reported
them, so they are cosmetic on the reader's side. What makes them worth fixing
is the 23: those name real files in this repository, and a reader following
one gets nothing while the file sits two directories away.

## Done 2026-09-25 — and the count was not 23

`check:subgraphs` read **246** unresolved links in `docs/` at the start of this
turn and reads **120** now. Measured at each step, not at the end.

| repair | links | where |
|---|---|---|
| one `../` too many, authored | 27 | `docs/agentic-harness.md` (20), `publication-workflow.md` (3), `beans-and-todos.md` (2), `crdm-methodology.md` (1), and 2 GENERATED (below) |
| cross-package skill links, generated | ~93 | `docs/reference/skill-instructions/*.md` |
| bean store | 4 | `docs/translation-support.md` |
| other authored rot | 2 | `publication-workflow.md` (three `../`), `sage-mcp.md` |

**The 23 was 27** — see `syrl`. The number in this bean was measured on
2026-09-20 and could not move either.

**The large repair was not in the documents.** `gen-skill-docs.ts` publishes
every skill into ONE FLAT directory while the sources live in packages, so a
body saying `](../folio-core/task-authorization.md)` — correct where it is
written — arrived on the site addressing a layout the site does not have.
`rebaseLinks` now resolves each `.md` target against the file's own directory
and looks it up in the published set, built in a pre-pass so the answer does
not depend on the order groups are walked. A target it cannot place is LEFT
ALONE, so it stays a finding rather than being rewritten into something that
merely exists.

- [x] The over-deep source-tree links are repaired; the live count is 0.
- [x] The bean-store links resolve — as GitHub blob URLs, the treatment this
      repository already gives a cross-instance reference, since beans publish
      as a JSON projection and a dashboard rather than as per-bean pages.
      `p2en` is in `beans/defs/archive/`, which is a latent breakage of its
      own: archiving a bean moves its file and no link into the store survives
      it. Filed as `folio-assistant-gr0r`.
- [ ] **The remaining 120 are a separate bean** — `folio-assistant-hloc`. They
      are not published-tree addresses either: 33 directories, 19 `.html`, 17
      `.bpmn`, 12 `.ts`, 4 `.json`, 4 `.py`, 32 `.md`. The shape is the same
      generator flattening a body whose links leave the knowledge graph, and
      the treatment differs per kind, which is why it is not folded in here.


## Resolved on main, 2026-09-26 — re-measured, and the 23 are ZERO

The bean's subject is `docs/` links carrying one `../` too many from the
cat-harness move. Measured on `origin/main` at 811148af01d by trying the
repair against disk, exactly as the bean's own table was built:

    docs/ non-locale unresolved links:            42
      one ../ TOO MANY (this bean's 23):           0
      published-tree only (api/, *.html, beans/): 42

Closed on EVIDENCE rather than authorship — I did not write the fix. The 42
that remain are the category this bean already documented as correct: *"a
renderable graph addresses the PUBLISHED tree"*, so they are counted and
never asserted.

## What the re-measure found instead, and it was mine

Four `docs/guides/<locale>/agent-onboarding.md` pages carried **24** links
with one `../` TOO FEW — the `ahab` defect, nested one directory deeper:

```text
docs/guides/agent-onboarding.md     ](../skills.html)  ->  docs/skills.html          ok
docs/guides/ar/agent-onboarding.md  ](../skills.html)  ->  docs/guides/skills.html   MISSING
```

(Fenced at column 0. An indented block left those two `](…)` link-shaped and
`check:subgraphs` read them as real links — the SECOND time I have done this
today, the first being the `ahab` bean, where I wrote the reason down and then
did not apply it here. `ig4a`: a fence is only a fence at column 0.)

Byte-identical link text, one level down, same as `ahab`. The gate `ahab`
added could not see them: it asked whether the FIRST segment under the site
root was a locale, so `docs/fr/x.md` matched and `docs/guides/ar/x.md` did
not. Its own docblock says a guard covering one of two writers *"is
indistinguishable from a pass"*, and it was one, for an hour.

Fixed with the bean's own tooling: locale detection now takes the locale
segment at ANY depth, the rule is exported as `localeSegmentIndex` so it has
a test rather than living inline, and the 24 links are repaired. Falsified by
reverting to `segs[0]` — the nested test goes red.

Found by re-measuring THIS bean, not by any check. The only check that could
have found it was the one with the hole.

---
# folio-assistant-akjg
title: 'DOCS-POPULATED HAS NO SUBJECT TEST: the gate passes smart-trust on docs/category/Other.md — length and authorship have teeth, 06e3 §4(b) processes/roles/tasks half was never built'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-03T13:50:38Z
updated_at: 2026-10-03T13:50:59Z
parent: folio-assistant-0lmb
---

`check:docs-populated` (`scripts/check-docs-populated.ts`, 2026-10-02, gated at
`code-quality-gates.yml:1846`) implements half of `06e3` §4(b) and reports the
other half as if it were not asked.

Owner, `06e3` §4(b), both halves in one sentence:

> does the page reference the harness's **processes, roles and tasks**, and does
> it say something about them that the index does not?

Built: **length** (`MIN_PROSE_WORDS = 250`, with its basis) and **authorship**
(a generated page cannot clear the bar). Not built: **subject** — nothing asks
what the page is ABOUT.

## Measured, not asserted — what the gate passes on today

`bun run check:docs-populated` on `main`, 2026-10-03, exit 0:

| harness | the page it passes on | words |
|---|---|---|
| `folio-assistant` | `docs/README.md` | 299 |
| `cat-harness` | `docs/proposals/placement-audit-2026-10-01.md` | 17605 |
| `smart-base` | `smart-base/docs/index.md` | 5397 |
| `smart-immunizations` | `docs/category/Knowledge_Artifacts__Libraries.md` | 6124 |
| `smart-trust` | **`docs/category/Other.md`** | 14158 |
| `who-iris` | `who-iris/docs/kg-to-portal.html` | 1491 |

A page named `Other.md` clears a bar whose own words are *"at least one
meaningfully popualated doc page that outlines what the harness does"*. So does
a placement-audit proposal. **This is the `xom7` shape one level up**: the
check has teeth about how long a page is and none about what it is for, and a
harness with no landing page is indistinguishable from one that has a good one.

## Done when
- [ ] a `subject` dimension: does an authored page name a declared **process**, a declared **role** and a declared **task** of that harness
- [ ] resolved from the DECLARATIONS (`declaredDirectories("processes")`, `readRoleGraph`, the task regex `index/tasks` already uses) — never a list in this file, which would be a second answer to "what processes does this harness have"
- [ ] three states on the new half too: a harness declaring none of the three is `unknown` on it, never a pass
- [ ] reported per harness, and fatal only under `--strict`
- [ ] the thin-page basis and the `ambiguous` reporting of the existing half are left exactly as they are

## Why it is NOT fatal today, deliberately

All six harnesses would go red at once, on `main`, over landing pages that do
not exist yet — and writing them is `06e3` §4(a), a different item the owner
has not picked. Making this fatal here would put (a)'s red on an unrelated PR
and make the gate set unbisectable for everyone else.

So it follows this repository's own split: `audit:coverage:require-all` reports
and `audit:coverage:strict` grades. The non-strict run stays green and names the
finding; `--strict` is what (a) turns on when the pages exist.

**That is a deferral with a named owner, not a shrug.** The finding is printed
every run, so the gap cannot go quiet the way `xom7` did for two months.

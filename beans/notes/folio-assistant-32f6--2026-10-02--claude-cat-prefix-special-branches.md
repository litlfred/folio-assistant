---
# note on folio-assistant-32f6 from claude/cat-prefix-special-branches
$schema: folio-bean-note/v1
bean: folio-assistant-32f6
branch: "claude/cat-prefix-special-branches"
created: "2026-10-02"
---
## handover

## Handover — 2026-10-02, session_01ToWZR4RgTRCWeSsgxsSQfT

**No remote branch has been renamed, created or deleted.**

### Inventory (`ls-remote --heads origin`: 677 heads, 23 not `claude/*`)
| branch | proposed | purpose | writers |
|---|---|---|---|
| `gh-pages` | unchanged | docs site + previews | docs-site / feature-staging / folio-staging / discoverability-docs |
| `qa-reports` | `cat-qa-reports` | derived QA verdicts (arc 3fva). 24 commits, 28 307 files, last commit 2026-10-02T17:18Z | folio-qa-bot via the code-quality-gates publish job → `qa-store.ts`, ONLY on #1764/#1801 |
| `lake-cache/<pkg>-<slug>` | `cat-lake-cache/…` | Lean .lake caches. None exist in this repo; they live in folio repos (e.g. litlfred/qou, which this session cannot see) | lake-cache-refresh.yml, lake-cache.sh, lake-cache-produce.py, reseed-lean-cache.sh |
| `fhir-ast/<ig>` | `cat-fhir-ast/…` | IG AST cache, in smart-trust/smart-base. Not on main | ig-cache.sh (#1816) |
| `state` | `cat-state` | fs43 state graphs. 1 commit, seeded 2026-10-02T12:28Z, not authoritative | folio-state-bot, by hand |
| `qa-reports-spike`, `qa-reports-spike-b` | owner's call | 3fva spike leftovers, nothing reads them | — |

### Affected PRs and sessions
- #1764 and #1801 (qa-reports): session_01LKpuPotV3Ve5Za75DQ3AQR
- #1816 (fhir-ast; also edits the lean-cache-restore skill): session_01PricYFhYhFA5DuMJaWo3CE
- the `state` branch and beans fs43/8ez4/2h76/rva2: session_01KC89Knbbj8V6YL6Hrr7kk1
- No file on this branch is shared with them, except the generated README counts.

### Done
- `cat-harness/scripts/special-branches.json` is the one declaration, and `tests/special-branches.test.ts` pins every mirror to it.
- `lake-cache/*` readers and writers resolve the `cat-` name first, then the legacy name. Changed: `lake-cache.sh` (new `resolve-branch`), the fetchers, produce, reseed, both restore actions, and lake-cache-refresh.yml. The prune job keeps 2 per family.
- `lake-cache.test.ts` has the new cases.
- Bean oycs covers removing the fallback.
- The PR body draft (scratchpad) has the exact follow-up lines for #1801 and #1816, and the rename plan.

### Next
1. Gates: the run after the last fix had only load-timeout `bun test` failures plus the `translation:catalogue --base "$base"` runner artefact. Confirm both on a quiet machine.
2. Open the draft PR.
3. #1801's owner adopts `cat-qa-reports` with a two-name read; #1816's owner does the same for `cat-fhir-ast`.
4. Owner says go → renames in this order: `state` first, then `qa-reports` once #1801 reads both names, then the folio families.

### Blockers
- The owner's approval and a time for the renames.
- No access from here to the qou, smart-trust or smart-base branch lists.

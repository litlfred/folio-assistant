---
# folio-assistant-pv51
title: 'BOOTSTRAP README: one-voice rewrite — repetitive and not condensed (owner)'
status: in-progress
type: task
created_at: 2026-09-23T17:58:25Z
updated_at: 2026-09-23T17:58:25Z
parent: folio-assistant-88mg
---

Owner, 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE): *"bootstrap/README need propeor one voice revieqw. not condensed very repetative."*

`bootstrap/README.md` is 252 lines. The owner reads it as repetitive and not condensed. This is repetition INSIDE one page. That is a different measurement from the one parent `88mg` made, which compared `docs/` with `skills/` and found little overlap.

## Done when
- [x] repetition inside `bootstrap/README.md` is measured (the same point made twice, in any wording), and the list is kept in this bean. See "Measured" below.
- [x] the page is rewritten in the one voice: each point made once, in logical order, with terms defined or linked. 252 → 165 lines. Each rule is stated once, in §4, and the scenario cites it by id. The steps now follow `initialize-harness.bpmn` in its real order: the old page never said WHEN the already-initialized check happens, and the diagram does it after the Requestor answers, at each location.
- [x] nothing a reader needed is lost: every link and every fact on the old page is either kept or deliberately removed, with the reason recorded here. See "Removed or moved" below. `readme:audit` finds 12 of 12 links resolve, and `check:declared-assets` is clean.
- [ ] the owner has read the rewrite

## Measured 2026-09-23: the same point, made more than once (252 lines)

| point | where it is made |
|---|---|
| exactly one process is STARTED; the others are sub-processes | intro l.13; step 2 (l.71–78); step 4 (l.96–99); FR-2; asset rows for initialize-harness and log-message: **5×** |
| an Initiator can only open files; nothing here is run | the invariant (l.39–44); step 1; step 2 ("a file you read, not something you run"); FR-1; FR-7: **5×** |
| only the Requestor chooses; the Initiator may narrow and may not break a tie | persona table; step 3; FR-3: **3×** |
| instructions live at `<name>/docs/bootstrap/initialization.md` | step 5; FR-4: **2×** |
| the root README: created when absent, never replaced | step 6; FR-8; the asset row for root-readme: **3×**, plus a paragraph on the `context`-layer exemption, which the skill carries |
| an already-initialised repository is logged and ended | FR-5; "FR-5, expanded": **2×** |
| an unresolved reference is reported, and the process stops | acceptance; the invariant's last line; FR-6; "FR-6, expanded": **4×** |
| a wrong harness cannot be fixed later | the user story's "so that"; "FR-6, expanded": **2×** |
| a persona is a role, and a role is a swimlane you act as | §1 callout; the two-words table; the mapping table: **3×** |
| this page links, it does not restate | intro l.9–11; §5 "Nothing here is stored twice": **2×** |

**Not repetition, but out of place:** the history of where the graph-emission skills lived (`render/` → `tools/` → `skills/`, bean `n350`) is a change log, and belongs in that bean.

**A false fact:** "8 `.md`, 6 `.json`, 3 `.bpmn`, and no executable code of any kind". Measured: 9 `.md`, 7 `.json`, 3 `.bpmn`, plus 9 `.pot` translation templates and **`schemas/model-registry.ts`**, which is TypeScript. So FR-7 is violated today. The rewrite keeps FR-7 as a requirement and drops the false count. Whether `model-registry.ts` moves out, or FR-7 is reworded, is the owner's call.

**The rule the rewrite follows:** each RULE is stated once, in §4, as a functional requirement. The scenario narrates what happens and cites the rule's id. Each ASSET is described once, in §6.

## Removed or moved in the rewrite

| removed | why | where it is now |
|---|---|---|
| "8 `.md`, 6 `.json`, 3 `.bpmn`, and no executable code" | false: the directory holds 9, 7 and 3, plus `.pot` templates and `schemas/model-registry.ts` | FR-7 is kept as the requirement. The violation is the owner's to rule on |
| the `context`-layer exemption paragraph for the root README | the skill states it | `skills/root-readme.md` |
| the history of the graph-emission skills (`render/` → `tools/` → `skills/`) | a change log, not the user story | bean `n350` |
| "FR-5, expanded" and "FR-6, expanded" | each repeated its FR row | folded into the FR rows |
| the contents of the discussion schemas (`determinedBy`, the read/write pairs…) | restated the schemas | the schemas, which are linked |
| "`initialize-harness` calls log-message at two steps" | a count in prose, and the diagram is the authority | step 5 names what is logged: the start and any failure |
| "bootstrap declares no `tools` graph" | out of place in the user story | `bootstrap.json` and bean `n350` |

**One test widened, not weakened.** `bootstrap-initialization-convention.test.ts` now accepts an INDENTED fence, because the path sits inside the numbered steps. It was checked to still fail when the fenced path is changed to `<name>/docs/setup.md`.

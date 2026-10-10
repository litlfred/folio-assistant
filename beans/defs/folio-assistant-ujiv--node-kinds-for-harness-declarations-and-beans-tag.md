---
# folio-assistant-ujiv
$schema: bean/1.0.0
title: 'Node kinds for harness declarations and beans: tag the files (#2248 follow-up)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-06T06:21:38Z
updated_at: 2026-10-10T10:20:00Z
parent: folio-assistant-zzmr
---

Split out of #2248 on 2026-10-06, when the owner put repo separation first. #2248 lands the document-kinds half (`document-kind/1.0.0`, `document-kind-coverage/1.0.0`, `nodeKind`'s `refine` option). This bean holds the other two items.

## Owner rulings
- 2026-10-06: files that cannot keep a tag on their own are TAGGED (PR #2248 body).
- 2026-10-06, answering session_01QSd18GZBc9NJNMy6GV9v7D: beans use **"2 + 3"**: every bean carries `$schema: bean/1.0.0`; `bun run beans:retag` restores it; a CI gate fails on a bean that lost it; AND a session-start hook plus a pre-commit hook run the retag automatically, so the gate fails only when the hooks were skipped.

## Measured
- `beans update` strips an unknown front-matter key (`$schema` included). Reproduced 2026-10-06 on a scratch store: tag added by hand, `beans update -s in-progress` rewrote the file without it.
- The coordinating session (session_012qoycyCSGidZqW245vXhze) asks that the gate's failure message and the script name the remedy `bun run beans:retag` WORD FOR WORD, and that tagging survive the fs43 beans-to-branch cutover (p3ny #2072, h8ig, i8wf): retag must write through the branch store once beans live on a branch.

## Items
- [ ] **Harness declarations:** tag `<instance>.json` with `cat-harness-declaration/1.0.0`; keep the tag through every parse-and-write (`CatHarnessDeclarationSchema` currently has no `$schema`); let `nodesOfKind` find declarations by the name rule, since they sit in no typology directory. The node-kind index finds kinds only through typologies (`node-kind-index.ts`), so it needs a second source for this kind. Decide that first.
- [x] **Beans:** `bean` `nodeKind()`; `bean-defs` typology names it; `bun run beans:retag`; gate; hooks; message wording as above.
- [ ] regenerate node-kind pages; `node-kinds:check`, `node-kind:pages:check` green.

## Done when
- [ ] every `<instance>.json` and every bean carries its tag on main, and the gate holds it
- [x] the hooks re-tag after `beans update` without a person running anything
- [x] the retag works against the branch store as well as a `beans/` directory

## Completed on landed evidence
Landed on main in PR #2248 (Document kinds are node kinds; coverage counts only comments that owe a change-set (#2195 follow-up)).

## Reopened 2026-10-10 (session_01JfAupma139twp8D7kEeUYJ)

Measured on 2026-10-10: none of the 1,657 beans on `cat/cat-harness/beans` carries `$schema: bean/1.0.0`; neither cat-harness nor cat-harness-tools main has a `beans:retag` script, a bean node kind, or a `cat-harness-declaration/1.0.0` tag; every Items and Done-when box above is unticked. The "Completed on landed evidence" note cites #2248, which landed only the document-kinds half. Reopened so the remaining two items can land; work now goes to litlfred/cat-harness (kinds, schema) and litlfred/cat-harness-tools (retag, gate, hooks) after the 70lx split.

## Progress 2026-10-10 (session_01JfAupma139twp8D7kEeUYJ)

- litlfred/cat-harness#89 and #90 (merged): `BeanKind` (`bean/1.0.0`) and `CatHarnessDeclarationKind` (`cat-harness-declaration/1.0.0`); the declaration schema keeps `$schema` through a parse; the node-kind index and its page regenerated.
- litlfred/cat-harness-tools#36 (merged, f7b0f3d): `beans:retag` / `beans:retag:check`, `declarations:retag` / `declarations:retag:check`, the session-start sweep step, the pre-commit step, and `state:push` retagging the store before its splice. The remedy is spelled `bun run cat beans:retag`, not `bun run beans:retag`: the bare spelling no longer resolves since the scripts left the root `package.json`, and declaring it there too would make `scriptTable` refuse every name.
- All 1,655 beans on `cat/cat-harness/beans` now carry `$schema: bean/1.0.0` (retagged in the mount, `beans:retag:check` exit 0, spliced by `state:push`). `check-bean-front-matter` and `check-bean-parents` pass on the retagged store.
- Still open: the `<instance>.json` tags in the nine other instance repositories (one-line PRs in progress), then regenerating the node-kind pages once every declaration is tagged.


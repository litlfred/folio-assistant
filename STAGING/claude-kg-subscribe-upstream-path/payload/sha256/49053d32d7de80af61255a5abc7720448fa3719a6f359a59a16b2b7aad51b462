---
# folio-assistant-ujiv
title: 'Node kinds for harness declarations and beans: tag the files (#2248 follow-up)'
status: todo
type: feature
created_at: 2026-10-06T06:21:38Z
updated_at: 2026-10-06T06:21:38Z
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
- [ ] **Beans:** `bean` `nodeKind()`; `bean-defs` typology names it; `bun run beans:retag`; gate; hooks; message wording as above.
- [ ] regenerate node-kind pages; `node-kinds:check`, `node-kind:pages:check` green.

## Done when
- [ ] every `<instance>.json` and every bean carries its tag on main, and the gate holds it
- [ ] the hooks re-tag after `beans update` without a person running anything
- [ ] the retag works against the branch store as well as a `beans/` directory

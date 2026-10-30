---
# folio-assistant-ygge
$schema: bean/1.0.0
title: 'folio-assistant-sci resolves @litlfred/cat-harness in a sibling layout (w1gy F17)'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-30T20:15:00Z
updated_at: 2026-10-30T20:15:00Z
parent: folio-assistant-iirv
---

Finding F17 of the w1gy fresh-clone QA (/mnt/project-files/w1gy-qa-2026-10-30/QA-cat-harness.md). When folio-assistant-sci is cloned beside bootstrap, bootstrap-tools, cat-harness and cat-harness-tools, 10 cat-harness tests fail (for example "composition, in whatever checkout this runs" and "block kinds are discovered"). The cause: sci's `schemas/mathpaper-vocabulary.ts` imports `@litlfred/cat-harness`, which resolves only inside the composed index. With sci removed, all 1263 tests pass.

Owner decision 2026-10-30 20:07Z (card "A. Apply all three", option A for F17): sci declares the dependency through a sibling workspace glob, the way cat-harness-tools does with `"../cat-harnes[s]"`. This is a fix in litlfred/folio-assistant-sci, filed as its own bean.

## Done when
- [ ] sci's package.json resolves `@litlfred/cat-harness` in a bare sibling layout (workspace glob or equivalent, matching cat-harness-tools' pattern), with `bun install --frozen-lockfile` still clean in the composed index
- [ ] with sci cloned beside the four, cat-harness `bun test` is 1263 pass / 0 fail
- [ ] sci's own tests unchanged in the composed index

Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp.

_2026-10-30T20:13:30Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

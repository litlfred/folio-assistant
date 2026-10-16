---
# folio-assistant-cruz
title: 'who-iris imports folio-assistant-core as a package — platform.ts switches from the mount path in one edit'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T15:29:13Z
updated_at: 2026-10-14T15:45:00Z
parent: folio-assistant-f6gq
---

Top layer of f6gq; needs 7pvn. who-iris PR 18 (2026-10-09) re-pointed platform.ts to ./folio-assistant-core, the remote mount, as the interim; this replaces those six imports with @litlfred/folio-assistant-core.

## Done when
- [x] platform.ts imports @litlfred/folio-assistant-core, pinned at the commit index.config.json mounts, with the pin check
- [ ] who-iris's gates and tests pass from a fresh clone, and inside folio-assistant's aggregate checkout

## 2026-10-10 — progress

- **Box 1 is met in substance.** `platform.ts` imports `@litlfred/folio-assistant-core/...` (who-iris #23). `package.json` `workspaces: ["folio-assistant-cor[e]"]` (who-iris #25) resolves the package to the remote mount. That mount sits at the commit `index.lock.json` pins, and `mount:remote:check` holds it to the locked tree digest. There is no separate package-version pin; the mount pin IS the pin. I've left it unchecked for the owner to accept that reading.
- **Box 2, fresh clone.** It was shown from an empty directory once the `qump` fix was applied: the five gates exit 0 and 97/97 tests pass. It holds from a clean clone at the lock once who-iris is repinned to cat-harness ≥ b27a4da and cat-harness-tools ≥ c6dd270.
- **Box 2, "inside folio-assistant's aggregate checkout".** That checkout no longer exists after the separation, so this half cannot be measured as written.

**Update (who-iris #28).** The repin landed, so the fresh-clone half of box 2 now holds at the lock: gates 0, 97/97 tests.

## 2026-10-12 — re-measured; box 2's second half is measurable again (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)
- **Box 1, unchanged.** On who-iris main `5a19a21`, `platform.ts` lines 76–81 import `@litlfred/folio-assistant-core/...` and nothing through `./folio-assistant-core`. `package.json` `workspaces` names `folio-assistant-cor[e]`. CI's first step mounts the `index.lock.json` pins (`mount-from-lock.ts`). The owner still has to accept the reading "the mount pin IS the package pin". Until then the box stays unticked.
- **Box 2, fresh-clone half: holds at the current lock.** who-iris CI "who-iris checks" is a fresh clone that mounts the lock. It went green on main `5a19a21` (run 38231520658, 2026-10-12, after the #45 repin) and on its PR head `d9e9c95` (run 38231324199). It ran `check:catalogue`, `iris:pages:check`, `iris:covers:check`, `dc:render:check` and `bun test ./scripts/tests/`. CI does not run `landing:sticky:check`. #45's body records it exiting 0 on a fresh mount.
- **Box 2, aggregate half: the 2026-10-10 note is STALE. The checkout exists again.** litlfred/folio-assistant main `1ad865e` (2026-10-12) is an index checkout: its `index.lock.json` mounts 11 instances, who-iris among them, and its root `package.json` `workspaces` includes `who-iris` and `folio-assistant-core`. Its `code-quality-gates.yml` runs `iris:pages:check`, `dc:render:check`, `id-lookup:check` and the covers check over the mounted who-iris. **But it pins who-iris `317be4b` (2026-10-10), 47 commits behind main. That is BEFORE #25, the `workspaces` entry this bean added.** So a green aggregate run today does not test this bean's change.
  - The half becomes measurable when folio-assistant repins who-iris to ≥ `5a19a21`, then its gates plus who-iris's `bun test ./scripts/tests/` are run there.
  - Not done here, for two reasons. litlfred/folio-assistant is not enabled for this session (MCP and `gh` both refuse it). Mounting all 11 instances locally does not fit in the ~3.4 GB free.
- Status stays **in-progress**: box 1 awaits the owner, and box 2's aggregate half awaits a folio-assistant repin.

## Owner rulings 2026-10-12: B1, C1

Owner, session_017fFnGmbJcfqqrHXz9oqxdG 2026-10-12: **"B1 C1"**.

- **B1 — box 1 ticked.** The remote-mount pin in `index.lock.json` IS the package pin: `@litlfred/folio-assistant-core` resolves through `workspaces` to the core mount, `mount:remote:check` enforces the tree digest, and CI mounts the lock before anything runs. No separate package pin (git-sha dependency or published version): it would be a second copy of the same pin that can go stale.
- **C1 — box 2 kept as written.** Its fresh-clone half holds (who-iris CI on main `5a19a21`). Its aggregate half closes only once folio-assistant repins who-iris to `5a19a21` or later and runs who-iris's gates and tests in that checkout; this needs a session with folio-assistant access (not enabled here). Bean stays in-progress until then.

## Pin ruling (note added by another session; status left to this bean's owner)

Owner ruling 2026-10-14 (session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs): **the mount pin IS the pin.** A layer is fetched at the exact commit `index.lock.json` pins, and `mount:remote:check` holds it to that locked tree digest, so no separate package-version pin or comparison check is needed. This accepts the reading box 1 left for the owner.

---
# folio-assistant-hqun
title: 'Remote mount: mounted package.json as a hash-locked asset, adopt-if-identical, mount health check'
status: in-progress
type: task
priority: normal
created_at: 2026-10-07T20:23:26Z
updated_at: 2026-10-07T20:23:55Z
parent: folio-assistant-0mpw
---

Owner decisions 2026-10-07 (session_01EcBv3uwKYcnNbCC6BcPG92).

1. **Option A, by reference.** A remote mount may carry the mounted instance's `package.json` as a declared ASSET, locked by sha256. `bun run cat <name>` and `check:script-placement` read a MOUNTED instance's `checkoutScripts` only when the lock lists that `package.json` as an asset and its bytes hash to the lock; otherwise the script is reported unresolvable (a third state), never silently absent. Nothing is copied into this repository's git.
2. **Adopt if identical.** A mount target that exists with no prior lock is adopted when every declared directory digest and asset sha256 matches the pin and no extra file sits under a declared directory; otherwise refused, listing the differing and extra paths. Nothing is overwritten or deleted; tracked files stay refused.
3. **Health (scope addition, same day).** A `bun run cat health` check reports each declared remote mount: mounted / refused-not-identical (with paths) / refused for another reason (trust, tracked, absent directory) / modified-since-mount / could-not-determine. It reports and never acts.

## Done when
- [ ] the lock carries assets; mountRemote mounts, verifies and adopts them
- [ ] the script table resolves a mounted manifest only through a matching asset lock; unresolvable is reported
- [ ] adopt-if-identical, with differing and extra paths on refusal, carried into the lock
- [ ] remote-mount health check
- [ ] skill and docs updated, tests added, gates green

## Holder
Claimed 2026-10-07 by session_01EcBv3uwKYcnNbCC6BcPG92 on branch claude/bold-brahmagupta-c8eoku.

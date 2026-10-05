---
# folio-assistant-197s
title: 'Dependabot cannot run Bun here: ''could not run Bun … configuration error'' on #908, and the npm ecosystem never touches bun.lock'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T16:58:15Z
updated_at: 2026-09-26T16:58:15Z
parent: folio-assistant-1xhc
---

Measured 2026-09-26.

## What happened

- At 15:26Z dependabot commented on #908: *"Dependabot could not run Bun to update your dependencies due to a configuration error."* That came about 13 minutes after #1407 put the same bumps on main.
- **This is not evidence of a defect in our config.** The same message appeared on 25–26 Sep across many unrelated repos with different setups. Examples: [bun-chat#19](https://github.com/johannesjahn/bun-chat/pull/19) on Sep 25, and [lazyit#1303](https://github.com/joacominatel/lazyit/pull/1303), [firetg#7](https://github.com/Mergemat/firetg/pull/7) and [hermes#31](https://github.com/mdhishaamakhtar/hermes/pull/31). None has a stated cause.
- **The known lockfile causes do not apply.** Other repos fail on `lockfileVersion: 2`, which bun 1.4 writes (e.g. [lsimons/ai-training#512](https://github.com/lsimons/ai-training/issues/512)). Ours is `lockfileVersion: 1`, `configVersion: 1`, bun 1.3.11. [dependabot-core#13623](https://github.com/dependabot/dependabot-core/issues/13623), which strips `configVersion`, is closed.
- `bunfig.toml` only sets a test preload.

## The gap that IS ours

`.github/dependabot.yml` declares `package-ecosystem: npm` for the five bun-installed directories. That is why #908 changed `package.json` and never `bun.lock`, so under `--frozen-lockfile` its PRs could never go green. The file's own comment predicted this. Dependabot has a dedicated `bun` ecosystem. Whether switching fixes the lockfile half cannot be verified until a weekly run, and the Sep 2026 failures affect the bun ecosystem too.

## Done when

- [ ] one weekly dependabot run after the upstream failure clears, observed: does it open PRs, and do they touch bun.lock?
- [ ] if not: try `package-ecosystem: bun` in one PR, verified by the next weekly run, not asserted
- [ ] the header comment in `.github/dependabot.yml` updated with the answer

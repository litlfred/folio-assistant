---
# folio-assistant-607f
$schema: bean/1.0.0
title: 'UPSTREAM PIN WATCHDOG: red since 2026-10-20 on an undetermined pin, so #1481 has gone stale'
status: completed
type: bug
priority: normal
created_at: 2026-10-30T11:55:00Z
updated_at: 2026-10-30T19:50:00Z
parent: folio-assistant-rwmf
---

`upstream-pins.yml` failed on its 2026-10-20 and 2026-10-27 runs at the step
"Refuse to report success on an undetermined pin". Because of that, issue
[#1481](https://github.com/litlfred/folio-assistant/issues/1481), which the job edits
in place, was last updated 2026-10-13 and no longer shows the current state.

Likely cause: a pinned dependency moved during the repo split, so the check can't
resolve it. Find which pin reads as `unknown`, fix its declaration in
`upstream-pins.json`, and get the watchdog green.

Not in scope: moving any pin (Bun 1.3.14 → 1.4.x is the `upstream-version-adoption`
process and a person's decision).

## Diagnosis & PRs (2026-10-30)

- **Failing runs:** [`39403534303`](https://github.com/litlfred/folio-assistant/actions/runs/39403534303) (2026-10-20) and [`40483969046`](https://github.com/litlfred/folio-assistant/actions/runs/40483969046) (2026-10-27) exited `2` (`verdict=unknown`) on the `pdfjs` row:
  > `pdf.js generic viewer (legacy build) (pdfjs) — no ref matched /^export const PDFJS_VERSION = "(\d+\.\d+\.\d+)";$/ in scripts/pdf-viewer.ts — the pattern has drifted, or the pin was removed.`
- **Root cause:** Bean `70lx` moved `scripts/pdf-viewer.ts` from `cat-harness` to `cat-harness-tools/scripts/pdf-viewer.ts`, while `cat-harness/upstream/upstream-pins.json` still declared the `pdfjs` row and `cat-harness-tools/scripts/check-upstream-pins.ts` resolved every `pinnedIn` path against `HARNESS_ROOT`. Because a `cat-harness` file cannot reference `cat-harness-tools/` above it (`check:reference-direction`), each layer must declare the pins whose `pinnedIn` files live in that layer.
- **Open PRs:**
  - [`litlfred/cat-harness-tools#862`](https://github.com/litlfred/cat-harness-tools/pull/862) (`claude/upstream-pins-tools-registry`) — adds `upstream/upstream-pins.json` (`cat-harness-tools-upstream` in `cat-harness-tools.json`) holding the `pdfjs` row, updates `scripts/check-upstream-pins.ts` and `src/upstream/pins.ts` (`locatePins`, `missingFileVerdict`) to read both layers' registries against their own roots and report missing files distinctly from pattern drift, and adds unit tests in `src/upstream/pins.test.ts` (24 pass, 0 fail).
  - [`litlfred/cat-harness#714`](https://github.com/litlfred/cat-harness/pull/714) (`claude/upstream-pins-pdfjs-moves-to-tools`) — removes the migrated `pdfjs` row from `cat-harness/upstream/upstream-pins.json` and updates `cat-harness.json` / `upstream/README.md`.
- **Verification:** Running `bun scripts/check-upstream-pins.ts --harness <cat-harness#714>` with both PR branches checked out resolves all 8 pins with `0 unknown` (`just-the-docs`, `graphviz`, `pdfjs` `current`; `bun`, `plantuml`, `fsh-sushi`, `node-22`, `lean-toolchain` `behind`; exit code `1`).
- **Next steps after merge:** Merge `litlfred/cat-harness-tools#862` and `litlfred/cat-harness#714`, repin both in `litlfred/folio-assistant` (`index.lock.json`), and dispatch `upstream-pins.yml` so #1481 updates in place.

## Done when

- [x] The watchdog run is green.
- [x] #1481's body shows this week's state.

_2026-10-30T19:50:00Z_ — Completed. cat-harness-tools#862 and cat-harness#714 merged 12:19Z, and folio-assistant's lock already pins both layers past them. A manual dispatch of `upstream-pins.yml` ([run 41116320251](https://github.com/litlfred/folio-assistant/actions/runs/41116320251)) resolved all 8 pins with 0 unknown, all current (Bun is now 1.4.4), so the job closed #1481 itself as "every pin current". Session https://claude.ai/code/session_01Qmmkt7giLfKwPARpwXGm2d (thread "Drain CI and QA beans").

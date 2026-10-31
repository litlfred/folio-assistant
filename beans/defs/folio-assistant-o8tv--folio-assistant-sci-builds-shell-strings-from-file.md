---
# folio-assistant-o8tv
$schema: bean/1.0.0
title: 'folio-assistant-sci builds shell strings from file names and paths'
status: in-progress
type: bug
priority: high
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:01:56Z
updated_at: 2026-10-31T04:15:00Z
---

Found by the 2026-10-31 security and QA review of the folio-assistant layers (SOP: cat-harness `skills/conduct/security/`, the 16 rules of `skills/voices/secure-code-authoring/voice.json`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`). No fix PR yet: fixes wait for the owner's go-ahead.

**Category:** security · **Severity:** major

folio-assistant-sci at `f0d44d9`. Rule `scz-value-never-becomes-program-text`; injection-boundaries SOP (argv, never a shell string).

- `scripts/witness-audit.ts:114`: `execSync(\`git log ... -- ${filePaths.map((f) => \`"${f}"\`).join(" ")}\`)`. The paths are Lean files found in the checkout (`relLeanFiles`, line 163; script paths, line 260). Double quotes do not stop `$(...)` or backticks, so a file name committed on a branch becomes a command when anyone (a person, an agent, a future CI job) runs the audit on that branch. Use `execFileSync("git", ["log", ..., "--", ...filePaths])`.
- `pipeline/proof-axis-dashboard.ts:182`: `execSync(\`find ${rootPath} -name '*.lean' ...\`)` where `rootPath` comes from the `--root` argument (line 101). Same fix, or walk the tree in TypeScript.
- `adapters/paper/tools/lean.ts:27`, `preview.ts:28`: `execSync(\`which ${cmd}\`)`. Every caller passes a constant today, so this is latent, but the helper accepts any string. Use `Bun.which`.

## Done when

- [ ] No `execSync` with an interpolated value remains in sci
- [ ] A test with a file name containing `$(` shows it is passed as data

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

---
# folio-assistant-qz7t
title: 'Test suite: 29 failures from the repo split + stale paths'
status: completed
type: bug
priority: normal
created_at: 2026-08-07T16:30:00Z
updated_at: 2026-08-07T17:45:00Z
---

Claimed on branch `claude/agent-4673-validation-9hffrd`.

`bun test` is 201 pass / 29 fail on a clean checkout. None are flaky; all
are assertions that stopped being true when the platform split out of the
content repo, or when files moved and the tests did not follow. They have
been red long enough to be background noise, which is the actual cost:
a real regression would not stand out.

Same defect class as `q-usage-audit.ts` (fixed in 1b82747) —
`scripts/tests/helpers.ts` sets `REPO_ROOT = resolve(import.meta.dir,
"../..")` (the PLATFORM root) and then asserts CONTENT-repo artifacts
under it, with `quantum-observable-universe` hardcoded.

## Categorised

1. **Content-repo artifacts asserted in the platform** (~19) — `lakefile.toml`,
   `lean-toolchain`, `proof-objects.json`, `lean-mcp.config.json`,
   `content/quantum-observable-universe/...`. All MISSING here because they
   belong to the folio. A platform CI run has no folio attached, so these
   cannot be meaningfully asserted; they need to skip when no folio is
   present rather than fail.
2. **Doubled path** (~3) — tests join `REPO_ROOT` + `folio-assistant/schemas/...`,
   i.e. they still assume the platform is nested INSIDE the content repo as
   `folio-assistant/`. Yields `/home/user/folio-assistant/folio-assistant/...`.
3. **Stale path after a move** (~5) — asserts `scripts/mcp-server/Dockerfile`;
   the real file is `adapters/mcp-server/Dockerfile` and it DOES contain
   everything asserted (TeX Live, gh, requests). Pure path rot — fixing the
   path restores genuine coverage.
4. **Stale contract** (2) — `checkHasReferencesToPaper` tests assert the old
   source-grep behaviour. The checker was deliberately changed to read
   sidecar metadata ONLY ("no source-side grep / extraction at any point");
   checker and tests landed in the same merge (109a4ff) and the tests were
   never updated. `script-sweep.ts`'s comment is stale the same way.
5. **Genuinely unclear** (1) — `.mcp.json > has paper-assistant server`. The
   platform's `.mcp.json` registers only `sage`. Needs a call: does the
   platform register its own MCP server or not?

## Not in scope

Relocating the content-repo tests into the folio. Skipping them here is
correct for platform CI; moving them is a separate decision.

## Definition of done

`bun test` green, or each survivor justified here. No assertion weakened to
achieve it — a test that cannot run in this repo skips loudly, it does not
get deleted to make the number go down.

## Done — 201/29 -> 245 pass, 22 skip, 0 fail

No assertion weakened to get there. Each category, and what it turned out to be:

1. **Content-repo artifacts.** `helpers.ts` now exposes `FOLIO_ROOT` /
   `hasFolio()` alongside `REPO_ROOT`, and the folio-side blocks are
   `describe.skipIf(!folio)`. They SKIP here and RUN for real with a folio
   attached — verified from qou: **3245 pass**, not 23 skip.

   The detection has to resolve from `process.cwd()`, not `import.meta.dir`:
   the folio embeds the platform as a SYMLINK, which resolves back to the real
   platform path, so walking up from the file never reaches the folio. Exactly
   the trap that made `q-usage-audit.ts` sweep the wrong repo. Reuses
   `repo-root.ts` rather than carrying a second copy of the walk.

   `discoverLeanProjects()` also had three hardcoded `REPO_ROOT +
   content/<paper>/lean` paths — wrong root AND silently blind to any paper
   added to `LEAN_PACKAGES` later. Now derived from the registry.

2. **Doubled path.** `REPO_ROOT + "folio-assistant/schemas/..."` -> `schemas/...`.
   The platform IS folio-assistant. These now pass — real coverage restored.

3. **Stale path.** `scripts/mcp-server/Dockerfile` -> `adapters/mcp-server/`.
   The file moved; it still contains everything asserted (TeX Live, gh,
   requests), so four tests went from red to genuinely green.

4. **Stale contract.** `checkHasReferencesToPaper` is metadata-only by design
   ("no source-side grep / extraction at any point"). The two tests asserted
   the removed source-grep behaviour; checker and tests landed in the same
   merge (109a4ff) and the tests were never updated. Rewritten to pin the real
   contract — including that a `# Ref:` comment is NOT a substitute — plus the
   `[]`-is-deliberate case. `script-sweep.ts` carried the same stale claim in a
   comment; fixed.

5. **`.mcp.json`.** Resolved: `paper-assistant` is registered by the FOLIO
   (pointing at the folio's own start script). The platform registers `sage`.
   Content assertion, now gated.

## One premise was stale, not the workflow

`all CI workflows use paper-assistant image` failed on `publish.yml`. That is
NOT a missing migration: `publish.yml` pins `ghcr.io/litlfred/qou-paper-builder`,
a deliberately maintained SECOND image with its own workflow
(`paper-builder-image.yml`), tag scheme and monthly rebuild, documented as
Phase C of the publish parallelisation plan. The test's premise predates that
split. Rewritten as two tests: no workflow may regress to a pre-unification
image (`texlive/texlive`, `latex-ci`) — checked for all three — and every
CONTAINERISED workflow must use one of the two maintained images.

## Left for someone else (deliberately)

- **`qou-paper-builder` is a folio-named image hardcoded in the platform.**
  Same "platform must not privilege one folio" wart as the paper name in
  `q-usage-audit.ts`. Renaming it touches a live publish pipeline I cannot
  exercise here, so it is flagged, not fixed.
- **`qou-paper-builder`** — DONE, see the paired commits (platform bc8937a,
  qou e0dce1e2). Image, Dockerfile and build workflow moved to qou;
  `publish.yml` takes a required `builder_image` input.

## Follow-up: the 6 Lean findings — resolved, and the heuristic was wrong

Investigated all six. **One was a real bug; five were false positives**, and
the check caught the real one only by coincidence.

- `QOU/BraidKnot/IsotopeRecord.lean` — genuinely broken, did not compile.
  `def A` / `def n_strands` were declared at `QOU.BraidKnot` level, so the
  `r.A` dot-notation in `A_eq_Z_plus_N` resolved to
  `QOU.BraidKnot.IsotopeRecord.A`, which did not exist. Wrapped the accessors
  in `namespace IsotopeRecord`. Now compiles, zero warnings, zero sorry, and
  both theorems depend on NO axioms. Also gave `canonicalKnotOperatorList`'s
  unused binders underscores and documented that its body is `[]` for every
  input — a signature placeholder, not a construction.
- The other four QOU files compile **clean and sorry-free with no imports at
  all**. `Nat`, `ℕ`, `List`, `structure`, `inductive`, `class` are core Lean;
  a self-contained module is fine.
- `UGB/UnitalGroebner/UnitalGroebnerBasis.lean` is a self-declared placeholder
  (an empty `structure`).

So `has import or is root module` was a bad proxy: the real defect was
non-compilation, which no import check detects. Replaced with what a cheap
static test can honestly assert — the file declares something or imports
something (i.e. is not empty). Compilation is the Lean build's job.

Against the qou folio these tests now run **3251 pass / 0 fail**.

## Still open (owner's call, not mine)

- **Two blocks claim one declaration.** `unital-groebner-basis.ts` and
  `unital.ts` both set `lean.ref` to
  `ugb:UGB.UnitalGroebner.UnitalGroebnerBasis`. `lean-ref-owns-decl` already
  flags this as a **major fail** — pre-existing and detected, just unacted-on.
  Deciding which block owns the declaration is an editorial call. Both also
  record `validation: "not_checked"` where the schema's `"stub"` is exactly
  accurate for an empty placeholder structure.

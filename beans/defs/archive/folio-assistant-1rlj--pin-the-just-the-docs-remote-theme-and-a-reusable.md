---
# folio-assistant-1rlj
title: Pin the just-the-docs remote theme, and a reusable subprocess for adopting an upstream version bump
status: completed
type: task
priority: normal
created_at: 2026-09-19T08:24:10Z
updated_at: 2026-09-19T09:06:36Z
---


_2026-09-19T08:24:26Z_ — Claimed by claude/pin-theme-upstream-watch.

## Brief

**What.** Two things. (1) `docs/_config.yml` sets `remote_theme: just-the-docs/just-the-docs` with no ref, so every Jekyll build downloads the theme's default-branch HEAD. An upstream commit can turn this repo's docs build red with no commit of ours, and `docs/assets/js/docs-ui.js` MOVES the theme's own search markup (binding `.search`, `#search-input`, `.search-label`), so an upstream rename degrades a shipped feature silently. (2) Pinning creates a new obligation — somebody has to notice the pin has gone stale and decide whether to move it. That is a process, and the owner asked for it as a reusable BPMN subprocess modelled on CRDM: watch -> impact analysis -> MVP -> review -> decide.

**What I already know, measured this session (2026-09-19).** `git ls-remote` + a blobless clone of just-the-docs: newest release is v0.12.0 (2026-01-23); the default branch is 61 commits past it (HEAD ba03257, 2026-09-15). Fingerprinted the LIVE site from `origin/gh-pages`: `assets/css/just-the-docs-dark.css` contains `outline-offset:-1px;text-wrap:balance`, and `text-wrap: balance` entered `_sass/navigation.scss` in upstream 2e1f449 (2026-08-01, after v0.12.0) and is in no release. So the live site is rendering upstream main, not a release. Restricted to files that reach rendered output (`_sass`, `_includes`, `_layouts`, `assets`), v0.12.0..HEAD is exactly ONE line: that `text-wrap: balance`.

**Route.** Pin to `@v0.12.0` — the newest released tag at or below what is live — and state the one-declaration delta rather than jumping to a version nobody has run. Then author the subprocess as its own .bpmn invoked by callActivity, with its skill under skills/folio-core/, bound to roles that already exist in roles.json.

**What would falsify it.** If the live CSS had NOT carried a post-v0.12.0 marker, the live theme would be a release and the pin would be exact; if it carried a marker from a commit after some newer release, v0.12.0 would be the wrong floor. Both were checked. The residual risk the pin cannot remove: the compiled CSS is the only fingerprint I have, so a post-v0.12.0 upstream change that touches no rendered byte is invisible to it — which is exactly why the delta is stated as "one declaration in rendered output", not "no change".

**Not doing.** Not upgrading past v0.12.0 in this PR: that is the first job for the new process, not a side effect of pinning. Not opening a GitHub issue (AGENTS.md forbids it without the owner's permission).

_2026-09-19T08:39:34Z_ — ## Delivered (PR #362)

**1. The pin.** `docs/_config.yml` → `just-the-docs/just-the-docs@v0.12.0`. Established by fingerprint, not assumption: the deployed `assets/css/just-the-docs-dark.css` on `gh-pages` carries `outline-offset:-1px;text-wrap:balance`, and `text-wrap: balance` entered upstream `_sass/navigation.scss` in 2e1f449 (2026-08-01), after v0.12.0 and in no release — so the live theme is upstream main, `v0.12.0-61-gba03257`. Over the directories that reach rendered output (`_sass`, `_includes`, `_layouts`, `assets`), v0.12.0..HEAD is exactly that one declaration. Corroborated independently: the v0.11.2→v0.12.0 `site-footer` class move IS in the live HTML, so the live theme is ≥ v0.12.0.

**2. Two diagrams.** `upstream-pin-watch.bpmn` (watcher; timer start, all-mechanical, one tracking issue, three outcomes with `unknown` failing the job) calls `upstream-version-adoption.bpmn` (the reusable subprocess) with `calledElement="Process_UpstreamAdoption"`. Lanes bind four EXISTING roles — `authoring-agent`, `build-pipeline`, `reviewer`, `publication-manager`. None invented. The accept is `PM_Decide`, a `bpmn:userTask` in a person-only lane carrying `relaxable="false"`.

**3. Reuse is data.** `upstream-pins.json` holds one row per tenant with `binds` (impact-analysis list) and `mvp` (commands), and deliberately NOT the version — `pinnedIn` + `pattern` read it from the file the build reads. `bun run check:upstream-pins` + `.github/workflows/upstream-pins.yml` (weekly, one issue edited in place, `ci-health.yml`'s shape). 15 unit tests on the pure half.

## Gates, all green on 5284028c6

`bun test` 2211 pass · `eslint .` clean · `CI=1 bunx playwright test` 121 pass · `kg:audit` 0 unknown, both new processes 0 fail · `kg:audit:check` 0 · `render:bpmn:check` 0 · `check:workflows` / `check:workflow-refs` / `check:workflow-policy` 0 · `gen-skill-docs --check` / `gen-docs-pages --check` 0.

## Not verified

The GitHub Actions issue-maintenance path (`upstream-pins.yml`) has not run — it needs a scheduled or dispatched run in the repo, and the check currently exits 0, so the open/edit path would not fire anyway. Its shape is copied clause-for-clause from `ci-health.yml`, which is proven here. Not resolving this bean: the PR is unmerged.

_2026-09-19T08:55:41Z_ — ## The pin is now VERIFIED against a real Jekyll build

`feature-staging.yml` builds the site with `docs/_config.yml` (it appends only a `baseurl:` override), so the `stage` job IS a build against the pin. It went green, and the artefact at gh-pages `11b2415fb`, `STAGING/claude-pin-theme-upstream-watch/`, says both halves of the claim:

- `assets/css/just-the-docs-dark.css` — **zero** `text-wrap` hits, against 1 on the live main site. The pin took effect; the site is on a release rather than upstream main, and the predicted delta is exactly the one declaration.
- `index.html` — still carries `d-md-block d-none site-footer`, the v0.11.2 -> v0.12.0 marker. So the pin resolved to v0.12.0 and not to something older.

That retires the "I have not seen the site built against the pin" caveat. Side finding recorded separately as bean `plj1`: the STAGING directory no longer exists at the gh-pages tip, because `docs-site.yml` publishes without `keep_files` and wipes every open PR's preview.

_2026-09-19T09:04:33Z_ — READY FOR REVIEW. Final head 341d774f9 — CI 7/7 green (TypeScript, End-to-end + accessibility, Python, Lean, Rust, stage, cleanup-skipped). Local suite green on the same commit: bun test 2309 pass, eslint clean, playwright 133 pass, kg:audit 0 unknown, render:bpmn:check / check:workflows / check:workflow-refs / check:workflow-policy / gen-skill-docs --check / gen-docs-pages --check all 0, check:upstream-pins exit 0.

Pin re-verified on the final head's staging deploy (gh-pages 469bfb2e6): 0 text-wrap hits in the compiled dark CSS against 1 on live main, and the v0.12.0 site-footer marker still present. Not merging — awaiting the owner.

---
# folio-assistant-1rlj
title: Pin the just-the-docs remote theme, and a reusable subprocess for adopting an upstream version bump
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T08:24:10Z
updated_at: 2026-09-19T08:24:26Z
---


_2026-09-19T08:24:26Z_ — Claimed by claude/pin-theme-upstream-watch.

## Brief

**What.** Two things. (1) `docs/_config.yml` sets `remote_theme: just-the-docs/just-the-docs` with no ref, so every Jekyll build downloads the theme's default-branch HEAD. An upstream commit can turn this repo's docs build red with no commit of ours, and `docs/assets/js/docs-ui.js` MOVES the theme's own search markup (binding `.search`, `#search-input`, `.search-label`), so an upstream rename degrades a shipped feature silently. (2) Pinning creates a new obligation — somebody has to notice the pin has gone stale and decide whether to move it. That is a process, and the owner asked for it as a reusable BPMN subprocess modelled on CRDM: watch -> impact analysis -> MVP -> review -> decide.

**What I already know, measured this session (2026-09-19).** `git ls-remote` + a blobless clone of just-the-docs: newest release is v0.12.0 (2026-01-23); the default branch is 61 commits past it (HEAD ba03257, 2026-09-15). Fingerprinted the LIVE site from `origin/gh-pages`: `assets/css/just-the-docs-dark.css` contains `outline-offset:-1px;text-wrap:balance`, and `text-wrap: balance` entered `_sass/navigation.scss` in upstream 2e1f449 (2026-08-01, after v0.12.0) and is in no release. So the live site is rendering upstream main, not a release. Restricted to files that reach rendered output (`_sass`, `_includes`, `_layouts`, `assets`), v0.12.0..HEAD is exactly ONE line: that `text-wrap: balance`.

**Route.** Pin to `@v0.12.0` — the newest released tag at or below what is live — and state the one-declaration delta rather than jumping to a version nobody has run. Then author the subprocess as its own .bpmn invoked by callActivity, with its skill under skills/folio-core/, bound to roles that already exist in roles.json.

**What would falsify it.** If the live CSS had NOT carried a post-v0.12.0 marker, the live theme would be a release and the pin would be exact; if it carried a marker from a commit after some newer release, v0.12.0 would be the wrong floor. Both were checked. The residual risk the pin cannot remove: the compiled CSS is the only fingerprint I have, so a post-v0.12.0 upstream change that touches no rendered byte is invisible to it — which is exactly why the delta is stated as "one declaration in rendered output", not "no change".

**Not doing.** Not upgrading past v0.12.0 in this PR: that is the first job for the new process, not a side effect of pinning. Not opening a GitHub issue (AGENTS.md forbids it without the owner's permission).

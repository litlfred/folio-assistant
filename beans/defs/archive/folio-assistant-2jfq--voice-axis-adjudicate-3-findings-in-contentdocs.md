---
# folio-assistant-2jfq
title: 'Voice axis: adjudicate 3 voice-author-notes-pollution findings in content/docs'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:23:37Z
updated_at: 2026-09-18T23:55:14Z
---

The QA sweep over `content/docs/` flags 3 blocks on `voice-author-notes-pollution`
(severity `major`). Recorded in the block sidecars and visible on the site via
the `QA` icon; this bean is the adjudication.

**What the criterion tests:** no author-tracking content in prose — status banners, PR/commit refs, agent names, ISO dates.

**Context before judging.** This criterion was written for a *paper* folio and
carries no `profiles` scoping, so it runs on `content/docs/` as well — which is
documentation, where addressing the reader directly is the register the genre
uses. Three outcomes are all legitimate:

1. **The finding stands** — change the prose.
2. **The criterion should be scoped** — add `profiles: ["paper"]` to it in
   `content/pipeline/qa-criteria-registry.ts`, and the finding disappears for
   every document folio rather than one block at a time.
3. **The finding is right but the block is an exception** — record an agent or
   human reviewer entry on the sidecar saying why, which outranks the script
   entry without editing the prose.

Reviewing skill: `voice-editorial-review` (`skills/folio-core/`), the
human/agent half of this axis; the mechanical half is `qa-checkers-voice.ts`.

## Findings

- [ ] `content/docs/guides-writing-a-paper/before-you-start.md`
      content/docs/guides-writing-a-paper/before-you-start.md:4: P3:agent-name: (Claude Code, Antigravity, …) so the agent has the MCP tools.
- [ ] `content/docs/guides-writing-a-paper/where-to-go-deeper.md`
      content/docs/guides-writing-a-paper/where-to-go-deeper.md:9: P1:status-banner: > **Note on the screenshots.** The images above are *mockups* illustrating the
- [ ] `content/docs/publication-workflow/every-workflow-in-the-repo.md`
      content/docs/publication-workflow/every-workflow-in-the-repo.md:3: P4:date-ref: (counted on 'main', 2026-09-18 — this line said "six" for long enough that it is

## Done when

Every box above is either fixed in prose, covered by a criterion-scoping
change, or carries a reviewer entry on its sidecar explaining the exception —
and `bun run content/pipeline/qa-sweep.ts --root content/docs` reflects it.

_2026-09-18T23:55:14Z_ — ## Summary of Changes

All 3 resolved as agent `pass`. P3 on `before-you-start.md` — the harnesses ARE the content of a prerequisites step. P1 on `where-to-go-deeper.md` — suppressing 'the images above are mockups' would misrepresent them, and AGENTS.md makes the same call with '`## Not verified` is a real section and an honest one'. P4 on `every-workflow-in-the-repo.md` — the BASELINE rule REQUIRES a measured count to carry its date, so the criterion was flagging compliance with another rule; that one wins.

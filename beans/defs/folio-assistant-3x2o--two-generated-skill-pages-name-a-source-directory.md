---
# folio-assistant-3x2o
title: Two generated skill pages name a source directory that does not exist — the oe98 banner bug recurs for remote stubs
status: in-progress
type: task
priority: normal
created_at: 2026-09-26T10:44:49Z
updated_at: 2026-09-27T05:30:59Z
parent: folio-assistant-ahvw
---

Found 2026-09-26 while verifying `hloc`'s link rewriting — by checking that
every rewritten link points at something that EXISTS, which also swept the
links the generator already composed.

## The measurement

`cat-harness/docs/reference/skill-instructions/fhir-client-operations.md` and
`smart-launch.md` each open with:

    > Generated from [`cat-harness/skills/remote-stubs/<name>.md`](
    >   https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/remote-stubs/<name>.md)
    >   — do not edit here.
    > [✎ Edit this page's source](.../edit/main/cat-harness/skills/remote-stubs/<name>.md)

`cat-harness/skills/remote-stubs/` **does not exist**. Both files really live at

    fhir-harness/skills/fhir-client/<name>.md

— a different INSTANCE in the same repository. So the banner names the wrong
directory, and both the "Generated from" and the "Edit this page's source"
links 404.

## Why it is the `oe98` shape

`oe98` was exactly this: source and edit links COMPOSED from a prefix rather
than resolved, so 240 of 244 pages linked a path that did not exist. It was
fixed by routing through `repoRelative`, which resolves against the repository
root and returns `undefined` rather than normalising something outside it.

This is the case that fix did not cover: a group whose declared directory and
whose files' actual location differ, because the skills are served as REMOTE
STUBS from another instance. `repoRelative` is doing its job — it is being
handed the group's nominal directory, not the file's real one.

## Why it was invisible

The pages publish, render and read correctly. Only the two provenance links are
wrong, and a provenance link is the one thing on a generated page nobody
clicks until they want to change something — at which point they get a 404 and
no indication of where the real source is. `check:subgraphs` does not see it
either: these are absolute `https://github.com/...` URLs, not repo-relative
links, so they are outside what that sweep resolves.

## Done when

[ ] The banner names the file's REAL location, resolved the way `repoRelative`
    resolves everything else — not the group's nominal directory.
[ ] Decided and stated: what the banner should say when the real source is in
    a DIFFERENT instance of this repository, versus in a sibling checkout that
    has no path here at all. Those are two cases and `repoRelative` already
    distinguishes them by returning `undefined` for the second.
[ ] Verified by BREAKING it — point a group at a directory whose files live
    elsewhere and confirm the check goes red. The current state produces a
    valid-looking URL, so only following it reveals the defect.
[ ] A guard exists, because nothing today checks that a composed GitHub URL
    resolves. Two pages were wrong for an unknown length of time and the only
    reason anyone noticed is that an unrelated verification swept them.

## Not in scope

`hloc`, which is about links in skill BODIES and is a different composer.
Whether `skills/remote-packages` should be synced at all — bean `wlqd`.

_2026-09-26T20:02:44Z_ — Claimed by claude/3x2o-remote-stub-banner — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## 2026-09-27 — the diagnosis in this bean is wrong; PR #1437

https://github.com/litlfred/folio-assistant/pull/1437

**Not mis-composed banners. ORPHANS.** The two pages were generated from
`cat-harness/skills/remote-stubs/`, retired at #556, and survived its deletion
as pages no source produces -- 280 committed against 278 produced. Proved by
deleting one and regenerating: it did not come back.

What the site therefore served, for a skill this repository DOES implement at
`fhir-harness/skills/fhir-client/`: *"This skill is declared, not implemented
here. Do not follow it as guidance; there is none to follow."*

**Cause: a missing DECLARATION, not a generator bug.** `gen-skill-docs` calls
`kgDirectories(INSTANCE_ROOT)` -- the root instance's declaration only -- so a
sibling instance's skills reach the site only if `cat-harness/cat-harness.json`
declares their directory. Three already do (`folio-assistant-core-skills`,
`large-datasets-skills`, `who-iris-skills`); `large-datasets-skills`' own
description states the reason. `fhir-harness` never did, so all six of its
skills published nowhere: two as stale orphans under the retired stubs' names,
and all four of `fhir-harness/skills/fhir-ig-base/` not at all -- while
`dak-preprocessing` and two other pages link `ig-render-jekyll` by name.

## What I got wrong, and what caught it

Measuring every in-repo instance root found ELEVEN reachable-but-unpublished
skill bodies, not two: fhir-harness's four plus bootstrap's seven. I declared
`bootstrap/skills/` too, and was wrong to.

**Bean `pve3`, 2026-09-21 -- "both halves or neither", and the owner's answer
was NEITHER.** The root carrying bootstrap's skills without its process minted
three dangling `bindsLane` links and the `v3se` collision; carrying both would
undo #432's isolation. Bootstrap's skills publish through `bootstrap.jsonld`
alone, so their absence from this site is the DECISION, not a gap. Three
existing tests state it and all three failed -- `tools.test.ts`'s deliberately
INVERTED `expect(s.has("confirm-harness")).toBe(false)`, and
`kg-export.test.ts`'s *a Tool satisfying a sibling's skill links into the
SIBLING's document*, where `#tool/discuss` stopped pointing into bootstrap's
document the moment this instance claimed the skill. Reverted.

**The lure was a dead key.** `SKILLS_CATEGORIES` carried
`"bootstrap": "CatBootstrap (read before anything else is known)"`, reaching
nothing since `pve3`. `discoverGroups` throws on an id with no heading and never
on a heading with no id, so a stale heading is unfalsifiable from that file and
reads as an unfinished job. REMOVED rather than rekeyed, replaced by a comment
recording the ruling and this reversal.

## Done

- One declaration: `fhir-ig-skills` -> `fhir-harness/skills/`, same id
  `fhir-harness.json` uses.
- Two category headings, `fhir-ig-base` and `fhir-client`.
- `reportOrphans`: `--check` was STRUCTURALLY blind here, because `emit`
  compares content per path and a page nothing produces is never compared.
  Reports and never deletes -- an orphan has two opposite causes (skill gone,
  or directory no longer declared) and this cannot tell them apart; the second
  is what happened, and `rm` would have destroyed the only trace.
- Falsified by deleting the declaration: six named orphans, exactly the pages it
  reaches. It then caught its own author -- reverting the bootstrap half made it
  name all seven pages at once.
- Full `bun run gates`: 166 gates, 0 failed. The 72 provenance sidecars
  `bun test` rewrites reproduce identically on pristine `origin/main` (measured
  in a detached worktree), so that tree-guard note is base, not this branch --
  and committing them would downgrade the recorded `engine_version` from
  `bun-1.3.14` to this container's `bun-1.3.11`.
- 278 pages produced -> 281. `dak-preprocessing`, `session-context` and
  `smart-stack-layering` now link `ig-render-jekyll` and siblings as published
  pages rather than GitHub blob URLs.

## Note to self

Earlier in this turn I ran `git checkout -- beans/defs ...` to clear the tree
after a gates run and discarded an earlier version of this note. A bean is a
durable artefact; a blanket `checkout --` over a declared graph is exactly the
move `deletion-requires-confirmation` exists to stop. Restore by path, or
`git stash`, not by directory.

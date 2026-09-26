---
# folio-assistant-3x2o
title: Two generated skill pages name a source directory that does not exist — the oe98 banner bug recurs for remote stubs
status: todo
type: task
priority: normal
created_at: 2026-09-26T10:44:49Z
updated_at: 2026-09-26T10:45:07Z
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

---
# folio-assistant-glwk
title: 'DECLARE: .harness/ is committed graph content no harness.json mentions'
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:46:56Z
updated_at: 2026-09-20T06:55:57Z
parent: folio-assistant-zzmr
---

The owner, 2026-09-20: *"why .harness? what's in it?"* and *"either content or
state"*.

## What was in it — two things, at two layers

| | | layer |
|---|---|---|
| `interaction.json` | how a PERSON wants to be asked. Read at session start by every agent; changes when a person states a preference | **context** |
| `issue-comments/*.json` | how far an agent has read an issue: `lastCommentId`, `lastUpdatedAt`, `checkedAt`. A process writes one each time it checks | **state** |

Neither is content. One is read and never written by a process; the other is
written as a process runs. **They were in one undeclared dot-directory because
nobody finished the 2026-09-18 job**, when `.beans/` and `.harness/workflow/`
moved out (beans `8xzw`, `x89g`). `.harness/` was the residue.

## Why "declare it where it is" was never an option

This repository's **own dot-prefix guard rejects a dot-prefixed segment**, and
checks every segment rather than the head. So the file read at the start of
every session sat in the one place the conventions forbid, and the
`directory-conventions` reasoning applies verbatim: a dot-prefixed directory is
absent from a plain `ls`, from most file browsers and from a forge's web tree.

## Summary of Changes

- `.harness/interaction.json` -> `interaction/interaction.json`, kind
  `interaction`, `holds: "context"`. `harness.config.json`'s `interaction` key
  defaults there, so the declaration and the config now name one place instead
  of one of them being a literal nobody checks.
- `.harness/issue-comments/` -> `issue-marks/`, kind `issue-marks`,
  `holds: "state"`. **Renamed for what it holds**: an id and two timestamps,
  never a comment body — and one of the two files here already said so in its
  own note ("the mark records only that the newest was seen"). A directory
  named for the comments promises a reader something the store does not have.
- Every file gained a `$schema` tag. Files declare what they are (#263);
  before this they were identifiable only by the directory they sat in, which
  is precisely what the tag exists to replace.
- `.harness/` is gone.
- Both kinds registered with avatars, both declared, both in the
  `directory-conventions` table. 18 references updated across code, skills,
  docs, e2e tests and the session-start sweep; `scan-repo-content`'s skip-list
  now names them rather than relying on a dot-prefix that no longer exists.

## Done when

- [x] `interaction.json` classified and declared
- [x] `issue-comments/` classified, renamed for its contents, and declared
- [x] every file declares itself
- [x] `.harness/` no longer exists
- [x] 43 gates pass

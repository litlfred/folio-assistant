---
# folio-assistant-8eyy
$schema: bean/1.0.0
title: 'Lake cache extraction checks member paths but not member types'
status: todo
type: bug
priority: normal
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:01:56Z
updated_at: 2026-10-31T04:01:56Z
---

Found by the 2026-10-31 security and QA review of the folio-assistant layers (SOP: cat-harness `skills/conduct/security/`, the 16 rules of `skills/voices/secure-code-authoring/voice.json`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`). No fix PR yet: fixes wait for the owner's go-ahead.

**Category:** security · **Severity:** minor

folio-assistant-sci at `f0d44d9`. Security SOP boundary 'an archive to a filesystem': a LINK member writes through to its target, which `..` refusal does not cover; the remedy is a member-TYPE whitelist (`tar tvzf`, accept only `-` and `d`), as cat-harness-tools does at its one call site (`tar-member-guard.test.ts`).

- `scripts/lake-cache-fetch.sh:227-250`: refuses absolute and `..` paths and anything outside `.lake/`, then `tar -xzf`. No type check, so a symlink member followed by a file through it is not refused.
- `scripts/lake-cache-fetch-multi.py:96-106`: `git archive ... .lake | tar -xC` with no check at all.
- `scripts/lake-cache.sh:531`: same, no check.

The source is an orphan cache branch that needs write access, so this is defence in depth.

## Done when

- [ ] All three extract only regular files and directories (type whitelist), with a test on an archive holding a symlink

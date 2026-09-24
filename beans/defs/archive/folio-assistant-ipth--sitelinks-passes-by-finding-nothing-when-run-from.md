---
# folio-assistant-ipth
title: site:links passes by finding nothing when run from the repo root
status: scrapped
type: task
priority: normal
created_at: 2026-09-20T07:26:06Z
updated_at: 2026-09-20T08:30:26Z
parent: folio-assistant-1xhc
---

## Reasons for Scrapping

**The finding was wrong, and the way it was wrong matters more than the bean.**

This bean claimed `bun run site:links` from the repository root "prints 'no
harness.json at …; nothing to resolve.' and **exits 0**", called it the `dh4f`
shape inside a script, and proposed making the no-declaration case an error.

Measured properly 2026-09-20:

    bun run site:links >/dev/null 2>&1; echo $?     # -> 2
    cd cat-harness && bun run scripts/site-links.ts # -> 0

`site-links.ts` already does `process.exit(2)` when `readDeclaration` returns
nothing, and its own comment records a previous round of getting that message
right. **There was never a defect here.** Nothing proposed in this bean should
be built.

## How the wrong claim was made

I ran `bun run site:links 2>&1 | tail -5`, read the message, and **never
checked `$?`**. A pipe makes `$?` the exit status of `tail`, so the command's
own verdict was discarded before I could see it — and a message that *sounds*
like a failure got recorded as a silent pass.

That is the SECOND time in this session. The first was `gen-site-jsonld
--check`, where `echo "exit=$?"` after a pipe printed 0 for a genuinely stale
tree; I caught that one within the minute, wrote "worth checking rather than
assuming" in the commit message, and then made the same mistake two hours
later on a different script.

The lesson is not "be careful". It is mechanical: **`| tail` discards the exit
code, so any claim about whether a command PASSED must come from a run without
a pipe.** Recorded in agent memory rather than only here, because a bean that
records a mistake is read by whoever opens the bean, and this one should reach
whoever runs the next command.

## What survives

Nothing from the proposed work. The one true sentence in the original bean —
that `site:links` is not in the local gate set — was answered separately: it is
declared `ci-only` in `STEP_EXEMPTIONS` under bean `j2w4`, because it takes
`--site ./_site` and resolves links in the BUILT site.

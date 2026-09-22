---
# folio-assistant-i9xp
title: beans update --body-file REPLACES the body silently; the skill named only the inline --body-append
status: completed
type: bug
priority: normal
created_at: 2026-09-22T06:53:49Z
updated_at: 2026-09-22T06:54:12Z
parent: folio-assistant-o3xy
---

_2026-09-22T07:00:00Z_ — FOUND BY BREAKING IT, 2026-09-22, while closing bean `gjli`. A four-paragraph closing note was too long to pass as an inline string, so I reached for `beans update <id> --body-file <f>`. It **replaced** the body: the owner's 2026-09-19 verbatim note ('ALL UI MUST FOLLOW ACCESSIBATILITY GUIDELIENS', stated in caps and load-bearing — it is what makes the rule STANDING rather than one task) and the 2026-09-19 measurement record both went. Exit 0. No warning, no diff, no prompt. Nothing in the output distinguishes it from an append, which is why it was noticed only because the tool's own confirmation echoed the file back.

CONFIRMED RATHER THAN INFERRED FROM THE ACCIDENT. A scratch store at `scratchpad/beantest`: a bean given `--body "FIRST NOTE"`, then `--body-append -` with two more paragraphs (all three present, appended in order, earlier text intact), then `--body-file` with a third note — and the first two were gone. So `--body-append -` is a working append-from-stdin path and `--body-file` is a replace. Both measured, neither assumed.

WHY THE SKILL DID NOT PREVENT IT. `todo-manager` named `--body-append` twice, both times as `--body-append "Your note"` — the INLINE form. An agent with four paragraphs to write does not want a shell-quoted string argument; it wants a file. `--body-file` is one letter's difference from `--body-append`, sits in the same `--help` block, and does something else. The skill described the flag that works for short notes and was silent about the long-note case, so it steered nobody at the moment the choice was made. `--body-append -` is what the long-note case needs and the skill did not say so.

FIXED IN THIS CHANGE: `todo-manager` §"Check before you UPDATE — `--body-file` REPLACES the body (STRICT)", placed immediately after §"Check before you create" because they are the same shape one flag apart — `create` is not idempotent, `update` is not additive, and both cost a durable artefact. It carries the four-flag table (only one appends), the heredoc form, the measurement above, the fact that the `_<ts>_ —` prefix is an authored convention no flag supplies, and the recovery.

RECOVERY, AND THE PART WORTH KEEPING. `git show HEAD:<bean-file>` returned the body as of the last commit and both notes were reassembled under the new front matter. Recovered from **git rather than from my own transcript**, though the transcript had it — a transcript is a copy I made and the repository is the artefact, and a reconstruction that prefers the copy cannot be checked by anyone else. The store being committed is the whole reason this was survivable; a session-local todo store would have lost the owner's own words with no way back. That is the argument for `beans/` being committed, arrived at the hard way.

RELATED, NOT THE SAME: bean `5wrg` records that `beans create` **rejects** `--body-file -` with a heredoc. So the two subcommands disagree about one flag name — `create` refuses stdin through it, `update` accepts a path through it and destroys with it. Neither behaviour is wrong on its own; together they make the flag a trap, which is one more reason the skill now says to reach for `--body-append` instead.

NOT DONE, and deliberately: no wrapper, no alias, no guard script. The tool is third-party ([hmans/beans](https://github.com/hmans/beans)) and wrapping a third-party CLI to make one flag safer puts this repo on the hook for every other flag it has, forever. The skill is the right layer. If this recurs after the skill says so, THAT is the evidence a guard is needed, and it does not exist yet.

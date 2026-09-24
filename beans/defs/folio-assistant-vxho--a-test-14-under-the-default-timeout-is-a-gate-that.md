---
# folio-assistant-vxho
title: A test 14% under the default timeout is a gate that fails on a busy machine, not a red one
status: todo
parent: folio-assistant-1xhc
type: task
created_at: 2026-09-24T12:19:24Z
updated_at: 2026-09-24T12:19:24Z
---

Recorded 2026-09-24 while running `bun run gates` on a two-markdown-file diff.

```
cat-harness/schemas/viz-generators.test.ts:
(fail) the readers agree with what the generators publish > a queue's
       declared intake is ONE unit, not one per file it carries [5683.71ms]
  ^ this test timed out after 5000ms.
```

**It is not a correctness failure and it was not the diff's.** The diff was two
bean markdown files. A re-run of the same tree gave `11228 pass, 0 fail`, and
the file alone passes in 1.52s.

**What makes it worth a bean rather than a shrug.** 5683ms against a 5000ms
default is not a race that happens once — it is a test whose *normal* runtime
is within a small factor of the limit, so whether the gate passes depends on
what else the machine is doing. That is the worst kind of red: it clears on
re-run, so it teaches everyone who meets it to re-run, and the rule here is
that flake is not a root cause.

**Why it is slow is the actual question**, and it should be measured before
anything is changed. The likely answer is that the test walks real repository
directories rather than a fixture, so it gets slower every time the repo grows
— which would mean the timeout is a symptom and raising it buys a few months.

## Done when

- [ ] the test's runtime is MEASURED, not estimated, and the cause of the 5.6s named
- [ ] if it walks the real tree, decide whether that is the point of the test or an accident of how it was written
- [ ] the gate no longer depends on machine load — by making the test fast, or by an explicitly-reasoned timeout, never by a bare number

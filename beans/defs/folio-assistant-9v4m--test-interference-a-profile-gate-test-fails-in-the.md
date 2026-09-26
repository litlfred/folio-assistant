---
# folio-assistant-9v4m
title: 'TEST INTERFERENCE: a profile-gate test fails in the full suite and passes in isolation on the same commit'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T03:40:20Z
updated_at: 2026-09-26T15:13:14Z
parent: folio-assistant-1swy
---

Measured 2026-09-26 on `985d0bada2a` (branch claude/brave-hypatia-r820sf, diff = two bean .md files only).

## What happened

`bun run gates` failed with ONE test failure:

    (fail) the sweep's profile gate, end to end > a paper-only criterion is n/a'd in a document folio, under its OWN outcome [5769.02ms]

The same test, by name, **passes in isolation** — both with the branch's changes applied and with them stashed. A second full `gates` run on the **same commit** was green, 152/152, 0 fail.

So it is not the branch's change (two markdown bean files cannot affect a profile gate), and it is not a broken test.

## The suspect, and why it is worth a look rather than a shrug

Adjacent in the same failing run:

    ✗ no-such-doc: no images.json at /tmp/8suc-eCDI0u/staging/no-such-doc/images.json

A **shared `/tmp/8suc-*` staging path**. Two tests appearing to race on one fixture directory is the obvious hypothesis; it is a hypothesis, not a measurement — nobody has confirmed which two.

## Why this is not 'a flake'

'Flake' names the observation, not the cause. The test body RAN and asserted; it did not die in checkout or install. A test whose verdict depends on what else is running is a gate that can fail an innocent PR and pass a guilty one, and it cost one full re-run cycle here.

Related class: `iumj` (e2e fixtures read the live QA corpus).

## Done when

- [ ] The two tests sharing the path are named, by reproducing the failure rather than by reading.
- [ ] Either the fixture path is made per-test, or the ordering dependency is removed.
- [ ] A run that reproduces the original failure is shown passing after the fix.


## The suspect is REFUTED — `/tmp/8suc-*` is not shared, and the `✗` line is a passing test's own output

Measured 2026-09-26, by reading the two call sites and the assertion that emits
the line. The bean labelled this a hypothesis rather than a measurement, which is
why it was cheap to kill; it would not have been cheap to chase.

**1. `/tmp/8suc-*` is unique per call, so no two tests can race on it.**
One place creates it — `cat-harness/scripts/tests/apply-image-verdicts.test.ts:48`:

    const root = mkdtempSync(join(tmpdir(), "8suc-"));

`mkdtempSync` appends six random characters and creates the directory
exclusively. `/tmp/8suc-eCDI0u` is one `fixture()` call's private directory, and
`fixture()` is called afresh in each test. The `8suc-` prefix is a **bean id in a
name**, not a shared location — which is exactly what made it look like one.

**2. The `✗ no-such-doc` line is the expected output of a test that PASSED.**
`apply-image-verdicts.test.ts:105-110`, the test *"a missing images.json is an
error — an arm did not run"*:

    expect(runStaging(join(f.root, "staging", "no-such-doc"), f.lib, false)).toBe(1);

It hands `apply-image-verdicts` a path that deliberately does not exist and
asserts the exit code is 1. The `✗ no-such-doc: no images.json at …` line is the
subject under test refusing, printed to stderr, on the path the test just made
up. A green assertion's diagnostic, not a symptom of anything.

**3. The failing test's own fixtures are unique too.**
`profile-scoping.test.ts:185` — `mkdtempSync(join(tmpdir(), \`profile-sweep-${contentType}-\`))`,
and :148 likewise. So the failing test shares no scaffold either.

### What this leaves — a named hypothesis, and it is NOT the same shape

The interference, if real, is not through the filesystem paths the tests create.
The remaining shared mutable resource is the one the failing test reaches into
deliberately: `sweepOutcomes` (`profile-scoping.test.ts:204`) spawns

    bun run <PLATFORM_ROOT>/content/pipeline/qa-sweep.ts <block>.ts --dry-run --json

with `cwd` set to the temp folio but the SWEEP resolved out of the **live
checkout**. So its verdict depends on the state of the live tree at the moment
the subprocess runs — and `bun test` mutates the live tree while it runs:
`ymsu` measures the detangle writer writing into `cat-harness/test/results/`
during the suite, and the new `gate-tree-guard` catches `bun test` doing exactly
that.

That is a hypothesis with a name, and it is falsifiable: run the failing test
while a writer is mid-flight, or pin the live tree and see the failure vanish.
It is recorded as a hypothesis because nobody has reproduced the failure yet —
the same discipline that kept the `8suc` lead cheap.

### The `Done when` clause is answered as stated, and is the wrong clause

*"The two tests sharing the path are named"* presupposes two tests share a path.
None do. Replaced rather than ticked, because ticking it would record a false
premise as settled.

### Done when — revised

- [x] the `/tmp/8suc-*` lead is resolved: **refuted**, both call sites use
      `mkdtempSync`, and the `✗` line belongs to a passing test
- [ ] the failure is REPRODUCED before any further cause is proposed. It has been
      seen once, in one full run, and a second full run on the same commit was
      green 152/152
- [ ] the live-tree hypothesis above is tested: does the profile gate's verdict
      depend on the state of `cat-harness/test/results/` at the moment its
      subprocess runs? MEASURED AFTER — either the failure reproduces with a
      writer mid-flight, or the hypothesis is refuted and recorded as such


## REPRODUCED, 2026-09-26 — two full gate runs, same tree, opposite verdicts

This bean's remaining clause was *"reproduce the flake"*. It reproduced on its
own, without being hunted, which is worth more than a hunt would have been: the
two runs below were done for an unrelated reason (checking a merge), so neither
was arranged to produce this.

| run | tree | `a paper-only criterion is n/a'd in a document folio, under its OWN outcome` |
|---|---|---|
| 1 | merge of `origin/main`, before my fixes | **fail** (6895.10ms) |
| 2 | same merge, plus fixes touching only `pot-for-pages.ts`, its test, `artefact-verification.json` and `.pot`/status artefacts | **pass** |

Nothing in run 2's diff is reachable from the profile gate. It reads the content
profile registry and a sweep fixture; it does not read a `.pot`, a translation
status page, or an artefact-verification declaration. So the change of verdict is
not attributable to the diff, and this is the same commit range giving both
answers.

### What this DOES and does not establish

Establishes: the test is intermittent on an unchanged subject, which is the
bean's title claim, and it had until now only ever been observed failing once.
Two observations with opposite results is the minimum evidence for
intermittency, and it is now in hand.

Does NOT establish the mechanism, and I am not guessing at one. The title says
TEST INTERFERENCE and that remains a hypothesis: the 6.9-second duration is
consistent with a test that does real work and so has real opportunity to race,
but a duration is not a cause. Note also that the earlier `/tmp/8suc-*` theory
was already REFUTED on this bean (`mkdtempSync` is unique per call), so the
shared-path mechanism is not available as the explanation.

### The instrument note that matters for the next attempt

Both runs were `bun run gates`, which runs `bun test` as one step among 162. So
each observation costs a full gate run, and the failing one gives no isolation.
Whoever picks this up should run the single test file in a loop instead — that is
cheap, and it is the measurement that can distinguish "races against a sibling in
the same process" from "races against something in the environment".

### Adds to "Done when"

- [x] the flake is observed both ways on one commit range — run 1 red, run 2
      green, diff unreachable from the subject
- [ ] the single test file is run in isolation N times and the failure rate is
      recorded. MEASURED AFTER: a number, with N, rather than "it is flaky"
- [ ] if it does NOT fail in isolation, that is the finding — it localises the
      cause to a sibling test in the same `bun test` process, which is the
      title's hypothesis finally tested rather than assumed


## ISOLATION MEASURED, same day — 12 of 12 pass alone, so the title's hypothesis now has evidence

`cat-harness/scripts/tests/profile-scoping.test.ts`, run on its own, twelve
consecutive times on the tree where `bun run gates` had just produced the
failure: **12 pass, 0 fail.**

That is the second clause above answered, and it answers it in the direction the
clause named as the informative one. The test does not fail alone. It failed
inside `bun test`, which runs it in ONE process with every other `*.test.ts` in
the repository. So the cause is not in this test's own logic and not in the
environment it reads — it is a sibling in the same process, which is what this
bean has claimed as TEST INTERFERENCE since it was opened and what it could not
support until now.

### Why 12 and not 3, and what the number is worth

The failure was seen once in two full-gate runs, so the per-run rate is somewhere
near 1/2 on the evidence available. Twelve clean runs under that prior is
worth having: if the isolated rate were the same 1/2, twelve passes would be a
1-in-4096 coincidence. It does not establish the isolated rate is ZERO — twelve
runs cannot — and nothing here should be quoted as "it never fails alone". What
it establishes is that the isolated rate is much lower than the in-suite rate,
which is the comparison the hypothesis turns on.

### What is now the shortest path, for whoever takes this

The subject is no longer "why does this test fail". It is **which sibling**. That
is a bisection over the test corpus rather than a study of this file, and it is
mechanical: `bun test` a growing subset containing `profile-scoping.test.ts`
until the failure appears. Recording it that way because the previous two
attempts on this bean both went looking at the failing test itself — the
`/tmp/8suc-*` shared-path theory, refuted, and the duration-as-cause reading,
never more than a suspicion.

### Adds to and closes clauses in "Done when"

- [x] the single test file is run in isolation N times and the failure rate is
      recorded — N = 12, 0 failures, against a roughly 1-in-2 in-suite rate
- [x] if it does NOT fail in isolation, that is the finding — it does not, and
      the cause is localised to a sibling test in the same `bun test` process
- [ ] the sibling is NAMED by bisecting the test corpus, not by inspecting
      `profile-scoping.test.ts`. MEASURED AFTER: a subset of test files that
      reproduces the failure and a proper subset of it that does not

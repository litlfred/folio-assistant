---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: completed
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T06:50:55Z
parent: folio-assistant-1xhc
---

Measured 2026-09-27 on pristine main `c6960465301`, and the same on 2026-09-26 at `8fb8a041a8e`.

## What happens

A full `bun test` rewrites all 72 files under `cat-harness/content/pipeline/script-sidecars/`, changing only three fields in each:

    last_run_at     wall-clock time of this run
    last_run_sha    the checked-out HEAD
    engine_version  the local bun (bun-1.3.11 here; the committed copies say bun-1.3.14)

Nothing else in the tree changes. The writer is `saveQaScriptSidecar` (`qa-utils.ts`), and its callers are `script-sweep.ts` and `qa-sweep.ts`.

## Why it matters

`bun run gates` has a tree-mutation detector, which is how bean `ymsu` was made visible. It therefore ends *'every gate passed, and the run is NOT clean — 1 gate(s) changed the tree'* with exit 1, on every branch, pristine main included. A signal that is always red is one people stop reading, and then it cannot report the next real in-run repair, which is the `ymsu` failure class this detector exists for. This is the same class as `ymsu` (in-progress, another session's), but a different writer, and `ymsu` does not mention these files.

## Not yet isolated

Run alone, none of these writes the sidecars: `qa-review`, `profile-conformance-axis`, `corpus-gate`, `check-command-paths`, `lean-ref-coverage`, `qa-checker-discovery`, `pipeline-resolution`, `qa-sweep-merge`, `qa-witness`, `qa-tools`, `usage-paths-self-reference`, `publish-block-qa`. The full suite always does. So it is either an untried file or an interaction between files.

## Done when

- [x] the test that triggers the write is named — `init-folio-qa.test.ts`, by bisection (below)
- [x] the volatile fields stop causing writes — `saveQaScriptSidecar` no longer counts `engine_version` as a change (owner chose this over a temp-root override for the test alone)
- [x] `bun run gates` ends clean — 167 of 167, exit 0, no tree mutation (measured on this branch, based on main)

_2026-09-27T05:19:35Z_ — Claimed by claude/sleepy-babbage-ls90iz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## `rmcf` is the same defect, filed a day earlier — and it holds four unanswered remedies

Cross-reference added by another session; **status untouched, this is not mine to
resolve.** `rmcf` (2026-09-26) records the identical churn: 72 files, the same three
fields, the same `bun-1.3.14` committed against `bun-1.3.11` local.

**This bean is the better record** — `rmcf` never named the writer, and it only saw
the churn on a branch, where this one measured pristine `main` at two commits. So
work this one.

What `rmcf` has that this does not is **four remedies put to the owner and still
unanswered**:

1. stop recording `engine_version` at all;
2. stamp only on a real change (the `script_hash` / `source_file` fields, which do
   **not** move — verified across all 72 on 2026-09-27);
3. move run provenance out of the committed sidecar entirely;
4. document the discard as intended behaviour.

Option 2 looked right to the session that filed `rmcf`, on the ground that the three
churning fields are provenance while the two stable ones are the measurement — so a
sidecar that stamped only on a real change would stop moving without losing anything
a reader uses.

One caution that belongs with the remedy, from `#1430`'s `sfjo` rule: **read what a
regeneration writes before committing it.** Committing this churn stamps a
*downgrade* — `engine_version` goes backwards whenever the local bun is older than
main's — as though it were a fresh measurement. That is why the standing practice has
been to discard rather than commit, and why option 4 is not merely a cop-out: it at
least makes the discard deliberate.


## Independent confirmation from a SECOND container, 2026-09-27

Measured on the session branch `claude/3x2o-remote-stub-banner` while
establishing whether the tree-guard finding on PR #1437 was that branch's: a
detached `git worktree` of pristine `origin/main` at `81586293ea5`, full
`bun test`, then `git status`. **72 paths, exactly the ones above**, with
`bun-1.3.11` locally against the committed `bun-1.3.14`, and `script_hash`
unchanged throughout.

Recorded only as evidence that the shape is not container-local. The reading
that went with it -- that the fix had to be on the writer side rather than a
pin -- is **superseded by the entry below**, which is later and has the part
this measurement lacked: `saveQaScriptSidecar` already skips the write unless a
substantive field changes, so `engine_version` was the whole cause and pinning
it is the cause-level fix.

---

## 2026-09-27 — the CAUSE is pinned. Not closed, and the reason is precise.

The owner chose "pin the runtime" from a set of options. Landed: `.bun-version`
holding `1.3.14`, all **22** `oven-sh/setup-bun@v2` sites across 12 workflow
files carrying that literal explicitly (18 said `latest`; **four said nothing at
all** and took the action's default), a `bun` row in `upstream-pins.json`, and
`check:bun-pin` asserting the 22 agree with the file.

### What this bean was missing, and it is the reason a pin is the cause-level fix

This entry lists three volatile fields — `last_run_at`, `last_run_sha`,
`engine_version` — as though all three had to be dealt with. They do not.
`saveQaScriptSidecar` **skips the write entirely** unless a SUBSTANTIVE field
moved, and its own docblock records that guard being added for this exact churn
("76 modified files after one qou run, none of them a real change"). The two
`last_run_*` fields are excluded from that comparison. `engine_version` is not —
correctly, since a verdict produced by a different engine is a different verdict.

So `engine_version` is the only field that was ever *causing* a write, and the
other two were passengers. Remove the difference and all three stop moving. That
also means the bean's own remedy — "it writes into a temp directory" — would
have treated a symptom.

### The measurement that shifts the blame off agents

Upstream Bun's newest release is **`bun-v1.4.2`** (`git ls-remote`, 241
`bun-vX.Y.Z` tags). CI ran `bun-version: latest`, so **CI itself would have
rewritten all 86 sidecars to `bun-1.4.2` on its next sweep**, whatever any agent
did. The 86 already held two values — 72 at `bun-1.3.14`, 14 at `bun-1.3.11` —
so the committed record was mixed before any of this.

And that is where the `72` in this bean's title comes from: it is not a blast
radius, it is the count of sidecars NOT already at the local Bun (1.3.11 in this
container). A container at 1.3.14 would see 14 move instead.

### One defect found in the machinery while using it

`upstream-pins.json` could not express Bun at all. `assessPin` compared the pin
literal to the tag list with `rel.includes(pinned)`, and `setup-bun` takes
`1.3.14` while upstream tags `bun-v1.3.14` — so the verdict was `unknown`, which
sets exit 2, which would have made the weekly watchdog report itself **blind
forever**. That is its documented failure mode pointing the other way: not
claiming health while blind, but crying blind while healthy, which trains a
reader to stop looking.

Fixed with an optional `PinDef.tagPrefix`, compared on the tag form while every
message still reports the literal a reader will find in `pinnedIn`. The existing
`just-the-docs` pin has no prefix and its 15 tests pass unchanged. The checker now
reports `▲ Bun runtime | 1.3.14 | bun-v1.4.2 | behind` — which is the machinery
working: `behind` maintains the tracking issue and only `unknown` fails the job,
and `check:upstream-pins` is deliberately NOT a step in `code-quality-gates.yml`,
so a behind pin does not redden CI.

### Why the boxes are still unticked

- **"the test (or interaction) that triggers the write is named"** — still not
  named. The pin makes it not matter in CI; it does not identify the caller.
- **"it writes into a temp directory, or the three volatile fields stop being
  committed"** — neither. The fields stay, and the difference that made them move
  is gone instead.
- **"`bun run gates` on pristine main ends clean, not 'NOT clean'"** — **in CI,
  yes**, once CI runs 1.3.14. **In an agent container whose Bun differs, no.**
  This container runs 1.3.11, so `bun test` here still rewrites 72 files. The pin
  cannot reach a container image the repository does not control.

So the always-red signal is fixed where CI observes it and survives where agents
observe it, and agents are who reported it. Stating that rather than ticking the
box.

### The version is a judgement, and it is the owner's

`1.3.14` is the version the repository's own artefacts were produced with — the
status quo made explicit, requiring no mass regeneration. The alternative is
`1.3.11`: it would make BOTH CI and today's agent containers clean, at the cost
of one commit regenerating 72 sidecars and of pinning an older patch than the
artefacts record. Pinning `1.4.2` is not on the table here at all — that is
ADOPTION, and `processes/upstream-version-adoption.bpmn` makes the accepting step
a `bpmn:userTask` in a person-only lane.

Put to the owner as a follow-up rather than decided here.


---

## Duplicate found on merge: `rmcf` is the same defect

Merging `origin/main` brought in bean `rmcf` — *"72 script sidecars churn on
every gates run because engine_version records the CONTAINER, and it went
1.3.14 -> 1.3.11"* — opened by another session with the **same measurement**:
72 files, the same three changed fields, the same two engine values.

Not deleted and not merged. Neither is wrong, and a scrapped or deleted bean
stops a sibling reconstructing the reasoning. This one holds the claim and the
fix (the Bun pin, `check:bun-pin`, and `PinDef.tagPrefix`), so `rmcf` carries a
pointer here rather than the reverse.

Worth noting that THREE beans reached this population independently within a
day — `3ozg`, `rmcf`, and `ymsu` for a different defect over the same files.
That is not three people being careless; it is what an always-red signal does:
every session that runs `bun run gates` on a clean tree sees it, and nothing
told them it was already written down.

## Named, 2026-09-27: `init-folio-qa.test.ts`, and why

Bisection over `cat-harness/scripts/tests/` (432 files, 9 halvings) ends at one file, and that file alone reproduces all 72 rewrites. Its second test, *"swept from the repository root, as CI does, a subfolder folio's verdicts land at ITS root"*, spawns the real `qa-sweep.ts` against a throwaway folio in a temp directory.

The sweep then saves every script sidecar under its **own** `REPO_ROOT` (`qa-sweep.ts` near line 745, `saveQaScriptSidecar(sidecar, REPO_ROOT)`), which is the platform checkout, whatever it swept. The code comment says this is deliberate: those sidecars describe the platform's own checker scripts. So a sweep of **any** folio, including a test fixture, restamps the platform's committed sidecars with the current time, HEAD and bun version.

That is why none of the other candidates wrote them alone: this is the one test that runs a real sweep rather than a helper.


## Summary of Changes

The cause was already half-fixed: `saveQaScriptSidecar` skipped a write when nothing substantive changed. But it counted `engine_version` as substantive, and the committed sidecars carry CI's `bun-1.3.14`, so any run under another bun rewrote all 72. `init-folio-qa.test.ts` performs a real sweep, which is how `bun test` came to do it.

- `engine_version` is dropped from the comparison, together with the two `last_run_*` fields. All three describe the run rather than the checker, and no reader uses a script sidecar's `engine_version` for freshness.
- The test that asserted *"DOES rewrite when the engine version changes"* now asserts the opposite, and its comment says why the reversal was made. A new test checks that a real content change still records the engine it ran under.
- Verified: the sidecar tests pass 9/9; `init-folio-qa.test.ts` now leaves 0 sidecars changed; and `bun run gates` passes 167/167 and ends clean, which it has not done on any branch while this bean was open.

**This implements `rmcf`'s option 2** (stamp only on a real change), on the owner's choice of "skip no-op writes" put to them in this session. It was built before the cross-reference above was seen, and arrived at the same remedy independently. `rmcf`'s option 1 (stop recording `engine_version`) is NOT taken: the field is still written whenever a real change writes, so a reader still sees the engine of the last content change. The `sfjo` caution holds too: this fix means there is no churn left to commit or discard.

## Combined with #1442's pin, 2026-09-27 — owner's choice "keep both"

#1442 pinned Bun to 1.3.14, which makes CI consistent, and left this bean open for the residual: *"This container runs 1.3.11, so `bun test` here still rewrites 72 files. The pin cannot reach a container image the repository does not control."* The write-skip change above closes that residual. The owner chose to keep both: the pin makes the recorded engine consistent where the repository controls it, and the skip stops a run under any other engine from rewriting files whose checker did not change.

On #1442's reason for keeping `engine_version` substantive (*"a verdict produced by a different engine is a different verdict"*): script sidecars hold no verdicts. Verdicts live in block sidecars, and nothing reads a script sidecar's `engine_version` for freshness; `entryIsFresh` compares hashes. So the field now records the engine of the last real checker change, and the two changes do not conflict.

---

## 2026-09-27 — the owner asked where this belongs. It is a SKILL, and now it is one.

*"3ozg, that should be in tools/skills, no? how resolve?"* — two halves, and the
answers went in opposite directions.

**The `tools` half: the premise was wrong, and I was the one who made it wrong.**
`@covers` names the graph kind a gate **audits**, and `cat-harness/tools/` holds
Tool definitions. `check:bun-pin` and `check:red-gate-is-last` read
`.github/workflows/`, which is not a declared graph kind at all — the three gates
already doing exactly that (`check-ci-invocations`, `check-workflow-policy`,
`check-workflow-script-paths`) say `@covers none` with that reason in as many
words, and I had declared `tools` on both of mine without looking. The committed
`audit-coverage.qa-results.json` therefore attributed the `tools` kind to **five**
gates when three audit it — a false claim in the one artefact whose stated design
is that the gate half is *declared* so the number is a verdict rather than an
upper bound (`3srh`). Corrected in #1450; the row now reads three.

**The `skills` half: yes, and this is the resolution.** What survived the pin was
never code, it was a *reading rule* — and it was living in my check-in prompts and
commit messages, which is to say nowhere a next session looks. New skill
[`gate-tree-mutation`](../../cat-harness/skills/folio-core/gate-tree-mutation.md),
carried by the `authoring-agent` role, `platform-gates` pointing at it:

- `NOT clean` is a verdict about the **run**, not the diff — the gates after a
  mutation were handed a repaired tree (`ymsu`, 152 of 152).
- Two causes, told apart by `git status --short`: a missed regeneration, or a
  container whose Bun differs from `.bun-version`.
- The second is **discarded, never committed**, because it stamps a *downgrade*
  as a fresh measurement — `sfjo` applied to a regeneration that is faithful and
  still wrong to keep.
- The count is a fact about your container: 86 sidecars, 72 at `bun-1.3.14`, 14
  at `bun-1.3.11`, and what moves is whichever set disagrees with you. **This
  bean's title says 72 and that is not a constant.**

### Why it is a separate skill rather than a section in `platform-gates`

Because the first attempt WAS a section, and `kg:audit` refused it: 82 lines took
`platform-gates.md` from 334 to 416, past p90 (391), flipping
`skill-not-a-document` from `pass` to a `major` fail — *"at that length it is a
document, and an agent that skims it follows the part it happened to read."* Read
before committing, per `sfjo`, and reverted rather than pushed. The criterion was
right: the subject is distinct (how to read a run's cleanliness verdict, not which
gates to run), so it got a name findable by `skill_fetch`. 134 lines, 4 pass / 0
fail, and `platform-gates` keeps a 20-line pointer.

### The three boxes are still unticked, and this does not tick them

Nothing here names the triggering test, nothing moves the write to a temp
directory, and `bun run gates` in this container still rewrites 72 files. What
changed is that a session that sees it now finds it written down instead of
filing it a fourth time.

### Correction to the section above, after merging #1452 — 2026-09-27

Two claims in my own entry are now false, and one was never right. Correcting
rather than editing, because the reasoning is what a next session reads.

**False now, fixed by #1452:** *"nothing here names the triggering test"* — it is
`init-folio-qa.test.ts`, bisected over 432 files, and the entry above this one
says so. And *"`bun run gates` in this container still rewrites 72 files"* — it
does not; `engine_version` no longer counts as substantive.

**Never right:** my justification for keeping it substantive, carried into #1442,
was *"a verdict produced by a different engine is a different verdict"*. True, and
about a different artefact. A **script** sidecar holds no verdict — source file,
hashes, dependencies. Verdicts live in block sidecars. Verified independently
before accepting it: `entryIsFresh` compares `field_hash` and the script hashes,
and `engine_version` appears nowhere else in `qa-utils.ts`. So there was no
reader, and the field was provenance the whole time.

**The skill was revised, not merged as written.** `gate-tree-mutation` now carries
the general rule rather than this container's symptom:

> Does this field describe the SUBJECT the artefact is about, or the RUN that
> produced it? Only the first is a reason to write.

`3ozg` is its worked example, marked fixed, with both halves (#1442's pin, #1452's
skip) and what each one answers. Discarding a churn is documented as a
**workaround whose habit is the defect** — three filings in one day is what
discard-and-move-on produced — rather than as the standing practice my first draft
made it.

Not reopening: the boxes are closed on evidence I did not produce, which is
`bean-coordination`'s rule working as intended.

---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: in-progress
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T06:17:38Z
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

- [ ] the test (or interaction) that triggers the write is named
- [ ] it writes into a temp directory, as the profile-conformance tests do, or the three volatile fields stop being committed
- [ ] `bun run gates` on pristine main ends clean, not 'NOT clean'

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
---

## A second way the discard fails — and its own recommendation is RETRACTED

Appended from `claude/brave-hypatia-r820sf`, 2026-09-27, after the pin above had
landed as #1442. Status untouched: this is evidence, not a claim on the bean.

**The recommendation this note originally carried was wrong, and it is left named
rather than deleted.** It read: *"this strengthens remedies 2 and 3 over 4"* —
stamp only on a real change, or move run provenance out of the committed file. Both
were put to the owner from this branch before the pin was visible here, and the
measurement above refutes them:

- **Remedy 2 already exists.** `saveQaScriptSidecar`'s write-skip guard
  (`qa-utils.ts:1769`) is exactly "stamp only on a real change" — read directly,
  not taken on trust. It compares `source_file`, `script_hash`,
  `script_commit_sha`, `deps_hash`, `engine_version` and `extra_inputs`, and
  returns without writing when all agree.
- **`last_run_at` and `last_run_sha` are PASSENGERS, never causes.** The guard
  deliberately excludes them, and its own comment says so: *"Everything except the
  two `last_run_*` fields is content-derived, so comparing on those alone is the
  right test."* So moving them out of the committed file — remedy 3 — would change
  nothing about the churn.
- Moving `engine_version` out would be worse than a no-op: it is the one field the
  guard needs in order to notice that a different engine produced the sidecar.

So the pin is cause-level and the two remedies this branch argued for were
symptom-level. The one fact I had that the bean did not — 86 committed sidecars, 72
at `bun-1.3.14` and 14 at `bun-1.3.11` — also has a better explanation above than
the one offered with it. I inferred *"the churn has been committed at least once
before, partially"*; the sufficient explanation is that the write-skip guard
compares `engine_version`, so the 14 already matching the local Bun are skipped and
the 72 are not. **72 is the count not already at the local engine, not a blast
radius.** My extra hypothesis was never needed and was not established.

### What survives, because it is independent of the remedy

Remedy 4 — *"always discarded locally"* — relies on the agent being able to SEE the
churn at the moment it commits, and there is a timing window where it cannot:

1. `bun run gates` is started in the BACKGROUND while other work continues.
2. `git status --porcelain` is checked — clean, because the run has not reached the
   writer yet.
3. The run reaches `saveQaScriptSidecar` and rewrites the sidecars.
4. `git add -A` sweeps them into a commit about something else.

Measured here: 72 sidecars entered a commit about `check:anchor-names`, caught and
amended before any push. What nearly hid it is the inspection idiom itself —

    git status --porcelain | grep -v 'script-sidecars'

— the filter that makes the churn tolerable day to day is the same filter that
hides it at the moment it matters, and it is the pipeline remedy 4 invites. The
same run was contaminated a second way: committing a file while gates was live made
the detector report `bun run lint` as having "reverted" a path, attributing an
agent's own commit to a gate.

This is an argument for the pin reaching agent containers too — the open question
in *"the version is a judgement"* above — rather than for either retracted remedy.
While an agent container's Bun differs from `.bun-version`, step 2 keeps lying, and
no amount of documenting the discard closes that window.


## The local guard the owner chose — landed 2026-09-27 (`claude/brave-hypatia-r820sf`)

Status untouched. The owner was given the residual question above — the pin cannot
reach an agent container — with four options, and chose **keep `1.3.14`, add a local
guard**: a check that says the running Bun differs from the pin, so an agent is told
at session start instead of finding out in a diff.

`bun run check:bun-runtime`, and a `## Bun runtime vs the pin` section in
`session-start-coord-sweep.sh`. On this container it prints, derived from the corpus
rather than quoted from this bean:

    This container runs Bun 1.3.11; .bun-version pins 1.3.14.
    bun test and bun run gates will rewrite 72 of 86 committed script sidecars here

**It is deliberately NOT a gate**, and the reason is the one that made the churn
worth fixing. `check:bun-pin` asks a question about the CORPUS — do the 22
`setup-bun` sites agree with `.bun-version`? — which every checkout answers
identically, so it is gateable. This asks about the ENVIRONMENT, and no commit can
change the answer. A gate failing on a fact about the machine would go red in every
agent container while every reviewer read it as a verdict on the diff: a second
always-red signal, which is what #1442 existed to remove.

Three states, `cannot-tell` exiting 2 rather than 0 — no pin, an unparseable pin, or
no Bun to ask are all *unknown*, never *matched*.

**One detail decided whether this worked at all.** A sidecar records
`engine_version: "bun-1.3.14"` while `.bun-version` holds the bare `1.3.14`.
Compared directly they never match, so a naive version would report every sidecar
due for a rewrite in every container including a correctly-matched one — firing
always, and therefore meaning nothing. That is the same shape as the
`PinDef.tagPrefix` defect #1442 found in the pin machinery while using it, so the
prefix is a named constant with its own test rather than an inline template.

11 tests, each BUILDING the state rather than describing it, because this check's
interesting states are unreachable by pointing it at this repository: in CI it always
matches and in an agent container it always mismatches.

### What this does and does not close

It closes the window in remedy 4 that no `git status` could: the agent is told before
step 1, not asked to notice between steps 2 and 4. It does **not** stop the churn —
72 files still move on every sweep here — so `bun run gates` is still locally 'NOT
clean' and the boxes above stay unticked. Repinning to `1.3.11` remains the option
that would make both CI and agent containers clean; it was declined in favour of
keeping the artefacts' own engine, and that is recorded rather than re-argued.

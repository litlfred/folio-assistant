---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: in-progress
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T06:34:30Z
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

## Done-when 1 has no test to name — 2026-09-27, from a different session

`[ ] the test (or interaction) that triggers the write is named`

**There is no such test.** The trigger is the `engine_version` term in
`saveQaScriptSidecar`'s write-skip guard plus an off-pin engine. That was
already implicit in `df579167c71`'s own analysis; it is stated here because the
Done-when list still asks for a test and the next agent will go looking.

I went looking. Bisecting `bun test` by directory, resetting the sidecars
between each:

    cat-harness/schemas      dirty=0
    cat-harness/src          dirty=0
    cat-harness/test         dirty=0
    cat-harness/adapters     dirty=0
    folio-assistant-core     dirty=0
    who-iris                 dirty=0
    large-datasets           dirty=0
    smart-trust              dirty=0

which narrows it to `cat-harness/scripts/tests/` — 435 files — and would never
have terminated, because the cause is not in any of them. Reading
`.bun-version`'s git log took one command and answered it.

## What made the hunt possible, and it is now fixed

`qa-utils.ts` justified the guard with *"Everything except the two
`last_run_*` fields is content-derived, so comparing on those alone is the
right test."* That sentence rules the environment out **by construction**, so
both `rmcf` and this bean concluded a test must be doing it. PR #1451 corrects
it in place — not by deleting it, since deleting leaves the term unexplained and
re-opens the DROP-the-field fix the owner already rejected.

## The residue, measured, and I cannot fix it here

The pin is 1.3.14 and CI runs it. The committed corpus does not agree with it:

    72 sidecars   engine_version: bun-1.3.14
    14 sidecars   engine_version: bun-1.3.11   <- pre-pin residue

The 14: detangler-archimedean-wall, framework-canonical, proof-compile-cost,
proof-no-cost-regression, proof-no-placeholder-stub, q-usage-archimedean-in-
categorical-chapter, q-usage-fixed-q0-leak, q-usage-modulus-vs-real-mismatch,
q-usage-narrative-chapter-mismatch, q-usage-positivity-implicit,
q-usage-regime-detected, q-usage-root-of-unity-undeclared, wall-base-ring-minimal,
wall-side-correct.

They need one `qa:sweep` on a machine at the pin. **This container is at 1.3.11**
and installing 1.3.14 is refused by the environment's network policy (403 from
the proxy on `bun.sh/install`), so I cannot produce them. Hand-writing
`bun-1.3.14` into them would assert that an engine which never ran produced the
measurement — a worse defect than the one it tidies, and precisely the
`sfjo` caution recorded above (*read what a regeneration writes before
committing it*).

## And nothing checks it, which is the gap worth a decision

`check:bun-pin` verifies that **22 workflow sites** agree with `.bun-version`.
Nothing verifies that the **86 sidecars** do. So the 14 are invisible to every
gate: `1xhc` again — a disagreement no check can see is indistinguishable from
agreement.

The gate is easy; making it green is not, because it reddens `main` until the
14 are regenerated. That is the owner's call, not mine, so it is recorded rather
than shipped. NOT taken unilaterally and NOT filed as a separate bean, because
it is the same fact this bean is already about.

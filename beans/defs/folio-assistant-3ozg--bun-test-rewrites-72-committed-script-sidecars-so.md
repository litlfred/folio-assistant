---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: in-progress
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T05:27:36Z
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

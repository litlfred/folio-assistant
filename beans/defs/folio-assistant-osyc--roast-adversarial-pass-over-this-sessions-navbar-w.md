---
# folio-assistant-osyc
title: 'ROAST: adversarial pass over this session''s navbar work, the skill-reachability bean, and the claims made to the owner'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T21:43:53Z
updated_at: 2026-09-22T10:48:41Z
parent: folio-assistant-vuip
---

## What

Owner, 2026-09-21: *"queue roast"* — queued, not started, per the standing
instruction to queue a new task rather than pivot.

An adversarial pass over what this session produced and, more usefully, over
what it CLAIMED. Scope is deliberately the session rather than a file, because
the failures worth finding here were failures of verification and of reading,
not of code.

## Where to aim it — the session's own record of being wrong

This is not a list of suspicions. Each is something that already went wrong
once, which makes the neighbourhood worth searching:

1. **"The interfaces ARE done."** Said to the owner about the library
   visualiser on the strength of the projection data and the page source. The
   page's script did not parse — 224 chars, "loading…" — and #805 found it, not
   me. **Ask of every other "verified" claim in this session: did I check the
   artefact, or something upstream of it?**
2. **`hidden` read as absent.** Cost a full round and a test file whose three
   rigorous assertions defended the wrong design. **Where else did I take a
   word as a spec?**
3. **Three sweeps corrupted** by mutating the tree while `bun run gates` ran —
   twice by concurrent runs, once by `git merge`. One produced a phantom
   failure I nearly reported as real. **Any other result quoted in this session
   from a sweep that was not alone?**
4. **A `"docs"` literal composed by hand** in the same file as
   `publishedDocsPrefix()`, written by me, that session, for that purpose.
5. **A predicted collision that was wrong** — I told the owner
   `nav_footer_custom.html` was where #791 and I would conflict. They do not
   touch it. The prediction was cheap to check and I checked it only after
   `/coordinate` made me.
6. **Two tests that matched their own explanatory comments** — one found
   `display: none` in the prose saying why it is not used, one found
   `img[src$=...]` the same way. Both my own.

## What a roast should NOT do

Re-litigate settled owner rulings. `reminder now, gate later` on
`decision-request`, white figures in BOTH schemes, the split-by-layer
sequencing with `603s` — these were decided with reasons on the record. A roast
that reopens them is arguing with the author, not auditing the work.

## Done when

- [x] Every "verified"/"measured" claim made to the owner this session is
      traced to what was actually observed, and the ones that were inferred
      are named
- [x] The numbers quoted in beans `sjic`, `j6t3` and `2b5s` are re-measured
      rather than re-quoted
- [x] Findings are severity-ranked, and a finding that cannot be reproduced is
      recorded as unreproduced rather than dropped

## Results — 2026-09-22

Every figure below was re-measured in this checkout, not re-quoted. Where a
claim and its re-measurement disagree, the re-measurement is what is recorded
and the original is named as wrong.

### The claims that hold

| claim | oracle | result |
|---|---|---|
| 62 BPMN diagrams | `find -name '*.bpmn'` | **62** here; **63** on `origin/main` (`adjudication.bpmn`) |
| 96 distinct lane names | `loadProcessModel`, `m.lanes` | **96** |
| 85 distinct skill refs | `loadProcessModel`, `n.skills` | **85** (476 refs on 417 activities) |
| 49 work-plan ops | `loadProcessModel`, `n.workPlanOp` | **49** |
| 31 activities carry no skill ref | 448 activities − 417 with skills | **31** |
| `2b5s`: 1,378 files in `who-iris/library` | recount | **exact** — 813 `.jsonld`, 404 `.md`, 121 `.txt`, 26 `.png`, 7 `.html` |
| `j6t3`: skills declaring `user_invocable` | front-matter scan | **34** |
| fsh-guts canonical, all four legs | re-ran each | **all four reproduce** — ancestor yes; 29 files to publish; 0 canonical; 3/3 build markers present |
| the `/processes/` page rendered | the PUBLISHED artefact on `gh-pages` | **157 836 bytes, 211 `<tr>`, zero `loading` placeholders** |

The last row is the one that mattered. Roast item #1 is *"did I check the
artefact, or something upstream of it?"* — the library visualiser passed every
upstream check and shipped as 224 chars of `loading…`. So this page was checked
by fetching `processes/index.html` **off `origin/gh-pages`** and counting its
rows, not by re-running the generator. It carries 63/98/87 where this branch
measures 62/96/85, and that is not a discrepancy: `origin/main` holds one more
diagram than this branch, and the page counts at generation time, which was the
whole point of it carrying no number in prose.

### Finding 1 (minor) — "declare no `folio:policy`" measures two different things

`prhr`'s prose and `gen-processes-viz.ts:88`'s field comment both say the index
asks whether a **policy** is declared. The code asks
`/<folio:policy[^>]*\benforcement\s*=/` — whether an **enforcement value** is
declared. Those differ by one file:

    cat-harness/methodologies/crdm/processes/crdm-signoff.bpmn:83
        <folio:policy relaxable="false"/>

A policy element, deliberately authored, carrying no `enforcement` — filed by
the page under *"nobody said"*. So **23** of 62 carry no policy element while
**24** state no enforcement value, and the prose figure is right for the code
and wrong for the sentence it is in.

The decomposition cross-checks two independent ways:

    22 explicit strict + 23 no-element + 1 policy-without-enforcement = 46
    loadProcessModel's strict count                                   = 46 ✓
    46 strict + 16 advisory                                           = 62 ✓

**The code's reading is the one the three-state argument wants** — *somebody
chose an enforcement* vs *nobody said* — so the defect is in the comment and the
prose, not the regex. Recorded in `30hn`, which owns this question and whose own
`16 of 33` is now stale. This is roast item #2's exact shape: a word taken as a
spec, where `declared` meant two things and each reader picked one.

### Finding 2 (minor) — two lanes contain no node

`Activity log` (`activity-log.bpmn`) and `Session record`
(`session-state-machine.bpmn`) are lane elements with zero flow nodes in them.
A lane IS a role performing work, so a lane with no work is either a drawing
artefact or a missing activity — and the index's headline **96 distinct lane
names** counts both of them as participants. 94 have work in them.

Found only because the figure was measured two ways (lane elements vs lane
names on nodes) and the two disagreed by exactly 2. A single measurement would
have confirmed 96 and seen nothing.

### Finding 3 (minor) — `j6t3`'s command count is off by one

Four `.claude/commands/` entries exist; **three** map to an invocable skill.
`prepare-merge`'s body (`cat-harness/skills/folio-core/prepare-merge.md`) has no
YAML front matter at all — it opens on `# Prepare-merge`. Corpus-wide: **30 of
242** `.md` files under skill directories carry no front matter, which is the
same measurement `x3bd` recorded from the other side when it found that
*requiring* front matter would have dropped 30 real skills.

My own first pass at claim 1 said **37**, not 34, because the grep matched
`user_invocable` outside front matter — an instance of this bean's own subject,
committed while auditing for it.

### Unreproduced, not dropped

- **The three corrupted sweeps** (roast item #3). A sweep that ran against a
  mutating tree cannot be re-run after the fact: that tree no longer exists.
  Recorded as **unreproduced**. The durable half is already a rule — never quote
  a gate result from a sweep that was not alone.
- **The predicted `nav_footer_custom.html` collision** (roast item #5). Already
  falsified on the record; there is nothing left to measure. What survives is
  the habit, not the number: the check was cheap and was run only after
  `/coordinate` forced it.

### What the roast did not find

No claim made to the owner this session was false in a way that would have
changed a decision. All three findings are minor, and two of them surfaced only
because a figure was measured a second way rather than confirmed a second time.

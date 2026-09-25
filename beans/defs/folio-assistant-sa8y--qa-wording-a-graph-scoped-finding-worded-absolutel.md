---
# folio-assistant-sa8y
title: 'QA WORDING: a graph-scoped finding worded absolutely sent a session to a wrong fix'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T05:52:43Z
updated_at: 2026-09-20T14:17:35Z
parent: folio-assistant-d308
---

A finding scoped to one graph but **worded absolutely** sent this session to a
wrong fix, and the wrong fix was caught only by a test written the day before.

## What the report says, and what is true

`kg:audit` at the repo root reports:

> skill "confirm-harness" is listed by no package manifest, carried by no role
> and named by no activity.

Each clause is true **of the root instance's graph**. None is true absolutely:
`bootstrap/workflows/initialize-harness.bpmn` names `confirm-harness` **three
times**, and `bootstrap/harness.json` declares the directory holding it.

## Why that matters more than wording usually does

Reading it as absolute, I concluded the audit had a blind spot, traced it to
`workflowDirs` probing `<declared>/workflows` (so the `bootstrap` entry pointing
at `bootstrap/skills/` probes `bootstrap/processes/`, a sibling of the real
directory), and **declared `bootstrap/workflows/` at the root to fix it.**

`scripts/tests/instance-graph-isolation.test.ts` failed immediately, and it was
right: one instance's graph must not carry another's nodes. That was a LIVE defect
on `main` on 2026-09-19 — `findBpmnDirs` walked the filesystem, and
`_kg/folio-assistant.jsonld` carried **88** references to
`Process_InitializeHarness`. My change re-introduced it exactly.

Reverted in full. The isolation is deliberate and correct; the audit's scoping is
correct; **only the sentence is wrong**, and it cost a wrong change that a test
had to stop.

## The fix

Every finding that ranges over a graph should name the graph it ranged over:

> …named by no activity **in this instance's graph** (`cat-harness` at `skills/`).
> A nested instance may name it; this audit does not read one.

Cheap, and it removes the reading that produced the error. The same applies to
every criterion phrased as an absolute absence — `skill-in-role-or-process`,
`remote-skill-is-servable`, `skill-servable`.

## The second finding, which the detour did establish

**Bootstrap's process is auditable in principle and unaudited in practice.**
`collectInstanceNodes(BOOT, …)` works — the isolation test asserts bootstrap's own
graph DOES carry its process — but nothing ever runs the audits with `bootstrap/`
as root. So `kg:audit`, `translate-bpmn`, `render:bpmn` and `check:workflow-refs`
all skip it, and the **first process a new instance runs** has no sidecar, no
`.pot` and no rendered SVG.

Measured while the root declaration was briefly in place, so these are real
regardless of who should be reporting them:

- `skill-servable` ×3 — `confirm-harness` exists but no local package serves it,
  so `skill_fetch` answers "package not found". `bootstrap/skills/` has no
  package manifest.
- `lane-binds-role` ×3 — lanes `Initiator`, `Requestor` and
  `Knowledge Graph Data Store` match no declared role.
- **`render:bpmn` fails outright**: `no diagram to display`. The file carries no
  `<bpmndi:BPMNDiagram>`, so no BPMN tool can draw it. It executes and cannot be
  seen.

The remedy is to run each gate per declared instance rather than once at the root
— which is the same "nested declarations are not reachable from the root" gap the
`bootstrap` entry's own description already names.

## Third: a stale sidecar is residue of that fixed defect

`test/results/kg-qa/bootstrap/workflows/bootstrap.kg-qa.json` audits
`bootstrap.bpmn`, which `main` replaced with `initialize-harness.bpmn`. It was
written by the pre-fix run that walked the filesystem — which is *why* it exists —
and `kg:audit:check` does not flag it, because nothing at the root walks that
directory to notice the subject is gone.

**Not deleted.** One file, ~1 KB, subject removed on `main` 2026-09-19.
`deletion-requires-confirmation`: reported, waiting.

## Done when

- [x] graph-ranging findings name their graph — `skill-has-entry-point` and
      `skill-in-role-or-process` now append the scope, built from the DECLARED
      path strings rather than computed relative ones (computing them printed
      `../bootstrap/skills` once the tree moved into `cat-harness/`, which is
      accurate and reads like a bug)
- [ ] a gate runs the audits per declared instance, or the root's silence about a
      nested one is itself reported
- [ ] `bootstrap/skills/` gets a package manifest so `confirm-harness` is servable
- [ ] the three unbound lanes get roles, or the lanes are renamed to declared ones
- [ ] `initialize-harness.bpmn` gets a `BPMNDiagram`, or its absence is a recorded
      criterion rather than a hard renderer failure
- [x] the stale sidecar: **owner decided — "Delete it"**, and it is gone. Done in
      `30f5057`, reported before acting: 2409 bytes, last touched 2026-09-19,
      subject `bootstrap.bpmn` removed on `main` 2026-09-19

---

## Done 2026-09-20: the two graph-ranging findings now name their scope

> skill "confirm-harness" is listed by no package manifest, carried by no role and
> named by no activity. **In this instance's graph only** (read: `cat-harness` at
> `skills/`, `bootstrap` at `bootstrap/skills/`, `cat-harness-src` at
> `src/skills/`) — a nested instance may name it, and this audit does not read
> one.

The reading that produced the wrong change is now unavailable: the sentence says
what it ranged over and says a nested instance is out of range.

`graphScope()` carries the 2026-09-20 incident in its own doc comment — the
absolute wording, the wrong fix, and the test that stopped it — so the next author
meets the reason where they meet the code.

### One thing the fix surfaced on the way

Computing the paths relative to the audit's root printed
`` `bootstrap` at `../bootstrap/skills` ``, because the script now runs from
`cat-harness/` and `bootstrap/` is its sibling. Accurate, and it reads like a
defect. Switched to the declared `path` string: it is what a reader would go and
edit, and it cannot acquire a `../` when the tree moves again. "Resolve, do not
compose", applied to a diagnostic rather than to a link.

### Still open on this bean

- [x] the root's silence about a nested one is now **reported**, as criterion
      `nested-instance-audited` (`minor`). It names the instance, counts the
      diagrams this run did not read, states that the silence is CORRECT, and
      warns against the exact wrong fix — declaring its directories at the root,
      which re-introduces the leak `instance-graph-isolation.test.ts` guards.
      A reported number is not deducible-and-mis-deducible
- [ ] running the audits per declared instance is still open, and is the half that
      would actually AUDIT bootstrap rather than count it. The criterion makes the
      gap visible; it does not close it
- [x] `bootstrap/skills/` package manifest — **and the manifest was not the
      blocker.** `manifestSkills()` hardcoded `join(root, "skills")` and scanned
      only one level of subdirectories, so a manifest AT a declared directory was
      invisible however correctly written. `gen-skill-docs` already documents that
      `bootstrap` and `cat-harness-src` hold their skills DIRECTLY. Both that
      function and `manifestEntries()` now derive from `kgDirectories` and accept
      either shape, through one shared walk so they cannot drift apart again.
      `skill-has-entry-point` went 1 → 0
- [~] the three unbound lanes — **NOT work, a recorded decision.** The four
      roles exist in `bootstrap/scenarios/roles.json` with the right flags
      (`knowledge-graph-data-store` and `logger` `actedUpon`, `requestor`
      `judgementOnly`); what is missing is `lanes` on each, and that absence is
      **deliberate**. The file's own `_lanes_comment` records why: the root
      declares `bootstrap/skills/` but NOT `bootstrap/workflows/`, so a `lanes`
      entry mints `bindsLane -> role/Initiator` in folio-assistant's graph
      pointing at a lane node only bootstrap's export produces — **three
      dangling links, measured 2026-09-20**. Whether the root should declare
      both halves or neither is bean `pve3`.

      **Binding them would have re-created the shape of the wrong fix that
      started this bean** — one instance's graph carrying another's nodes.
      Left alone, deliberately.
- [x] that diagram has no `BPMNDiagram` — **added 2026-09-20.** The premise
      about the renderer was also stale: `render:bpmn` exits 0 and never lists
      it, because `workflowFiles(ROOT)` reads cat-harness's declared graph and
      the root does not declare `bootstrap/workflows/`. Same isolation, again.

      Worth doing anyway, and the reason is not this repository's renderer: a
      BPMN file with no DI opens as an **empty canvas in any editor**, so a
      person opening it to read the process saw nothing. 14 shapes, 3 lanes,
      15 edges. Validated by round-tripping through `bpmn-moddle`: 1 diagram,
      33 plane elements, **0 warnings and 0 unresolved `bpmnElement`
      references**. Not rendered to SVG here — `bpmn-js` is one of the
      `--all` browser jobs and is not installed in this container — so that
      half is stated as unverified rather than claimed.
- [ ] the stale `bootstrap.bpmn` sidecar — owner's call, still untouched


---

## 2026-09-20 — the sidecar item was already closed; four remain

Re-checked rather than re-asked. `find` for `bootstrap*.kg-qa.json` returns
**nothing**, and `git log --diff-filter=D` names the commit that removed it:
`30f5057`, *"options-analysis.bpmn, and the two deletions the owner authorised"*.
Its message records the figures that were reported **before** acting — 2409 bytes,
last touched 2026-09-19, subject gone — which is what
`deletion-requires-confirmation` asks for.

So this bean was carrying an open question the owner had already answered. Ticked
rather than re-raised: asking twice is its own failure, and it spends the one thing
the owner's accessibility constraints make expensive.

### The four that are genuinely open, and none of them is a decision

- a gate runs the audits **per declared instance**, or the root's silence about a
  nested one is itself reported. `kg:audit` currently reports
  `graph:kg nested-instance-audited (2)`, so the finding exists and the **gate**
  does not
- `bootstrap/skills/` gets a package manifest, so `confirm-harness` is servable
- the three unbound lanes get roles, or are renamed to declared ones
- `initialize-harness.bpmn` gets a `BPMNDiagram`, or its absence becomes a recorded
  criterion rather than a hard renderer failure

Each is work, not a judgement for the owner. Left for a session that can take the
nested-instance question whole, because the first item changes what the audit
**ranges over** and the other three are findings inside that range — doing them in
the other order means auditing them twice.

---
# folio-assistant-tw61
title: 'INIT QA: a new folio gets proper QA from its first commit — sweep command, CI step, verdicts at the root (owner)'
status: completed
type: task
created_at: 2026-09-23T17:58:25Z
updated_at: 2026-09-23T17:58:25Z
parent: folio-assistant-q4jm
---

Owner, 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE): *"setup proper QA on init."*

`init-folio` / `folio_init` scaffolds a folio, but it does not set up QA so that the folio is checked from its first commit. Measure first what a new folio gets today:
- a QA sweep command, or a `package.json` script for one;
- a CI workflow that runs the sweep;
- the verdict location (see `s3p2`, fixed in #1094);
- the review heat map's QA column (`qbfi`), which reads "unaudited" until something sweeps.

Then close the gap.

## Done when
- [x] what a freshly scaffolded folio gets for QA is measured and listed here. **Measured 2026-09-23** on `litlfred/folio-test/handbook`, scaffolded by init-folio:
  - no sweep command anywhere;
  - no CI step that sweeps;
  - `AGENTS.md` taught the OLD sibling layout (`<chapter>/<root>.qa.json`);
  - the preview's QA column read "unaudited" on every block.

  Also found: `publish-block-qa` anchored at `.`, the repository root, so a folio in a subfolder read unaudited even AFTER a sweep.
- [x] `init-folio` writes what is missing:
  - the sweep command, and a "QA" section in the folio's `AGENTS.md` (commit the verdicts with the edit they are about);
  - the layout now shows `test/results/block-qa/`;
  - `folio-staging.yml` gains a `qa_sweep` input, ON by default, which sweeps each PR build before the summary. It runs without `--ci`, so a critical failure shows on the heat map instead of stopping the preview;
  - `publish-block-qa` finds the instance root as the sweep does.
- [x] a test scaffolds a folio, runs its QA as written, and finds verdicts at the instance root: `cat-harness/scripts/tests/init-folio-qa.test.ts`. It includes a SUBFOLDER folio swept from the repo root, as CI does, and it fails with the old `.` anchor.

## Summary of Changes

A new folio is QA'd from its first PR:
- the staging workflow sweeps each build (`qa_sweep`, default on);
- the folio's `AGENTS.md` documents the sweep command and where verdicts go;
- the QA summary reads verdicts at the folio's own root, even when the folio is in a subfolder.

**Not done here, and recorded:** "passing" covers only the SCRIPT-checkable criteria. About 15 criteria (voice, exposition, adversarial review) need an agent, and the sweep leaves them unrecorded. The heat map does not say so per block. That is a separate honesty question for the summary's states.

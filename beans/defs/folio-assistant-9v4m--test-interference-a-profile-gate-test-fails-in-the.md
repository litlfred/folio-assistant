---
# folio-assistant-9v4m
title: 'TEST INTERFERENCE: a profile-gate test fails in the full suite and passes in isolation on the same commit'
status: todo
type: bug
created_at: 2026-09-26T03:40:20Z
updated_at: 2026-09-26T03:40:20Z
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

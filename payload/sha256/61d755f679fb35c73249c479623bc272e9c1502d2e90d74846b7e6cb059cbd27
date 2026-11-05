---
# folio-assistant-v29t
$schema: bean/1.0.0
title: CI site publish has no pandoc/LibreOffice, so site:export fails every CI publish of dth-hrh
status: todo
type: task
created_at: 2026-11-05T20:09:21Z
updated_at: 2026-11-05T20:09:21Z
parent: folio-assistant-dthl
---

Found 2026-11-05 (bean xxow). dth-hrh run 42076453040 failed at site:export with 'pandoc is not installed (needed for release)'. The shared reusable workflow cat-harness-tools/.github/workflows/folio-site-publish.yml (pinned at 9b62dbf; main is the same) installs Ruby but not pandoc, LibreOffice or poppler-utils. No CI publish of dth-hrh main has succeeded since site:export was added (fcd940b, 2026-11-02). gh-pages export copies come from local publishes only. Fix: install pandoc + libreoffice-writer + poppler-utils in the reusable workflow, ideally only when a site step needs them (cache the apt step). Then re-pin dth-hrh's site-publish.yml (a pin-train change, so coordinate with the train). Owner chose 'local publish now + queue fix-CI task'.

---
# folio-assistant-ws99
title: 'GENERATED OUTPUT: every generator''s output should declare its writer — five write into docs/ and none did'
status: todo
type: task
created_at: 2026-09-24T06:27:05Z
updated_at: 2026-09-24T06:27:05Z
parent: folio-assistant-vke6
---

Issue #1254. Found while building check:reference-direction (#1219, bean zhg2): gen-skill-docs, gen-schema-docs and gen-uml-overview wrote 769 occurrences of undeclared generated output into docs/, 54% of that check's original findings. docs/ is a content graph and correctly so, so the directory cannot answer for a generator's output inside it — the file must. Markers added in PR #1222 for the three; this is the gate that closes the class.

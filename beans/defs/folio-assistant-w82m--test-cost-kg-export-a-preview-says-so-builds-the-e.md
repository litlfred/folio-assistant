---
# folio-assistant-w82m
title: 'TEST COST: kg-export ''a preview says so'' builds the export twice and sits at bun''s 5 s timeout (fails alone, locally, on main too)'
status: todo
type: bug
created_at: 2026-09-23T16:56:12Z
updated_at: 2026-09-23T16:56:12Z
---

Measured 2026-09-23. The test `kg export > a preview says so in its type and links every node back to canonical` (`cat-harness/scripts/tests/kg-export.test.ts:440`) calls `buildExport()` twice, once for the preview and once for canonical, with nothing cached. On a session container it takes about 5.2 s when run alone. That is over bun's default 5 s test timeout, and the same on `main` (`04b8ed02`) as on a feature branch. Run as part of the whole file, it passes, because earlier tests warm the build. So `bun run gates` fails locally on this test alone while CI, on faster runners, passes it.

It is not a flake. It is a test whose cost is right at its limit, and every new KG node pushes it closer.

## Done when
- [ ] the test shares one canonical export with the other tests in the file (computed once in `beforeAll`), or declares a timeout with the reason written beside it
- [ ] `bun test cat-harness/scripts/tests/kg-export.test.ts -t 'a preview says so'` passes alone on a session container

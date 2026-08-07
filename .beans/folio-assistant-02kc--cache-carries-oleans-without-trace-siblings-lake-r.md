---
# folio-assistant-02kc
title: Cache carries oleans WITHOUT .trace siblings — lake rebuilds and evicts them
status: in-progress
type: bug
priority: critical
created_at: 2026-08-07T13:56:17Z
updated_at: 2026-08-07T13:56:17Z
---

Root cause of the cache never helping lake build. Lake decides staleness from .trace files; an olean with no trace is out-of-date, so lake rebuilds it and evicts. Measured: restore laid 7268 oleans with only 775 traces; a single-module 'lake build' ran 823 targets and left 772 oleans — every survivor had a trace (494 mathlib oleans / 494 traces, 0 of 200 sampled lacking one). The cache only ever worked for direct lean+LEAN_PATH calls, which is why the triviality probe succeeded while builds did not.

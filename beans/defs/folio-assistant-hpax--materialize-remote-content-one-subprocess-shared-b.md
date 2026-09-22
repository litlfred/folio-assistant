---
# folio-assistant-hpax
title: 'MATERIALIZE REMOTE CONTENT: one subprocess, shared by catalogue import and harness bootstrap, plus its refresh'
status: todo
type: task
priority: critical
created_at: 2026-09-20T08:04:11Z
updated_at: 2026-09-20T08:04:11Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: 'so if large remote collection, and no restrictions known in context, user can import/maertialize locally. size considerations apply. similar concept in bootstrapping harness... it is remtoe. content. bootstrape materelaiz cat-harness locally (or other harness)... similar, should share common subprocess. also need to know about refreshing amterialed remote content. general process used everywhere.'

THIS IS THE LOAD-BEARING BEAN OF THE EPIC. It says the IRIS import is not a special case: it is one instance of a process this repository ALREADY RUNS and has never named.

THE TWO INSTANCES, and they are genuinely the same shape:
- `who-iris` -> `library/`. A remote collection (361.55 GB measured by the owner), of which three items are materialised and the rest stay referenced.
- `bootstrap` -> `cat-harness`. `bootstrap/workflows/initialize-harness.bpmn` fetches a harness that is REMOTE CONTENT and lands it locally. `upstream-pins.json` and `check:upstream-pins` exist precisely because that materialised copy can go stale, which is the refresh half already half-built and not named as such.

THE THREE STATES ARE THE SAME THREE. Referenced (we know it exists and where, we hold no bytes) / materialised (bytes are here) / unknown. `readme-sections.ts` enforces this one level down and the argument transfers verbatim: collapsing 'could not determine' into either neighbour is how a clean scan gets reported over content nobody fetched.

WHAT A MATERIALISATION MUST DECIDE, every time, in both instances:
- SIZE. What fraction, and what would the whole cost. Refuse when it cannot tell.
- RESTRICTIONS. Owner: 'no restrictions known in context' is a STATE, not a green light. Unknown-licence is its own answer and must not render as permitted.
- RETENTION. What expires this copy. A copy with no expiry cannot be told from an abandoned one.
- SOURCE LOSS. What survives if the origin goes. Already real here: the measured IRIS record carries a legacy `iris.wpro.who.int` handle for an instance that was merged away.

AND REFRESH IS NOT RE-IMPORT. It needs: what changed upstream, what was modified locally since, and what to do when both. `upstream-pins.json` answers the first for one instance and nothing answers the other two anywhere.

## Done when
- `processes/materialize-remote.bpmn` and `refresh-materialized.bpmn` exist as CALLABLE subprocesses in cat-harness.
- `sample-import.bpmn` calls them. `bootstrap`'s initialisation calls them, or a bean records exactly why it cannot yet.
- One skill covers both callers; neither has its own copy of the four gates.

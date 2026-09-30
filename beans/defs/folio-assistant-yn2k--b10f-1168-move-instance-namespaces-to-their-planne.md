---
# folio-assistant-yn2k
title: 'B10f (#1168): move instance namespaces to their planned repos'' own hosts? (owner decision)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T19:28:44Z
updated_at: 2026-09-30T20:13:03Z
parent: folio-assistant-tr05
---

B10e made the owner/repo → IRI map derived (instanceNamespace in schemas/instance-repositories.ts). Today cat-harness and folio-assistant-core mint under https://litlfred.github.io/folio-assistant/<stub>/ns#, which does NOT survive the split; bootstrap already mints under its own host (iriBase https://litlfred.github.io/bootstrap/). Moving the other two means declaring iriBase (e.g. https://litlfred.github.io/cat-harness/) — a breaking IRI change for published vocabularies. Needs the owner's call. Also open: the smart-* instances' planned repos (provisionally litlfred/<name>; litlfred/smart-base is an existing fork the owner said is not the home).

## Owner decisions 2026-09-30
- Namespaces: MOVE NOW, versioned like bootstrap (declare iriBase for cat-harness and folio-assistant-core).
- smart-* planned repos, staged: litlfred/<name> now; distinct names (e.g. litlfred/smart-base-kg) later, for testing; WorldHealthOrganization/* once all is working.

_2026-09-30T20:13:03Z_ — Claimed by claude/sharp-einstein-970n6g — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

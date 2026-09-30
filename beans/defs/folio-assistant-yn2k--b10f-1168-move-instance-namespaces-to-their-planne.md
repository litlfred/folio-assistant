---
# folio-assistant-yn2k
title: 'B10f (#1168): move instance namespaces to their planned repos'' own hosts? (owner decision)'
status: completed
type: task
priority: normal
created_at: 2026-09-30T19:28:44Z
updated_at: 2026-09-30T20:13:16Z
parent: folio-assistant-tr05
---

B10e made the owner/repo → IRI map derived (instanceNamespace in schemas/instance-repositories.ts). Today cat-harness and folio-assistant-core mint under https://litlfred.github.io/folio-assistant/<stub>/ns#, which does NOT survive the split; bootstrap already mints under its own host (iriBase https://litlfred.github.io/bootstrap/). Moving the other two means declaring iriBase (e.g. https://litlfred.github.io/cat-harness/) — a breaking IRI change for published vocabularies. Needs the owner's call. Also open: the smart-* instances' planned repos (provisionally litlfred/<name>; litlfred/smart-base is an existing fork the owner said is not the home).

## Owner decisions 2026-09-30
- Namespaces: MOVE NOW, versioned like bootstrap (declare iriBase for cat-harness and folio-assistant-core).
- smart-* planned repos, staged: litlfred/<name> now; distinct names (e.g. litlfred/smart-base-kg) later, for testing; WorldHealthOrganization/* once all is working.

## Done (2026-09-30)
cat-harness and folio-assistant-core declare iriBase (https://litlfred.github.io/<repo>/), so their namespaces are <iriBase>0.1.0/ns# and processes/ns#; 5.5k literal copies rewritten outside beans/. Gates: iri:sync:check, check:node-iris, external-schemas:check, the phase-3 namespace gate. smart-* stays litlfred/<name> per the owner's staged plan (distinct names for testing later, then WorldHealthOrganization/*).

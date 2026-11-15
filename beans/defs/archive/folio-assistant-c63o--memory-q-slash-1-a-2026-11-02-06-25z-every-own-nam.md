---
# folio-assistant-c63o
$schema: bean/1.0.0
title: 'Memory: Q-SLASH-1 = A (2026-11-02 06:25Z): every own namespace incl. BPMN processes xmlns and ig-ast goes ns# -> ns/; plan + branches claude/slash-iris'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `slash-iris-rollout.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-SLASH-1 = A (2026-11-02 06:25Z): every own namespace incl. BPMN processes xmlns and ig-ast goes ns# -> ns/; plan + branches claude/slash-iris


Owner tapped Q-SLASH-1 A at 2026-11-02 06:25Z: switch EVERY own namespace from `…ns#` to `…ns/`, including BPMN extension XML namespaces (`…/v0/processes/ns/`), `…/ns/dspace/` and fhir-harness `…/ns/ig-ast/`. Clean break, no forwarding (see folio-assistant-8azk).
Plan: /mnt/project-files/slash-iris-2026-11-02/plan.md. Issue cat-harness-tools#1378. Thread cmsg_017WNUkNK8kdDziPK58Pv6G95HvJ9m7xBV6qWhqn6M2rVj.
Order: cat-harness-tools rule (namespaces.ts instanceNamespaceOf/stubOfNamespace) -> cat-harness code-lists/own-namespaces.json + regen -> bootstrap-tools, core, who-iris regen -> re-pin. Term pages served as `<ns>/<Term>.html` (Pages resolves extensionless to .html), vocabulary at `<ns>/index.jsonld`.
Q-SLASH-2 = B (06:29Z): document#fragment node IRIs (roles#, BPMN plan steps, code-list schemes) are wave 2, after the namespace train.
**Why:** hash IRIs cannot have their own page; owner wants dereferenceable nodes.
**How to apply:** never mint a new `ns#` IRI; regen is mechanical (non-content) unless a reviewer disagrees.
- Q-SLASH-3 = A (07:30Z 11-02): keep the `ns/` segment for vocabulary terms and concepts; do not drop it.
- 13:17Z 11-02 CODE FREEZE (Q-MVP-5 A) on lower layers; slash wave allowed. Fallout PRs tools#1408, bootstrap-tools#76 (train-requested), smart-base#291; coordinator confirmed allowed (13:19Z); who-iris#165 replaces #170. Wave 2 (tools#1379) waits until after the freeze; window ends 20:40Z 11-02 (Q-MVP-6 A). Train fa#2917 pins all regen heads; owner hand-removes fa workflow cp lines (Q-SLASH-8 A). fhir-harness#280 / sci#172 (train's) stack on #275/#171: tell train when those merge.
- who-iris#172 closed (superseded by #165, which has dc re-render + lock re-pin). On #165 merge tell TOC thread cmsg_017WNUkNK8kdDziPK58Pv6G9T2NwvJrwiuyNa9WdtSZ8Ag (smart-trust#138) and re-pin prep thread …FDPvN5ktTn4HS2iruRVeZj.
- DONE 2026-11-08: all layers + sites on ns/; #1378 and wave 2 #1379 closed; who-iris#170 closed (superseded by #165); thread resolved.

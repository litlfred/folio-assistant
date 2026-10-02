---
# folio-assistant-pebe
title: 'smart-base: pin smart-kg (L1/L2 ontology) as a subgraph; document kinds cite its classes'
status: in-progress
type: task
created_at: 2026-10-02T06:15:59Z
updated_at: 2026-10-02T06:15:59Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-02 (#1767): 'utilize https://github.com/litlfred/smart-kg for L1 related stuff' and '(perhaps subgraph in smart-base to help define l1 dth etc docs?)'; chose options 1+2.

smart-kg (fork of WorldHealthOrganization/smart-kg) is a T-Box only: L1 (16 classes), L2 DAK components (13), L2-BPMN, L2-DMN, L3. Owner 2026-09-23 (bean wg7r): 'dont want smart-kg here yet, that is its own repo already' — so it is REFERENCED by pin, never copied.

## Done when
- [ ] smart-base declares an external-schema subgraph with a pin record for smart-kg at a commit
- [ ] a derived snapshot of the L1+L2 class ids, written by a pin script from a checkout at that commit, never by hand
- [ ] document-kind sections can name the classes they instantiate (modelledBy), and smart-base:document-kinds:check fails on a term not in the pin and on an unresolved extends
- [ ] l1.json and dth.json use it

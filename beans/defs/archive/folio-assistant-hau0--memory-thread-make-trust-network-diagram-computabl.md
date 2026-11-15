---
# folio-assistant-hau0
$schema: bean/1.0.0
title: 'Memory: Thread "Make trust network diagram computable" (2026-11-08) - smart-trust trust_network.png, card Q-TN-1'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:18:26Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-trust-network-figure.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Make trust network diagram computable" (2026-11-08) - smart-trust trust_network.png, card Q-TN-1

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9WfPtD1W5rFVUQoo5fmseHN. User 07:16Z 11-08: "make computable https://litlfred.github.io/folio-assistant/smart-trust/trust_network.png".
- Source: litlfred/smart-trust input/images/trust_network.png (hand-drawn, no source), used in input/pagecontent/overview.md:22 and concepts.md:107.
- Repo keeps 8 diagrams as PlantUML in input/images-source/ (style.iuml, links like [[system-actors.html#...]]). No copilot instructions.
- Card Q-TN-1 (cmsg_017WNUkNK8kdDziPK58Pv6G9MogDdAvuyCLshnSox2yNA3): A PlantUML (recommended), B JSON-LD + SVG generator, C JSON + generated PlantUML, D BPMN. Ask before PR.
- Wording: figure says "Credential Authority"; glossary term is "Certificate Authority".
- 07:22Z: Q-TN-1 = A. Local commit 216012a on smart-trust branch claude/trust-network-computable (plantuml + figure swaps + pot refresh). Push held by swarm hold until fa#3034 lands (~07:55Z); reminder set 07:58Z.
- 07:59Z: fa#3034 landed; pushed d20be8b. Issue smart-trust#168, draft PR smart-trust#169 (subscribed). Waiting on CI/Pages render of the SVG, then user review.
- 08:12Z: #169 draft CI green. Card Q-TN-2 (cmsg_017WNUkNK8kdDziPK58Pv6G9C2ba5p246zpkipSqzkM7JZ): A mark ready for full IG build (rec), B leave draft.
- 08:46Z: user 'y' (cmsg_...RmaWkSKEeXLmNUEsTydVv9) = merge OK. Q-TN-2 A. #169 marked ready; handed to merge manager to merge on green. I fix red CI.
- 09:19Z: #169 MERGED; thread done.

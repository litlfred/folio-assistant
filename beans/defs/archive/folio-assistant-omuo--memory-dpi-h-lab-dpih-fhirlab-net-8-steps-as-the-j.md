---
# folio-assistant-omuo
$schema: bean/1.0.0
title: 'Memory: DPI-H Lab (dpih.fhirlab.net) 8 steps as the journeys Discussion view: cat-harness-tools#1892 + smart-trust-demo#121 both merged 2026-11-11'
status: completed
type: task
priority: low
created_at: 2026-11-11T19:52:29Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dpih-lab-discuss-weave.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DPI-H Lab (dpih.fhirlab.net) 8 steps as the journeys Discussion view: cat-harness-tools#1892 + smart-trust-demo#121 both merged 2026-11-11

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G9TBYYPGaPtRPKJtrxy3emmm. Issue litlfred/smart-trust-demo#120.

- DPI-H Lab is by Umer Nisar (CSIRO), with Rumanusina Maua (SPC) and Jordi Piera Jimenez. Its content is CC BY 4.0 and its code Apache-2.0; not WHO/ITU endorsed. Its source is NOT public (not in aehrc/FHIRLab, not in the litlfred/FHIRLab fork, not on AEHRC GitLab), and the sandbox blocks dpih.fhirlab.net. The Lab's own steps 3 to 7 and the last readiness rows are unseen; our steps 3 to 7 are written from our own tables. Screenshots from the user would allow matching them.
- User choices: Q-DPL-1 = A, plus an 8-step discuss page, journey questions answerable on both the walkthrough and the discuss page, use cases pre-filled from the journeys and editable, and multi-select use cases.
- cat-harness-tools#1892 merged (77e5081): `workshop.lab`, the shared answer key `jv:<ws>:q:<stepKey>:<i>`, and a browser summary with print/CSV.
- smart-trust-demo#121 merged 18:5xZ (0204598): the lab content and the readiness table, re-pinned cat-harness-tools to b9a8d20 via `mount:remote --seed` (consent: user 12:56Z "merge when green"). Lesson: never hand-edit index.lock.json mounts[].ref; CI mounts from instances[] (sha, tree digests, trust). Re-lay from the lock with `.github/mount-from-lock.sh --root .`, then seed, then run `mount:remote`.
- The site goes live only after a manual gh-pages publish (stage-local).
- Screenshots: /mnt/project-files/dpih-lab-discuss-2026-11-11/.

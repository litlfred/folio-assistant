---
# folio-assistant-3f7g
$schema: bean/1.0.0
title: 'Memory: smart-trust-demo #113: replace Thailand/Malaysia/KSA/Lao with fictional Onesa + Taifafeki (XX* codes); card Q-FIC-1 mapping'
status: completed
type: task
priority: low
created_at: 2026-11-11T09:01:38Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-demo-fictional-countries.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-trust-demo #113: replace Thailand/Malaysia/KSA/Lao with fictional Onesa + Taifafeki (XX* codes); card Q-FIC-1 mapping

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G96Mndgk7Zp7pbAJ3DXPnjie. User: use fake countries Onesa and Taifafeki instead of Thailand, Malaysia, KSA, Lao; define once in smart-trust-demo with user-assigned codes (e.g. XXR) so pilgrimage etc. can reuse.

Facts: issue litlfred/smart-trust-demo#113. Here Thailand = birth country/DVC issuer (Chiang Rai), Lao PDR = home (Vientiane). XXR is already the GDHCN DEV test participant whose DSC key signs J1 DVCs (scenarios/actors/xxr-dsc-key.json). Malaysia only as real "Hajj Health Card" policy example; KSA not in repo (pilgrimage). Overlaps PR #112 (folio-assistant-dhls): stack on branch claude/journeys-wording.

Q-FIC-1 = B (user 09:02Z): Onesa = home (Lao, Malaysia) code XXK (WHO tng-participants-dev test participant, like XXR); Taifafeki = visited (Thailand, KSA) code XXR. Places: Chiang Rai->Kesaro, Vientiane->Lomaru, Bangkok->Lumara. Branch claude/fictional-countries. Card (msg cmsg_017WNUkNK8kdDziPK58Pv6G9HfvAbXqeydkmA1LrYhh3f6): A Onesa=TH+MY (XXR), Taifafeki=LA+KSA (XXT) rec / B Onesa=home, Taifafeki=visited / C this repo only. Defaults stated: fictional place names, keep people names, keep Malaysia Hajj card citation. Content: merge needs user card.

11-11 ~09:40Z: draft PR smart-trust-demo#114 (branch claude/fictional-countries, stacked on #112, e592a0c; scenarios/countries/{onesa,taifafeki}.json, page countries.md, repo memory dir-fictional-countries.md; XXH->XXK; places Kesaro/Lomaru/Lumara; 5 locales' .po updated). User also asked that the smart-trust value set match: litlfred/smart-trust issue #179, draft PR #180 (Participants-DEV XXK 'Onesa', XXR 'Taifafeki', generator FICTIONAL_COUNTRIES override). Both content: merge card needed. Not done: countries.md translations; pilgrimage repo.
Q-FIC-2 = C (user 09:18Z): merge #114 (after #112 merges + rebase) and smart-trust #180 when CI green; pilgrimage switch requested from coordinator as a new thread.
11-11 09:40Z pilgrimage (thread cmsg_017WNUkNK8kdDziPK58Pv6G9H4QQDJuKJoHovczmJDnoGf): issue smart-ips-pilgrimage#62, draft PR #63 (claude/fictional-countries). Kuala Lumpur->Lomaru, Kuala Terengganu->Tanavu (new; not yet in onesa.json); Mina/Arafat kept. Q-FIC-3 = C: fictional CONSENT-XXK/XXR in pilgrimage's own IPS.HAJJ.CONSENT (user: consent codes go in smart-trust-demo or pilgrimage, NEVER smart-trust). Real codes, concepts, overview figure, Malaysia ref impl kept. SUSHI not run (seed denied). .po left to translation refresh.
09:30Z smart-trust #180 merged (green, per Q-FIC-2 C). #114 waits for #112 merge, then rebase + merge on green.
09:37Z: #112 and #114 both merged to main by user. Done; only pilgrimage thread (separate) and countries.md translations remain.
10:05Z: smart-ips-pilgrimage#63 MERGED (c572fba) under user's 09:34Z 'merge all green and ready'. Open: .po translations behind (refresh), demo #114 places commit 4093f89 awaits #112.

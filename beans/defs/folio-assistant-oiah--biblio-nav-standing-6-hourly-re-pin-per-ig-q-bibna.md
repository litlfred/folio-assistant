---
# folio-assistant-oiah
$schema: bean/1.0.0
title: 'Biblio nav: standing 6-hourly re-pin per IG (Q-BIBNAV-2 = B)'
status: in-progress
type: task
priority: normal
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T18:12:00Z
parent: folio-assistant-v8bg
tags:
    - handover-2026-11-12
---

Owner chose B and said merge (09:07Z): re-pin all IGs once, then enable a 6-hourly `standing-repin.yml` in each IG. Owner thread: biblio https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9G6g9EGbG9kGSg8u3W5fieF.

- [x] smart-trust#200 (first standing re-pin) merged (`30fa68a001`, `10:54:55Z`)
- [x] smart-base#354 (standing re-pin) merged (`9946a84647`, `13:49:23Z`)
- [x] cat-harness-tools#1964 (`repin-standing: read the cascade's name and needs structurally`) merged (`aafd482ed5`, `15:06:11Z`)
- [x] Initial IG re-pin + `site-publish.yml` rollout merged on `smart-trust-phw#60` (`8cd36cd776`, `17:58:52Z`) and `smart-immunizations#136` (`fb2971a903`, `17:58:57Z`, `Site publish` green on `main`)
- [ ] cat-harness-tools#1948 (tracking issue, currently OPEN) — roll out `standing-repin.yml` + `trust.standing` to remaining IGs (`smart-trust-phw`, `smart-immunizations`, `smart-immunizations-uganda`, `smart-ips-pilgrimage`, `smart-ra`, etc.) and merge remaining initial re-pins (`smart-immunizations-uganda#27`, `smart-ips-pilgrimage#66`)
- Needs the owner's per-repo settings: folio-assistant-98p4.

_2026-11-12T09:45:00Z_ — Filed by thread "Record handover in beans" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9E8Y9ccXJsk3qvGEie1X5Pr), session https://claude.ai/code/session_01Qmmkt7NmLVnjA5oNtkbv3f.

_2026-11-12T15:35:00Z_ — `smart-trust#200` merged at `30fa68a001` (`10:54:55Z`) and `smart-base#354` merged at `9946a84647` (`13:49:23Z`). Tracking issue `cat-harness-tools#1948` remains open for remaining IGs (`smart-trust-phw#60`, `smart-immunizations#136`, etc.).

_2026-11-12T18:12:00Z_ — Round 22 merges: `cat-harness-tools#1964` (`aafd482ed5`, `15:06:11Z` — `repin-standing: read the cascade's name and needs structurally`), `smart-trust-phw#60` (`8cd36cd776`, `17:58:52Z`), `smart-trust-phw#61` (`92e51e9fa0`, `18:05:02Z`), and `smart-immunizations#136` (`fb2971a903`, `17:58:57Z`, `Site publish` green on `main`). `cat-harness-tools#1948` remains open for adding `standing-repin.yml` + `trust.standing` to the remaining IGs and completing initial re-pins on `smart-immunizations-uganda#27` and `smart-ips-pilgrimage#66`.

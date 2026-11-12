---
# folio-assistant-eil7
$schema: bean/1.0.0
title: 'Memory: GDHCN onboarding game translations ar/es/ru/zh merged 2026-11-11 (smart-trust#184-187); method, gates and gotchas'
status: completed
type: task
priority: low
created_at: 2026-11-11T10:06:56Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `gdhcn-onboarding-game-translations.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: GDHCN onboarding game translations ar/es/ru/zh merged 2026-11-11 (smart-trust#184-187); method, gates and gotchas

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G9SUGnv8bi9W7m7VwpL78GZ8. The game's strings (790) are in translations/<locale>/apps/onboarding-game.po. French came in with #178. es #184, ar #185, ru #186, zh #187 were merged at 10:0xZ with the user's card (unofficial, agent-made). All six UN languages are 790/790 on main.

Method: blind back-translation by one subagent per language, then a comparison. No meaning drifts were found. **Give each parallel agent its own folder**: the first run's agents overwrote each other's p1..p4.json part files.
Choices: personal names stay in Latin script. ru and zh drop the {n:one|other} mark and reword. ar mirrors the arrows. es follows the es glossary ("Secretaría de la Red Mundial").
Gates: the full PR CI (it runs only when a PR is not a draft) includes `cat-harness-tools:translation:glossary:check`, which enforces fixed renderings. ICVP stays "ICVP" in es, and "Certificate Authority" must be «سلطة التصديق» in ar. Run it locally after mounting tools from index.lock.json (see translations.yml): `bun cat-harness-tools/scripts/run-script.ts translation:glossary:check | grep apps/`. Other checks: `node onboarding-game/scripts/strings.mjs` and `check:translation-officiality`.
Left open: the pagecontent .po files lag behind English fixes (po-status: 36 new/obsolete strings per locale). Native review is not done.
Related: folio-assistant-8n0n, folio-assistant-4yjk.

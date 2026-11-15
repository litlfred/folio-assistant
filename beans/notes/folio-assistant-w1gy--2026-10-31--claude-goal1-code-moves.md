---
# note on folio-assistant-w1gy from claude/goal1-code-moves
$schema: folio-bean-note/v1
bean: folio-assistant-w1gy
branch: "claude/goal1-code-moves"
created: "2026-10-31"
---
## Fresh-clone QA re-run of cat-harness-tools, 2026-10-31

Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp (thread "Finish GOAL 1 code-move beans"). Full report: project file `w1gy-qa-2026-10-31/QA-cat-harness-tools.md`.

- Failures outside the baseline went from 182 to 43. The fixes below took them to 0 in a standalone run.
- F23 (reference-direction mentions), F24 (tests writing tracked witness files) and the remaining standalone failures were fixed and merged on the owner's card "A. Merge all three" (2026-10-31 12:31Z):
  - cat-harness#853 → 02c4725 (archimate-publish .pot files, safeHref for runUrl, archimate-models links)
  - bootstrap-tools#55 → 541195a (comments reworded as links)
  - cat-harness-tools#1121 → 0bf6efb (guards on 39 tests, 3 test bug fixes, `restoringTracked()`)
- Open: F21. In the bare sibling layout bootstrap-tools can't resolve zod, because only the repository under test is installed. Waiting on an owner card (option A: install every sibling). w1gy's boxes stay unticked until F21 is answered, and mgxw closes with w1gy.

## Completed, 2026-10-31 13:25Z

The owner chose option A for F21 (12:40Z, install every sibling) and the card "A. Merge both now" (13:22Z). Merged bootstrap-tools#58 (72344e1, zod 4.6.6) and cat-harness-tools#1131 (9da064c, README). A fresh-clone run with every sibling installed has 0 tsc errors and 0 test failures outside the baseline. The addendum to `QA-cat-harness-tools.md` lists every fix commit. cat-harness passed on 2026-10-30 (note above). Both boxes are ticked, and mgxw closes with this bean.

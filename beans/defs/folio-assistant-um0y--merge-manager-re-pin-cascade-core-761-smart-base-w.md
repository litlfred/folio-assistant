---
# folio-assistant-um0y
$schema: bean/1.0.0
title: 'Merge manager: re-pin cascade core#761 → smart-base → who-iris/smart-ra → dth-hrh'
status: in-progress
type: task
priority: high
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T15:35:00Z
parent: folio-assistant-v8bg
tags:
    - handover-2026-11-12
    - merge-window
---

Owner thread: merge manager https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9HtujCofFVVPVPppfDRTSNR.

Cascade onto cat-harness 5244c31 and cat-harness-tools 4216ebb: folio-assistant-core#761 → smart-base → who-iris / smart-ra → dth-hrh. Code-only merge window until 2026-11-12 18:05Z (owner extended "+12hrs window" 06:04Z). Per Q-RERUN-1 B, CI is re-run only right before a merge.

- [x] Merged: cat-harness#1272 (`13:46:44Z`, `5409c2bb12`), #1273 (`13:47:34Z`, `7409a36ab6`), #1274 (`13:49:20Z`, `fb696e273d`), #1259 (`13:50:10Z`, `54b98d393c`); smart-trust#199, #201, #200 (`10:54:55Z`, `30fa68a001`), #203 (`12:51:24Z`), #195 (`12:59:47Z`), #204 (`13:56:27Z`, `9c90cf7036`); cat-harness-tools#1947, #1938, #1941 (`10:37:00Z`), #1952 (`10:37:08Z`), #1945 (`11:05:43Z`), #1943 (`11:36:41Z`), #1950 (`11:40:41Z`), #1953 (`11:50:03Z`), #1954 (`12:49:22Z`), #1957 (`13:40:57Z`, `ad8128c02a`), #1958 (`13:41:06Z`, `174be19f75`), #1959 (`13:41:16Z`, `36627fb32a`), #1955 (`13:49:03Z`, `f6c941a29a`), #1956 (`13:49:08Z`, `a448eb46a6`), #1960 (`13:49:13Z`, `1b4e42f054`); folio-assistant-core#761 (`09:56:37Z`), #764 (`09:57:11Z`), #766 (`11:13:23Z`), #767 (`12:56:35Z`), #768 (`15:27:10Z`, `101f43b9fd`); fhir-harness#384 (`10:12:46Z`), #394 (`11:04:18Z`), #395 (`15:17:21Z`, `02a0fc0382`); smart-base#347 (`10:51:34Z`), #349 (`10:57:29Z`), #346 (`13:30:27Z`), #354 (`13:49:23Z`, `9946a84647`), #355 (`13:51:01Z`, `6976e637c0`); who-iris#247 (`12:33:59Z`), #252 (`12:51:47Z`), #253 (`15:44:04Z`, `a7cde87b15`); smart-ra#241 (`13:53:43Z`); dth-hrh#118, #122 (`12:51:39Z` — re-pinned core to `1874fd5` and `Site publish` succeeded on `main`); dth-phc#41 (`09:44:53Z`); dth-sc#4, #15; folio-assistant#3092 (`11:14:27Z`), #3096 (`13:29:11Z`).
- [x] In flight (now merged): smart-trust#200 (standing re-pin, merged `10:54:55Z`), cat-harness-tools#1941 (merged `10:37:00Z`), smart-base#354 (standing re-pin, merged `13:49:23Z`).
- [x] dth-phc#31 ready to merge.
- [ ] dth-pc#14: move its pins up, plus a small `processes/` change.
- [ ] Waiters on the cascade: smart-ra#242 (bottom-up re-pin follow-up after smart-ra#241 merged at `13:53:43Z`), dth-hrh#119 / #121 / #116 / #69 (`dth-hrh#122` merged and unblocked `dth-hrh` Site publish; `#119` needs full bottom-up layer pins now that `smart-base#346` and `who-iris#247` are on `main`), smart-trust-phw#61, fhir-harness#388, IG publish-on-push rollout.

_2026-11-12T09:45:00Z_ — Filed by thread "Record handover in beans" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9E8Y9ccXJsk3qvGEie1X5Pr), session https://claude.ai/code/session_01Qmmkt7NmLVnjA5oNtkbv3f.

_2026-11-12T09:50:00Z_ — Merge manager's own handover (session https://claude.ai/code/session_01Qmmkt6te9q7bF3KBT2Qq11). Helper scripts: /mnt/project-files/merge-manager/handover/ (m.sh, lk.sh, tapped.txt, hold-repin.txt, render-watch.sh). Corrections and state as of 09:50Z:
- Merged since 09:00Z: smart-trust#199, #201 (#198 closed as superseded); tools#1926, #1921, #1947 (Q-GAME-MRG A); folio-assistant-core#760 (lock-only, Q-LOCK-1 + Q-760); dth-hrh#118, dth-sc#4, #15 (Q-DTH-WAIVE A, corpus gate waived).
- Q-LOCK-1 A (07:39Z): approved code PRs whose only red is lock:coherence may merge, with a comment citing the card.
- GDHCN game (owner priority): smart-trust Site publish run 43189576552 (main 414f5b93). When green, check https://litlfred.github.io/smart-trust/en/cat-harness/apps/onboarding-game/ and send the owner the URL (see folio-assistant-sdd0).
- fa: #3088 closed and repin-train.yml dispatched at 09:37Z. The verdict merges the new train on green, then update-branch fa#3075.
- Cascade: core#761 (87c666a3) is in tests. Merge on green or under Q-LOCK-1, then agent ab3983942b67cdaf6 (or a new one) does smart-base → who-iris + smart-ra (Q-RA-PIN A, pins only) → dth-hrh#119. Also add a smart-hiv re-pin (Q-BIBNAV-2; tell the bib-nesting thread …G6g9EGbG9kGSg8u3W5fieF when IG re-pins merge and publish). core#749 overlaps.
- tools: merge #1941 (update-branched 09:19Z), #1943 and #1945 (update-branched and labelled release; tell the IRIS source-fixes thread …3WQmGmifCFfexR63a3h4wh), and #1952 on full green. Then update-branch #1916, #1932, #1934 and #1936 one at a time; #1936 before cat-harness#1259.
- Not ours (the ArchiMate thread merges these itself): tools#1950, core#764, demo#133, dth-hrh#121, dth-phc#41, dth-sfp#10. Ours: the demo re-pin of tools after #1950.
- Rollout thread ready (lock red because mains moved; it refreshes): smart-base#346, smart-immunizations#136, smart-trust-phw#60, who-iris#247.
- fhir-harness#384: one new failure, a compose-docs real-tree timeout. Update-branch after #1941, then merge.
- dth-pc#14: the owner runs /mnt/project-files/merge-manager/content-review/dth-pc-14-repin-command.md (Q-DTH-PC-TRUST A; the consent records are the owner's own), then merge on full green.
- smart-ra drafts #154 #185 #190 #191 #192 #195: Q-RA-VAL-2 A once only corpus-gate is red. They may wait for the smart-ra re-pin (upstream-pins). Close #241 then.
- No open cards in the merge manager thread.

_2026-11-12T09:44:00Z_ — smart-trust publish 43189576552 FAILED: injection check refuses 14 object SVGs + hcert-demo script (no trustedScripts). Publish-on-push thread card Q-INJ-2 (img now, SVG allowlist later); merge its fix PR under the owner game override, then re-check the game URL.

_2026-11-12T09:58:00Z_ — Merge manager role taken over by session https://claude.ai/code/session_01EucfRpkvK7d4FJyuqypQzm (owner card Q-TAKE-1 = A). The old thread's helpers (m.sh, lk.sh, tapped.txt) are not in this session; it works over REST.
- Live 09:50Z: core#761 (87c666a3), tools#1941/#1943/#1945/#1952 and smart-trust#200 all still running CI, nothing red yet. smart-trust Site publish 43189576552 failed (injection QA: <object> diagrams and an untrusted hcert script); the fix is smart-trust#203, held for Q-INJ-2. The fa re-pin train PR is not open yet.
- Owner 09:57Z: smart-ra / dth-* content PRs that need committee or author review are NOT merged; only functional PRs. The smart-ra drafts (#154 #185 #190 #191 #192 #195) are on hold despite Q-RA-VAL-2 A.

_2026-11-12T13:42:00Z_ — Cascade progress update:
- **Merged**: `folio-assistant-core#761` (`09:56:37Z`), `#764` (`09:57:11Z`), `#766` (`11:13:23Z`), `#767` (`12:56:35Z`); `cat-harness-tools#1941` (`10:37:00Z`), `#1952` (`10:37:08Z`), `#1945` (`11:05:43Z`), `#1943` (`11:36:41Z`), `#1950` (`11:40:41Z`), `#1953` (`11:50:03Z`), `#1954` (`12:49:22Z`); `fhir-harness#384` (`10:12:46Z`), `#394` (`11:04:18Z`); `smart-trust#200` (`10:54:55Z`), `#203` (`12:51:24Z`), `#195` (`12:59:47Z`); `who-iris#247` (`12:33:59Z`), `#252` (`12:51:47Z`); `smart-base#347` (`10:51:34Z`), `#349` (`10:57:29Z`), `#346` (`13:30:27Z`); `dth-hrh#122` (`12:51:39Z` — re-pinned `folio-assistant-core` to `1874fd5`, and `dth-hrh` `Site publish` run `43221797254` succeeded on `main`); `dth-phc#41` (`09:44:53Z`); `folio-assistant#3092` (`11:14:27Z`), `#3096` (`13:29:11Z`).
- **Remaining in cascade**:
  - `smart-ra#241` (`e25b14cd`): re-pins `cat-harness` + `cat-harness-tools` + library JSON-LD; all 4 test/gate shards passed, `No new failures` red on 22 lower-layer gates (tracked in `smart-ra#242`, ready for full bottom-up re-pin now that `smart-base#346` and `who-iris#247` have merged).
  - `dth-hrh#119` (`6c9fd872`): re-pins only `cat-harness`, `No new failures` red on 11 opt-in/lock-consistency gates; needs full bottom-up pins (`smart-base#346`, `who-iris#247`, `smart-ra`). `dth-hrh#121` (`f4132451`, ArchiMate overlay) and `dth-hrh#116` (`f43eb011`) are `CONFLICTING` (`DIRTY`) after `dth-hrh#122` merged.

_2026-11-12T15:35:00Z_ — Round 21 merges recorded:
- **Merged in Round 21**: `cat-harness#1272` (`13:46:44Z`, `5409c2bb12`), `#1273` (`13:47:34Z`, `7409a36ab6`), `#1274` (`13:49:20Z`, `fb696e273d`), `#1259` (`13:50:10Z`, `54b98d393c`); `cat-harness-tools#1957` (`13:40:57Z`, `ad8128c02a`), `#1958` (`13:41:06Z`, `174be19f75`), `#1959` (`13:41:16Z`, `36627fb32a`), `#1955` (`13:49:03Z`, `f6c941a29a`), `#1956` (`13:49:08Z`, `a448eb46a6`), `#1960` (`13:49:13Z`, `1b4e42f054`); `folio-assistant-core#768` (`15:27:10Z`, `101f43b9fd`); `fhir-harness#395` (`15:17:21Z`, `02a0fc0382`); `smart-base#354` (`13:49:23Z`, `9946a84647`), `#355` (`13:51:01Z`, `6976e637c0`); `smart-trust#204` (`13:56:27Z`, `9c90cf7036`); `smart-ra#241` (`13:53:43Z`).

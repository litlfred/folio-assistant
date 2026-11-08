---
# folio-assistant-lgwt
$schema: bean/1.0.0
title: 'Review-log watcher: standing rules, how to watch, current state (handover bean)'
status: in-progress
type: task
priority: high
created_at: 2026-11-02T18:20:00Z
updated_at: 2026-11-08T07:02:00Z
parent: folio-assistant-dthl
tags:
    - review-log-watch
    - handover
---

## How to resume (read this first)

This bean is the watcher's durable memory. It stays open; it is never completed while review logs exist.

1. Read this whole bean, newest comment last. The last comment is the current state.
2. Check the watcher thread (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9WU5PAN9S9dXroMX9Twpkac). If its last activity is more than 10 minutes old while a log row changed, or more than 2 hours old at all, it is stalled: take over.
3. Re-arm the wakes (below), then poll every log once.
4. After each poll that changes anything, append one comment: `_<UTC time>_ — <what changed, links>` and bump `updated_at`. Commit straight to the beans state branch `cat/cat-harness/beans`.

Resume prompt: "read bean folio-assistant-lgwt on branch cat/cat-harness/beans of litlfred/folio-assistant and continue the review-log watch".

## The logs (Google Sheets ids)

- DTH-HRH 136BxUK15IUKEm2u-H6rpUkFac6754aRWTeJFe_UKbdU
- DTH-PC 1g9nj4rjK23oBs2of_jMogUcN1y0D6QUTMae-UhKwpV4
- DTH-SC 1ZpIOAgRXXpzMKauSzz11nd27VoCTApiMp3rdSL26x9Y
- DTH-PHC 1ACmiSvHK2kYlqaL0--p2u4Op7g4R1_BzgNFuW7QUs3Y
- RA (DPI-H) 1TNr5VP1oiE9N0Wd-XCgmUIdishb_Yl6Rm39mNx-_GQY (RCS tab, cols O:Q = Ready for agent / Dispositions confirmed / Ready for merge)

## How to watch

- Poll every 1 minute with a send_later chain (queue the next poll FIRST; send_later is one-shot), plus an hourly scheduled task that re-arms the chain if it breaks.
- Each poll runs the review-log-watch tool first; state in ~/.cache/review-log-watch/<sheet-id>.json.
- New "Ready for agent = Yes": write the Agent step (reading) at once, before any other work.
- New blue feedback: hand it verbatim to the row's owning thread and say so in the Feedback (agent) cell. If the owner is not working, pick the work up.
- Stalled = feedback or Ready changed more than 10 minutes ago with no Agent step, or no step for 2 hours: ask the owner once, then take over.
- Ready for agent / Ready for merge changes: hand CS id, cell and time to the owning thread (person steps come only from a card tap or a sheet cell).
- Long PR work goes to the owning thread; the watcher keeps polling.

## Standing rules

- Feedback (agent) cells: plain text, bold tags only, ask then Status:/Next:, with PR, preview and section links. Agents work ONLY in Selected Sections.
- Previews refresh on upstream main change and on human feedback. Preview links only once live.
- Change sets are human-controlled: people create and split CS rows; new public comments are triaged into existing or new CS with suggested committees.
- Committee content never merges; keep their issues open (dth-hrh #53, #47). CS- items are content.
- Finished CS rows: hidden + struck through; closing = close the GitHub issue + mark the row Closed.
- Code.gs comes only from its copy page https://claude.ai/artifact/MXNQcLMzLYqq5us5x6phGd. Never ask the owner to run updateFromGitHub.
- DTH-HRH: the 2015 MDS is not authoritative; never reference it there.
- ArchiMate is never a glossary/SKOS source unless it was ingested. IRIs use slashes, never '#'.
- smart-ra Pages publishes at least 15 minutes apart.

## Current state (2026-11-02 18:07Z)

- Watcher thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9WU5PAN9S9dXroMX9Twpkac
- Owner to-dos: approve or change CS-001 wording (DTH-HRH log row 3); paste Code.gs ff855ec7 (not yet pasted); paste Stub.gs into each log (bean 65aj).
- CS-007 owner thread (dth-hrh#88 NHWA overlay): https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G998q7ycpNcyZETyhTTp9ETxW
- Short-term merge drain: bean folio-assistant-drnh.

_2026-11-02T18:20:00Z_ — Filed from the coordinator handover (owner asked 18:08Z for a semi-permanent log-watcher bean used as memory and handover for stalled agents). Thread https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9CGT3dPmJTAXBao9ddv9dw4

_2026-11-02T19:47:01Z_ — The watcher thread is stalled (owner 19:46Z). Taken over by sibling https://claude.ai/code/session_01EucfRmAyZLEuxMG8wkPi5r. Note: from the coordinator session the Google Drive connector fails ("does not support dynamic client registration"), so the sheets may be unreadable until the connector is reconnected.

_2026-11-02T19:52:34Z_ — Taken over again by https://claude.ai/code/session_01EucfRmAyZLEuxMG8wkPi5r (restarted after unarchive). Sheets NOT readable from this session: the google-drive MCP server failed to connect (CONNECTION_CLOSED), and the environment network policy blocks docs.google.com (proxy 403), so even a public CSV export cannot be fetched. No polls were run and no wakes armed. Watch is paused until the owner reconnects the Google Drive connector (claude.ai Settings → Connectors); then resume with the prompt above.

_2026-11-02T19:56:44Z_ — The owner reconnected Google Drive. From the coordinator session, Google_Drive download_file_content (exportMimeType text/csv) now returns the full Contributor Feedback tab of the DTH-HRH log; read_file_content returns only header samples. Watch tab: cells hash z5fwp9, checked 19:55Z. DTH-HRH state: new row CS-022 (central/federated/distributed registry, physical vs conceptual; section 1.3) has no issue and no agent proposal, and needs step 2, a proposal (committee content). CS-002 and CS-003 Needs you. CS-001 stale proposal awaits the owner (draft dth-hrh#94). CS-007, 014, 015, 016, 017, 018 and 021 in committee review. The owner's answer at 19:56Z ("yes, merge #980 #959 #981 on green") was relayed to session_01EucfRo4LGSMzJn5kq6PucY. Watcher sibling session_01EucfRmAyZLEuxMG8wkPi5r was asked to retry.

_2026-11-02T19:58:01Z_ — Google Drive connector now connected in https://claude.ai/code/session_01EucfRmAyZLEuxMG8wkPi5r: the logs are READABLE (DTH-HRH Contributor Feedback read via CSV export; Watch!G1 hash z5fwp9, checked 2026-11-02 19:55Z). But the Drive connector cannot WRITE cells, so the Agent step, new issue rows and hiding closed rows (skill review-log-watch steps 3–5) cannot be done. Owner chose (card, 2026-11-02T19:58:01Z): stop until a Google Sheets connector with cell-write access is connected and a new session is started. No polls armed.

_2026-11-02T20:02:26Z_ — Read-only snapshot of all five logs (the owner shared the links; nothing written). Pending work no agent has taken up: DTH-HRH CS-022 (new row, needs a proposal; committee content), CS-007 (owner feedback "Need plan of changes to make / Dont know where link is. agent stalled"). DTH-PHC CS-006 (owner feedback "they need to be linked so no content drift. not sure of options"); CS-001 and CS-002 are Ready for agent = Yes with the agent's Decision needed unanswered. DTH-PC CS-001 new owner question "why so many changes in review?" (answer: #7 is stacked on scaffold PR dth-pc#1, so the review page shows the scaffold until #1 merges). DTH-SC: CS-002 and CS-004 await the owner's letter; nothing new. RA: Ready for agent = Yes on CS-004/052/060/097/194/254/283; CS-052 and CS-254 have Ready = Yes but no committee answer to the agent's question; RA Watch tab hash last written 2026-10-31 08:10Z (script not refreshing). Owner asked the agent to pick up CS-006 and CS-007; add_repo for litlfred/dth-hrh was refused by the session's permission classifier, and the sheets still cannot be written (the Drive connector has no cell write; Code.gs fetches nothing from GitHub).

_2026-11-08T06:55:00Z_ — Watcher still stopped (since 2026-11-02T19:58Z, waiting on a Sheets connector with cell write). This session now lists Google Sheets tools (get_values, update_values, append_values), so the blocker may be gone; no poll was armed here. The merge master pass of 2026-11-08 asked the owner whether to restart the watch. Session https://claude.ai/code/session_01Qmmkt6te9q7bF3KBT2Qq11

_2026-11-08T07:02:00Z_ — Correction to the 06:55Z line: the DTH watch is NOT stopped. Watcher thread cmsg_017WNUkNK8kdDziPK58Pv6G9WU5PAN9S9dXroMX9Twpkac read HRH, PC, SC and PHC at 06:25–06:36Z today. Only the DPI-H watch is stopped, waiting on an owner card. Do not start a second DTH watcher. Session https://claude.ai/code/session_01Qmmkt6te9q7bF3KBT2Qq11

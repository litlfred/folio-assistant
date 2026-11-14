---
# folio-assistant-3bk1
$schema: bean/1.0.0
title: 'IG publish-on-push rollout: re-pins after the cascade, and the smart-trust injection gate'
status: in-progress
type: task
priority: high
created_at: 2026-11-12T09:55:00Z
updated_at: 2026-11-14T16:30:00Z
parent: folio-assistant-v8bg
tags:
    - handover-2026-11-12
    - merge-window
---

Owner thread: "Finish publish-on-push rollout PRs" https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9GSmgusK4K8TCWBQfu5rM7S, session https://claude.ai/code/session_01Qmmkt6TSbSJzATzKNZujVV. Assigned by the merge manager via the coordinator 08:34Z: land the IG publish rollout after the re-pin cascade (folio-assistant-um0y). Never merges; reports heads to the merge manager thread, which merges on green or under Q-LOCK-1.

- [x] smart-trust#198 re-pinned (a23eb246) and merged 09:13Z; Chromium error gone.
- [x] who-iris#247: merged main (lock/config conflict), re-pinned to mains, head ef9f1dbd.
- [ ] smart-trust main Site publish (run 43189576552) FAILED in ig-site:compose: fhir-harness injection QA refuses 15 `<object>` SVG embeds and the hcert-demo `<script>`. Draft fix smart-trust#203 (issue #202): `<img>` for the diagrams, `contentTypes.ig.trustedScripts: ["hcert-demo/hcert-demo.js"]` (Q-TRP-3). Held on owner card Q-INJ-2 (A img now / B trusted-SVG allowlist in fhir-harness / C A then B; recommended C). The onboarding SVGs carry drill-down links an `<img>` drops. folio-assistant-sdd0 (game page check) waits on this.
- [ ] After core#761 and smart-base's cascade step merge: re-pin smart-base #346 #349, smart-immunizations#136, smart-immunizations-uganda#27, smart-ips-pilgrimage#66, smart-trust-phw#60, dth-hrh#116, folio-assistant-core#749 to mains (core ≥ 05f5525, tools ≥ 1abe68e for Q-BIBNAV-2), then report each head to the merge manager. smart-ra#241 to be closed by the merge manager (Q-RA-PIN).
- Method: merge main in (explicit refspec fetch), delete stale gitignored mounts, `remote-mount.ts --seed h=repo@mainsha --consent-by litlfred` with the 16:05Z window + 06:04Z "+12hrs window" (cmsg_017WNUkNK8kdDziPK58Pv6G9NGjshFZ8oRGEiZGHLNssq2) as evidence, then `remote-mount.ts`. Layers cache lands on claude/cat-layers/<key>; every PR branch has the layers-move caller.

_2026-11-12T09:55:00Z_ — Filed by the rollout thread.

_2026-11-14T16:30:00Z_ — All rollout PRs merged (dth-hrh#116 closed). smart-trust#203 merged (img swap; fhir-harness now has trustedSvgs, so the onboarding `<object>`s could return). Five IG mains had red Site publish; fixes, all labelled release and ready, none waives a check:
- smart-trust: trustlist.jsonld invalid JSON → smart-trust#238 (syntax only; on an owner card via the merge manager). Its #fa-navbar-row refusal clears with the open re-pin smart-trust#236 (tools has b75950d7 rail-pass fix + bfbbcbad report-not-refuse).
- smart-immunizations-uganda: #fa-navbar-row → re-pin smart-immunizations-uganda#39 (dad7203).
- smart-base, smart-trust-phw: stale qa/ig-content-qa.json → re-review of only the changed texts, after rebuilding the reviewed bundle bit-for-bit from the review commit + the AST cache commit of that time: smart-base#407 (4 of 7284 changed), smart-trust-phw#79 (3 of 10041; only terminology.hl7.org 6.1.0→7.1.0 links).
- smart-immunizations: smart-base pin bfea0cc9 lacked the l1-extraction-pages Tool (moved into a subgraph by 234fb073, back in tools/ by e79eb928) → re-pin smart-immunizations#145 (1b520ad).
Next: confirm each site publishes after its merge; then tell the bibliography (…G6g9EGbG9kGSg8u3W5fieF) and game threads.

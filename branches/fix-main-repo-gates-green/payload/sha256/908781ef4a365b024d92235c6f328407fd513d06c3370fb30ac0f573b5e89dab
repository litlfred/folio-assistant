---
# folio-assistant-un6l
$schema: bean/1.0.0
title: 'smart-trust-demo in the six UN languages: journeys viewer, docs pages, ArchiMate'
status: completed
type: task
priority: normal
created_at: 2026-11-16T09:20:00Z
updated_at: 2026-11-24T08:45:00Z
parent: folio-assistant-v8bg
tags:
    - translation
    - smart-trust-demo
---

Owner thread: "Translate smart-trust-demo into 6 UN languages" https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9JBstZzkWKmjWConPFCDG7y, session https://claude.ai/code/session_01Qmmkt8x5LVKCLo88LZ6Nyz. Owner ask (11-16 07:32Z): "i want all 6 UN here https://worldhealthorganization.github.io/smart-trust-demo/". Scope card answered B (11-16 08:14Z): the demo (IG, docs, journeys, workshops, personas, screens) plus the ArchiMate pages; the harness pages stay English.

Causes: the journeys viewer had no locales; docs-derived IG pages kept their catalogues at the docs path, which fhir-harness did not read; ArchiMate pages are English-only and mostly drawn in the browser from model.json.

- [x] cat-harness-tools#2349 (issue #2348): generic rendered-HTML gettext (pipeline/html-po.ts, svg-label-po.ts), journeys viewer per-locale pages, T() runtime catalogue; "I want to …" stories; diagram-links &#x27; fix. Draft, CI green.
- [x] fhir-harness#448: `<!-- translations: <path> -->` catalogue alias for copied pages. Draft.
- [x] WHO smart-trust-demo#7 (issue), #8 source PR (ig_gen alias, journeys-viewer.pot, fresh qa/ig-content-qa.json), #9 zh, #10 es, #11 fr, #12 ru, #13 ar (each journeys-viewer.po, blind round trip adjudicated: 7/17/8/12/8 drift fixes; fr "thaï" and ru "таец" leftovers fixed). #14: English source errors for the owner.
- [x] cat-harness-tools#2351 (issue #2350): ArchiMate pages per locale (model.<l>.json, <view>.<l>.svg, am-i18n). Stacked on #2349.
- [x] translations/<l>/archimate.po ×5 (1,384 msgids each; ~120 from memory), round trip, then per-locale PRs on WHO smart-trust-demo.
- [x] After #2349, #448, #2351 merge: re-pin cat-harness-tools and fhir-harness in smart-trust-demo #8, merge order #8 → #9–#13, publish gh-pages, screenshot each locale.

Merge order for the owner: tools#2349 + fhir-harness#448 → (re-pin) smart-trust-demo#8 → #9–#13; tools#2351 → ArchiMate locale PRs.

_2026-11-16T09:20:00Z_ — Filed by the translation thread.

_2026-11-24T08:45:00Z_ — Done, checked from outside: cat-harness-tools#2349 and #2351 heads are both in tools `main`; WHO smart-trust-demo `main` (20a7590) carries `translations/{ar,es,fr,ru,zh}/archimate.po` and `journeys-viewer.po`; its gh-pages (published 2026-11-23 14:13Z) has 3,796 journeys/ArchiMate pages per locale, and each locale's ArchiMate element page answers 200 with `lang` set and translated text. Filed on the state branch from folio-assistant#3171, which wrote it to `beans/defs/` on `main`, where the store no longer lives.

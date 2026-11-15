---
# folio-assistant-3c99
$schema: bean/1.0.0
title: 'Memory: Dead journey actor/example links (index linked root <Type>-<id>.html) — fhir-harness #380/#381, cat-harness-tools #1894/#1895 self-address link check'
status: completed
type: task
priority: low
created_at: 2026-11-11T13:06:38Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `self-address-dead-links.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Dead journey actor/example links (index linked root <Type>-<id>.html) — fhir-harness #380/#381, cat-harness-tools #1894/#1895 self-address link check

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G9DZcSF17uZ3WT1Qt7fKNv2j.

Root cause: fhir-harness build-ig-indexes used the layer iriBase as published base and ast-to-artifact-index publishedFor wrote Publisher URLs (<base>/<Type>-<id>.html/.xml/.ttl). The harness site serves artifact/<Type>-<id>.html and root .json only. journeys artifactPage prefers published.html.url, so every actor/example link 404'd. Fix PR fhir-harness#381 (PublishedLayout publisher|site; iriBase = site).

Site link check never looked at absolute self-URLs (targetOf skips schemes). cat-harness-tools#1895: checkLinks selfAddress check (reported, not gated yet), assets/site-qa/links.json for QA, render-bpmn step titles -> <process page>#step-<id> (was the same page), journeys anchorHeadings ids.

Affected (gh-pages scan): smart-trust-demo, smart-trust, smart-immunizations, smart-ips-pilgrimage, smart-trust-phw. Need re-pin of both + republish after merge. Then turn the self-link gate on. Other patterns seen: folio-assistant lane->role pages (801), dth-phc glossary IRIs (20).
Scan trick: bare git fetch --depth 1 gh-pages, list tree, grep html (github.io blocked by proxy). Local tests: sibling clones + /home/user/package.json with merged deps + node_modules/@litlfred symlinks (cat-harness-tools, bootstrap-tools, cat-harness).
Open: user wants J3 "retrieves (smart-trust-phw retrieve-pki-material)" linked -> https://litlfred.github.io/smart-trust-phw/artifact/Requirements-retrieve-pki-material.html (card Q-LNK-1).
- 13:2xZ: Q-LNK-1 = A. smart-trust-demo issue #124, draft PR #125 (claude/j3-retrieve-pki-link, 95074fc1): J3 doc + precondition and J4.1 precondition link the phw requirement; pots regenerated, .po left alone; SUSHI clean. Content PR: merge card when green.
- 13:4xZ: tools#1895 a344cbc also scans .svg (diagramMisses / inDiagrams in links.json). Card Q-LNK-2 (merge demo#125, green). Pilgrimage home figure links: smart-ips-pilgrimage #67/#68 (archimate/build.py -> artifact/CodeSystem…#IPS.HAJJ.TRANSACTION-<tx>); concept-row anchors in fhir-harness#381 c1a9a79.
- Crawl (/tmp scan crawl.py, all .html+.svg on gh-pages): every site has 26 dead links in cat-harness assets/img/uml/harness-object-model.landscape.svg -> ../../../glossary/ (glossary moved to en/folio-assistant-core/glossary/; gen-object-model-uml.ts). smart-ccc 2109 relative (Publisher-style pages missing), smart-anc 107, smart-hiv 65.
- 13:5xZ: demo#125 MERGED (Q-LNK-2 A). Q-LNK-3 = A: cat-harness#1247/PR#1248 (object-model .puml links via termPageRoute + re-rendered SVGs), tools#1910/PR#1911 (kg-export roleHome + skillHome for lanes/steps/global tasks). Content debt tracked in tools#1912 (ccc/anc/hiv/fp/html-jtd). Crawl report: /mnt/project-files/links/site-link-crawl-2026-11-11.md. All code PRs handed to merge manager.
- 18:02Z: tools#1895 MERGED (after runner apt outage 13:59Z+, fix tools#1916). Outage re-runs handed to merge manager.
- 18:02Z: tools#1911 MERGED.
- 11-12 00:45Z: cat-harness#1248 MERGED. Open: fhir-harness#381 (lock-coherence drift), pilgrimage#68 (content card pending).
- 11-12 01:1xZ: pilgrimage#68 merged main (rebuilt .archimate), green+clean; card Q-LNK-4 posted.
- 11-12 06:04Z: pilgrimage#68 MERGED. Only fhir-harness#381 left (lock-coherence; merge manager). Then re-pin+republish demo, smart-trust, immunizations, pilgrimage, phw; then gate self-links.

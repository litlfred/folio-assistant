---
# folio-assistant-9poj
title: bootstrap is greyed out because it has no href, not because it is a dependency
status: completed
type: bug
priority: high
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T22:23:06Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21: "Boostrap should be clicable. even though it doesnt render itself, cat-bootrap does take over (double ccheck) render responsibles of bootrstraps json(ld) and documentation (bootrsap does not have docs/ b/c that a cat-harness concept)" and "i dont know why the dependecioes are gerey-ed out."

CORPUS CHECK — the premise is wrong in the reader's favour, and the real cause is worse. bootstrap is 'instantiated: true' in docs/_data/harness.json; it is NOT in the Dependencies group at all. It renders grey because 'href: null', so nav_footer_custom.html emits '.fa-harness-tab__body--unlinked' (a span, not a link). The dependencies are a SEPARATE collapsed <details> and were probably not even on screen.

Why href is null: tileFor found no candidate. bootstrap has no docs/ of its own (correct — the owner confirms docs/ is a cat-harness concept), and its one declared graph 'cat-harness' has NO PUBLISHED VIEWER, so the '/<kind>/<instance>/' route has nothing at it either. pb04's rule then fired correctly: 'a tab with nowhere to go is NOT a link.'

So the fix is NOT in the template. cat-harness must actually publish the viewer for bootstrap's graph — which is the render responsibility the owner says it already takes over. Verify that claim before building: the finding says the page does not exist.



## Summary of Changes

Bootstrap's navbar tab is a link again: href /bootstrap/initialization.html,
hrefKind 'handled'.

### The diagnosis held, and nothing was broken

bootstrap is instantiated:true and correctly has NO viewer — it declares a
renderExemption, the owner's own 2026-09-20 ruling. harness-tiles computes
href = folio ?? firstViewer, both undefined, so pb04's 'a tab with nowhere to
go is not a link' fired and produced a greyed <span>. Neither the declaration
nor the rule was wrong. What was missing: the exemption said 'I do not render
myself' without saying 'so go here instead'.

### The fix is a third fallback, declared

RenderExemption gains optional `reachableAt` — repo-relative, under the
site-owning harness's site dir. harness-tiles resolves it only when folio and
firstViewer are both absent, so it cannot outrank a real folio root.

DECLARED rather than hardcoded, for the reason the exemption itself gives: a
checker naming one instance states a rule true only for the instance somebody
remembered (hfkl).

BOTH WRONG-DECLARATION CASES ARE FINDINGS, not silent unlinks: a path that is
not a file (flh4's defect — the declaration is wrong), and a path that exists
but sits outside the published site (it would 404 anyway, and an existence
check alone would pass it). Absent reachableAt stays unlinked, which is right
when nothing is published about the instance.

### The double-check the owner asked for: HALF YES

'cat-bootrap does take over (double ccheck) render responsibles of
bootrstraps json(ld) and documentation'

- DOCUMENTATION: yes. cat-harness/docs/bootstrap/initialization.md is
  committed and renders at /bootstrap/initialization.html. That is what the
  tab now opens.
- JSON-LD: NO. Zero .jsonld files exist anywhere under bootstrap/, so the
  exemption's `owes` clause — which the owner called this layer's whole
  existence — is unmet. Tracked as sbck rather than papered over by this link.

### Tests

Five, and three of them are the negative cases: no reachableAt, a path that
is not a file, a path outside the site. Plus a control — an instance with its
own site ignores reachableAt — without which a rule that always returned
'handled' would pass.

The repo's own site-dir guard caught the first version of those tests
hardcoding 'docs'. They read it from the declaration now.

Verified: bun run gates 96 pass, harness-tiles 37 pass.

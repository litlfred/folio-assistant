---
# folio-assistant-9poj
title: bootstrap is greyed out because it has no href, not because it is a dependency
status: todo
type: bug
priority: high
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21: "Boostrap should be clicable. even though it doesnt render itself, cat-bootrap does take over (double ccheck) render responsibles of bootrstraps json(ld) and documentation (bootrsap does not have docs/ b/c that a cat-harness concept)" and "i dont know why the dependecioes are gerey-ed out."

CORPUS CHECK — the premise is wrong in the reader's favour, and the real cause is worse. bootstrap is 'instantiated: true' in docs/_data/harness.json; it is NOT in the Dependencies group at all. It renders grey because 'href: null', so nav_footer_custom.html emits '.fa-harness-tab__body--unlinked' (a span, not a link). The dependencies are a SEPARATE collapsed <details> and were probably not even on screen.

Why href is null: tileFor found no candidate. bootstrap has no docs/ of its own (correct — the owner confirms docs/ is a cat-harness concept), and its one declared graph 'cat-harness' has NO PUBLISHED VIEWER, so the '/<kind>/<instance>/' route has nothing at it either. pb04's rule then fired correctly: 'a tab with nowhere to go is NOT a link.'

So the fix is NOT in the template. cat-harness must actually publish the viewer for bootstrap's graph — which is the render responsibility the owner says it already takes over. Verify that claim before building: the finding says the page does not exist.

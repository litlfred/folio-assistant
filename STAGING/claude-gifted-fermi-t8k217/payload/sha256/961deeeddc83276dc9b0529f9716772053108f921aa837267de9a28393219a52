---
# folio-assistant-x78e
title: 'smart-immunizations landing: Summary heading has a wrong feedback link and no section edit link'
status: todo
type: bug
created_at: 2026-10-06T05:56:52Z
updated_at: 2026-10-06T05:56:52Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06, on https://litlfred.github.io/smart-immunizations/ : "was bad feedback/shout link. there is no edit link" — and: "there is one at the very bottom of the page, but no context aware edit link". So the page-level edit link exists in the footer; what is missing is the per-heading ✎.

The "Summary" heading shows only 📣, and its link is:

    https://github.com/litlfred/smart-immunizations/issues/new?title=Feedback: Summary — About this implementation guide
      &body=**Page:** https://litlfred.github.io/smart-immunizations/#about-this-implementation-guide
            **Section:** About this implementation guide
            **Source:** https://github.com/litlfred/smart-immunizations/blob/main/input/pagecontent/index.md

Against mftp's spec (each heading gets ✎ = its source line, blob/<branch>/…#L<n>, and 📣 = a pre-filled issue with page, section and source line), there are four defects:
1. no context-aware ✎ on the heading (only the page-level edit link at the very bottom);
2. the title pairs "Summary" with a different section ("About this implementation guide"), so the heading-to-section mapping is wrong;
3. the Page anchor is #about-this-implementation-guide, not the Summary heading's own id;
4. the Source link has no #L<n> line number.

## Done when
- [ ] on the built smart-immunizations landing page, every heading has ✎ to its own source line and 📣 naming its own section and anchor
- [ ] root cause recorded (why ✎ is dropped and the section is mis-resolved on this page)
- [ ] a test covering a heading like this one (index.md, the IG's first page) fails on the old behaviour

Related: mftp, whose spec defines the ✎ / 📣 heading links.

---
$schema: folio-fsh-guts/v1
title: "smart-base's pin of smart-kg: the external-schema record, its terms snapshot and the script that derived it"
kind: retired-code
movedOn: 2026-10-23
movedFrom: "litlfred/smart-base:{smart-base/scripts/pin-smart-kg.ts,smart-base/external-schemas/README.md,smart-base/external-schemas/who-smart-kg.json,smart-base/external-schemas/who-smart-kg.terms.json}"
summary: >-
  smart-base pinned litlfred/smart-kg by commit (66a9b1393fd7, bean pebe) and
  snapshotted the class ids of its L1 and L2 layers so document kinds could
  check `modelledBy` offline. smart-kg is deprecated (owner, 2026-10-16). On
  2026-10-23 the owner chose to keep the class list as smart-base's own and
  retire the copy script and the pin. The classes now live in
  smart-base/code-lists/sgkg-l1-classes.json and sgkg-l2-classes.json, read
  by smart-base/scripts/kg-classes.ts. The `--validate <smart-kg checkout>`
  option of extract-smart-kg-l1.ts went with the pin. Packed from smart-base
  main 96c018f47e with git archive.
---

# smart-base's smart-kg pin

`smart-base-smart-kg-pin.tar.gz` beside this file holds the four files as they
stood on litlfred/smart-base main at `96c018f47e`, under a `smart-base/`
prefix (so the paths read `smart-base/smart-base/...`).

The class ids were carried over unchanged: the two new code lists hold the
same 16 L1 and 13 L2 classes the terms snapshot held, checked one for one
when they were written.

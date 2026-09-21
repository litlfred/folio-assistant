---
# folio-assistant-40fl
title: 'docs-site is red on main: a foreign instance''s export has no publication base, so kg-export exits 1'
status: in-progress
type: task
priority: high
created_at: 2026-09-21T13:11:53Z
updated_at: 2026-09-21T13:40:00Z
parent: folio-assistant-vke6
---

## What

`docs-site.yml` fails on `main`. The site has not published since **11:31 on
2026-09-21**, the commit (`f4366814cc`, bean `pve3`, issue #686) that made
`kg-export` multi-instance and added a second export step:

```
bun run cat-harness/scripts/kg-export.ts --instance ./cat-bootstrap --out "./_site/cat-bootstrap.jsonld"
```

That step exits 1:

```
1 source(s) could not be read:
  ✗ no canonicalUrl in harness.json and no --base-url given:
    @id values are document-relative and will not dereference
```

## Why

`exportIdentity` reads `canonicalUrl` off **the instance being exported**.
`cat-bootstrap` declares none, *deliberately* — its own declaration says at
length that it has no site, and that "this instance's canonicalUrl is
cat-harness's site, not cat-bootstrap's".

But its graph **is** published, into this site, at
`<base>/cat-bootstrap.jsonld`, by the very step that was failing. So
*"the exported instance declares no base"* was never the same question as
*"this document has no base"*.

The publication base belongs to the **site doing the publishing**. Two lines
above, `stub` already makes exactly this argument about `package.json` — "a
nested instance has none, and reading one from there would throw on exactly the
instances this parameter exists for". It was not applied to `canonicalUrl`.

## The test that stayed green through the outage

`publishedPaths()` in `kg-export.test.ts` lists `cat-bootstrap.jsonld` as a
path the deploy writes, with a comment saying that if the step goes, "this line
makes it a test failure rather than a 404 nobody sees". It did not fire: **a
path the workflow names is not a step that succeeds.** Nothing asserted
`problems` was empty for a foreign export.

This is the `xom7` shape — *a red workflow looks exactly like a green one from
in here* — and it went unnoticed for two hours across four merges.

## Done when

- [x] A foreign instance's export falls back to the publishing instance's
      `canonicalUrl`; an instance declaring its own keeps it
- [x] The diagnostic names the file it actually read, not the excised
      `harness.json`
- [x] A test asserts an absolute `@id` for **every** declared instance, derived
      rather than listing `cat-bootstrap`
- [x] A test asserts `problems == []` for a foreign export
- [x] Both falsified by planting the old behaviour
- [ ] `docs-site` green on `main`

## Not this bean

Whether `cat-bootstrap` should declare a `canonicalUrl` of its own. It should
not — it has no site — and the fallback is what makes that stay true without
breaking the publish.

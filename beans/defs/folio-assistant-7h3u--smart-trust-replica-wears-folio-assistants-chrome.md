---
# folio-assistant-7h3u
title: smart-trust replica wears folio-assistant's chrome, not the WHO IG's branding
status: todo
type: task
priority: normal
created_at: 2026-09-30T20:04:11Z
updated_at: 2026-09-30T20:04:36Z
parent: folio-assistant-o3xy
---

**Owner, 2026-09-30:** *"does not make css/branding/style of
worldhealthorganization.github.io/smart-trust from
github.com/worldhealthorganization/smart-trust"*

Observed at <https://litlfred.github.io/folio-assistant/smart-trust/>: dark
background, folio-assistant's left rail and its purple **▾ Folio** handle. The
published WHO IG it replicates uses the HL7 IG-publisher template with WHO
branding. Screenshot supplied by the owner.

## QUEUED, not started

Per the owner's standing instruction — *"in chats if I discuss a new task I
want you to queue/run in parallel, do not pivot unless explicitly told so"* —
nothing here is implemented. What follows is the cheap diagnosis only.

## The declaration already predicted this

`smart-trust/smart-trust.json`, the `smart-trust-docs` entry, sets
`"composed": true`, and its own `_comment_composed` says why that matters:

> Rendered THROUGH just-the-docs, not mounted after it. Owner, 2026-09-21:
> *"i want the input/page(s)/ content to be rendered viajustthedocs pipeline"*.
> These pages … compose into the Jekyll source at `_docs/smart-trust/` and come
> out as **ordinary folio pages** — sidebar, search, language bar.
> **`who-iris` does NOT set this and must not: it is a replica of IRIS, and
> just-the-docs' layout would replace IRIS's chrome with folio-assistant's.**

So the mechanism is understood and written down. `who-iris` is a replica and
mounts finished HTML; `smart-trust` is composed and therefore inherits
folio-assistant's chrome **by construction**. What is reported here is that
consequence arriving, not a surprise.

## The tension to settle — and it is the owner's, not an agent's

Two owner statements, nine days apart, that may or may not conflict:

| | asked for |
|---|---|
| 2026-09-21 | the pages rendered **via the just-the-docs pipeline** |
| 2026-09-30 | the **css / branding / style** of the published WHO IG |

They conflict only if "pipeline" was meant to include "chrome". They do **not**
conflict if the ask is just-the-docs' *machinery* — sidebar, search, language
bar, composition — wearing WHO's *skin*. That reading is available and is
probably the intended one, but it is a reading, and an agent choosing between
them silently is how one of these two instructions gets quietly dropped.

## Three shapes a fix could take — NOT chosen

1. **Theme it.** Keep `composed: true`; give the instance a WHO-branded theme.
   `who-iris/themes/` already exists, and `smart-trust` currently declares
   `theme: { themeId: "operations" }` — folio-assistant's own. Smallest change;
   keeps sidebar, search and language bar.
2. **Mount it like `who-iris`.** Drop `composed`, generate finished HTML with
   the IG-publisher template. Highest fidelity to the published IG, and loses
   exactly what `composed` was set for.
3. **Neither is right** — the ask is narrower than either, e.g. only the
   colours and the logo.

## Not established

- **Whether the WHO IG's CSS may be copied at all**, and under what attribution.
  The standing constraint is *"leave who/smart-* alone for now, just work on
  litlfred/*"* — reading upstream is fine, modifying it is not, so this is a
  licensing/attribution question about VENDORING, not a repo-access one.
- **How much of the difference is theme vs layout.** The screenshot shows
  colours and the nav rail; nobody has diffed the two pages' structure. A theme
  swap fixes the first and not the second, so the split decides whether (1) is
  even sufficient.

## Done when

- [ ] the owner says which of the three shapes is wanted — nothing is built
      before that
- [ ] whichever is chosen, the 2026-09-21 *"via justthedocs pipeline"*
      instruction is either satisfied or explicitly superseded IN WRITING, so
      the next agent does not read the change as a regression
- [ ] the `_comment_composed` in `smart-trust.json` is updated to match what is
      actually true afterwards — it is currently correct and would become the
      stale-guidance defect the moment this changes

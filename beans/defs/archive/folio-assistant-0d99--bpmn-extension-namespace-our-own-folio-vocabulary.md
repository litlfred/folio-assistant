---
# folio-assistant-0d99
title: 'BPMN EXTENSION NAMESPACE: our own `folio:` vocabulary is spelled two ways across 45 diagrams'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T00:00:00Z
updated_at: 2026-09-20T14:56:52Z
parent: folio-assistant-kupb
---

Found by `bun run external-schemas` on its first run, 2026-09-20 — the
reconciliation reported two namespaces in use that no specification record
declares, and both are **ours**:

| spelling | diagrams |
|---|---|
| `https://litlfred.github.io/folio-assistant/bpmn` | 32 |
| `http://folio-assistant.dev/bpmn` | 13 |

A namespace URI **is** an identity. Two spellings means a namespace-aware
reader sees two unrelated vocabularies, and a `<folio:skill>` in one is not
the same element as a `<folio:skill>` in the other.

## It is latent, not live, and the reason matters

`process-model.ts` matches `v.$type === "folio:skill"` — on the **prefix**,
not the URI. bpmn-moddle resolves the prefix locally per document, so both
spellings work today and every gate passes.

That is exactly why it survived: nothing that runs can tell them apart. The
day something is configured with a moddle descriptor keyed on the namespace
URI — which is the normal way to extend BPMN — the corpus splits in two and
thirteen diagrams lose their extensions silently.

## Done when

- [ ] One spelling. `https://litlfred.github.io/folio-assistant/bpmn` is the
      majority and is a URL that resolves to something; `folio-assistant.dev`
      is a domain this project does not own.
- [ ] `external-schemas` declares it as a record of its own — it is a
      specification this repository publishes rather than consumes, and the
      registry currently reports it as *undeclared* because there is nothing
      to declare it against.
- [ ] A check fails on a third spelling. The two arrived without anybody
      choosing; a rule with no gate will get a third.

## Not doing yet, and why

Thirteen XML files is a mechanical change, but it lands in the middle of a
branch already at 1,600+ files and it touches every diagram's header. Recorded
with the measurement so it can be done deliberately, in a change about itself.

## Resolved 2026-09-20 — one spelling, but NOT the way this bean proposed

The first box is done as written: 13 diagrams rebound, **54 of 54** now carry
`xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"`, verified by
re-measuring rather than by counting the edits.

**The second box was wrong and is not done.** It asked for a record in
`external-schemas/` — *"it is a specification this repository publishes rather
than consumes"*. That registry answers one question: **which edition of
somebody else's specification do we conform to**. Our own namespace has no
edition to pin and no authority to name; a record for it would be a row whose
every field is a placeholder, and the reconciliation would then "verify" our
IRI against our own assertion of it.

What was actually missing was a **constant**. The namespace had none — it was
a string typed out in 54 files, which is *why* it drifted — so:

- `FOLIO_BPMN_NS` in `schemas/namespaces.ts`, beside the three layer
  namespaces, with `LEGACY_FOLIO_BPMN_NS` kept so a gate can NAME the wrong
  spelling instead of reporting an anonymous mismatch;
- `scripts/external-schemas.ts` now partitions the namespaces a diagram binds
  into **ours** and **an external specification's**, and asks each the
  question that has an answer: external → is its edition declared, ours → is
  it spelt exactly one way.

The old behaviour was worse than a missed finding: it reported our own IRI as
an undeclared *specification*, so the remedy it printed was to go and write a
registry record. A gate whose remedy is wrong gets followed.

**Checked that it can fire**, not assumed: reintroducing the old spelling in
one diagram turns `external-schemas:check` red with the drift message, and
restoring it goes green.

## Split out, NOT fixed here

`targetNamespace` drifted on the same corpus and is a different axis — it is
the diagram's own identity, not the extension vocabulary. Measured the same
day: 30 on `.../folio-assistant/workflows`, 4 on
`https://folio-assistant.dev/workflows`, and 8 on per-diagram
`http://folio-assistant.dev/bpmn/<name>`. Left alone deliberately: changing a
diagram's identity is not a rename, and it wants its own check on what
resolves against it first.

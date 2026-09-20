---
# folio-assistant-0d99
title: 'BPMN EXTENSION NAMESPACE: our own `folio:` vocabulary is spelled two ways across 45 diagrams'
status: todo
type: bug
parent: folio-assistant-kupb
priority: normal
created_at: 2026-09-20T00:00:00Z
updated_at: 2026-09-20T00:00:00Z
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

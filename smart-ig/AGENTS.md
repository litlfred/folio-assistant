# AGENTS.md — smart-ig

The **L3** layer: a WHO SMART Guideline's FHIR Implementation Guide, and what
one owes beyond a bare FHIR IG.

## What separates it from `fhir-harness`, two layers down

`fhir-harness` is the **bare** FHIR IG pipeline — SUSHI, the Publisher, Jekyll,
publication — with no WHO assumption, serving any implementation guide. This
layer carries what a WHO SMART IG specifically owes: the DAK API surface, the
`smart.who.int` canonicals, the conventions a SMART Guideline's L3 follows.

If a non-WHO IG would need it, it belongs to `fhir-harness` and not here. That
question is answerable by naming one; if you cannot name one, the answer is no.

## This layer is what makes "no per-IG harness" true

`smart-trust` and `smart-immunizations` were declared harness instances (#690,
#717), and `smart-immunizations`'s own declaration called that *"PROVISIONAL BY
DESIGN"* pending this restructure. Both now declare `needs: ["smart-ig"]`.

So bean `nsbb`'s ruling — *no per-IG harness, because it adds no new
functionality* — is now true **in the declarations** rather than only in prose.
A new ingested IG declares this layer; it does not become a harness.

## It declares no directories

Per the `folio-assistant-core` precedent: a declared-but-absent directory is the
`dh4f` defect.

Placement:
[`smart-stack-layering`](../cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md).

---
layout: default
title: 'Technical documentation'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/technical-documentation.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/technical-documentation.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/technical-documentation.md){: .fa-edit-source }

{% raw %}
# Technical documentation

The register is an SDO's — W3C, IHE. The reader is an implementer who was not
in the room and will not have had the discussion that produced the document.

> **The voice is the enforceable half.**
> `cat-harness/voices/technical-writer.json` carries eight rules, five citing
> the ingested RFCs and three citing the owner's direction. It applies to
> DRAFTING and to REVIEW QA. This skill is how a person runs it; the voice is
> what a checker can read.

## Requirement levels are RFC 2119's, and only in UPPERCASE

The key words are MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD,
SHOULD NOT, RECOMMENDED, MAY and OPTIONAL.

**RFC 8174 is the constraint that makes them usable**: only all-capitals usage
carries the defined meaning. So `the parser must handle this` is narration and
`the parser MUST handle this` is a conformance requirement, and a reader can
tell which is which without asking. A writer who meant a requirement MUST
capitalise it; a reviewer reads lowercase `must` as prose.

**Use them sparingly.** RFC 2119 constrains its own key words to what is
actually required for interoperation, or to limit behaviour that can cause
harm — explicitly NOT to impose a preferred method. A document where every
paragraph carries a MUST has not become rigorous; it has made its real
requirements unfindable.

**State what departing costs.** RFC 2119 asks authors to elaborate the
implications of not following a requirement, because most implementers lack
the experience that produced it. A SHOULD whose cost is unstated is an
instruction the reader cannot weigh, and is the commonest reason a correct
instruction is ignored.

Both RFCs are ingested — `agent-skills/library/rfc2119-key-words-requirement-levels/`
and `agent-skills/library/rfc8174-uppercase-vs-lowercase-2119-key-words/`.
Quote them from there, not from memory.

## Check whether the specification has been superseded

**Before citing an ingested specification, check whether a later one updates
it, and ASK the owner whether they want it.**

This is not hypothetical. RFC 2119's own first page says *"This RFC was
updated, see RFC 8174."* That update is the difference between "the key words
are often capitalized" and "only UPPERCASE usage has the defined special
meanings" — which is the rule a reviewer actually applies. A voice built from
RFC 2119 alone would have been wrong in the way that is hardest to notice:
internally consistent, and superseded.

So: read the front matter for `Updated by`, `Obsoleted by`, `Superseded`, an
errata note or a later edition. Where one exists, say so and ask; do not
silently cite the older document, and do not fetch the newer one uninvited.

## Three questions for a first draft

Run these on your own draft, before review. They are a drafting discipline, not
a reviewer's courtesy — each is cheapest while the draft is still yours.

1. **Have I repeated anything?** If so, consolidate. The same fact in two
   places is free to drift, and the copy a reader finds first is usually the
   one with no test behind it.
2. **Does the content flow in logical order?** If not, apply the detangler
   (bean `j79e`; nothing runs it yet — bean `sb6z`) rather than reordering by
   taste — a candidate ordering is MEASURED, not chosen.
3. **Is this Term defined?** If not: is it defined later; is it in the
   Glossary; does it need a Glossary entry? A term used once and nowhere else
   does not earn one. Glossary Terms are Capitalized on every use, so a reader
   can tell a defined Term from the same word used loosely.

## Reference a schema by linking to it

When the prose names a schema, link to the **schema source** and to its **UML
documentation** where one exists. A schema named but not linked forces the
reader to guess which file, and the guess is wrong exactly when the schema has
moved — which is when they most needed the link.

The rule is the same one this repository applies to every other reference:
resolve it, do not compose it. Writing `schemas/foo.ts` in prose is composing a
path; linking the file is resolving one, and a link that breaks is a finding a
checker can raise.

## Documentation and skills share content

Where a skill states a rule correctly, `docs/` SHOULD point at the skill rather
than restate it. A rule stated twice is a rule free to drift, and this
repository's own `AGENTS.md` opens by saying so: *"Where a skill and this file
disagree, the skill wins and the entry here is wrong."*

That makes the split a question with an answer rather than a preference: the
**skill** carries the discipline; `docs/` carries what a reader needs to find
it and why it exists.

## What this skill does not cover

Glossary mechanics — the content kind, its coding and versioning — belong to the
glossary content kind where that lands (bean `lqo9`), and to
[`glossary-build`](glossary-build.md) for the build half. Model-specific
voices are `rkqp`'s. This skill governs the WRITING; those govern the
artefacts it writes about.
{% endraw %}

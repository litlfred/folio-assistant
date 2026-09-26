Validation checks every block against its schema and the project's constraint
rules (label prefixes, required Lean links, citation resolution, …).

> **You:** Validate the whole paper.
>
> **Assistant:** *(calls `content_validate`)* All 5 blocks valid. Constraints:
> `def:` block has its required Lean link ✓, theorem has a proof block ✓, example
> references a defined symbol ✓.

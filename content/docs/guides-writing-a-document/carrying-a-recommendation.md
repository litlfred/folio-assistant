A normative statement is the block readers cite and implementers trace to. It
wants a label, a stable identity and a place in the dependency graph.

There is **no first-class `recommendation` block kind** yet. The carrier today
is a `prose` block with a label and a title:

```ts
export default prose({
  label: "rec:cold-chain-audit",
  title: "Audit the cold chain quarterly",
  uses: ["rec:scope", "prose:cold-chain-terms"],
});
```

Rules that make this work rather than merely compile:

- **One statement per block.** A block holding three cannot be cited, reviewed,
  superseded or traced individually.
- **State the strength in the prose** (*must*, *should*, the issuing body's own
  grading). Nothing in the block structure encodes it.
- **Keep the published number out of the label.** Numbers are renumbered
  between editions; the label has to survive that. Put it in the title.
- **Do not use `definition`.** Its `lean` field is required, so it will not
  validate here at all. Earlier guidance in `document-intake` suggested that
  mapping — it predates this content type.

The full convention, and what it is missing, is in the
[`normative-statements`](../reference/skill-instructions/normative-statements.html)
skill.

---

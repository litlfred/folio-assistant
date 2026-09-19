```
content/cold-chain-guidance/
  cold-chain-guidance.ts        the document manifest — chapters, in reading order
  introduction/
    introduction.ts             the chapter manifest — sections, in reading order
    overview.ts                 a block manifest: kind, label, title, uses[]
    overview.md                 that block's prose
    overview.qa.json            QA sidecar — machine-written, never hand-edited
```

Three ordered lists hold the whole structure, and **a block reaches the output
only if some section's `blocks[]` names it**. This is the single most common way
authored work disappears: the `.ts` and `.md` are written, committed and
reviewed, and the block renders nowhere because nothing lists it.

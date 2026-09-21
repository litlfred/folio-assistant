---
# folio-assistant-bmr0
title: A stray backtick in a viewer page template gets a gate, after four warnings did not work
status: completed
type: task
created_at: 2026-09-21T06:17:07Z
updated_at: 2026-09-21T06:17:07Z
parent: folio-assistant-vke6
---



Recorded after the work rather than before it, which is the wrong order and is
said rather than hidden: it came out of closing `qttr`, where a stray backtick
in a new comment broke the build for the fourth time in one file.

## Four warnings have not worked

`gen-schema-viz.ts`, `gen-library-viz.ts`, `kg-viewer.ts` and
`state-visualizer.ts` each build a whole HTML page as ONE template literal,
and each carries a comment saying NO BACKTICKS BELOW THIS LINE. It has still
happened four times in `gen-schema-viz.ts` alone — twice in prose quoting a
field, once quoting an intake's `files[]`, once quoting a bean id. **Every
time in a COMMENT**, which is the one place an author is not thinking about
string syntax.

## What the gate is and is not for

The parser already refuses the file, so nothing was ever going to ship broken.
This is about the message. Measured by planting one in the real file and
running both:

```
compiler:  error: Expected ";" but found "whbf"
gate:      gen-schema-viz.ts:833 - a backtick here closes the page template
           early, so everything after it is parsed as TypeScript.
```

**The compiler's line number is right.** The in-file warning claims the
failure lands far from the mistake; on this evidence it does not, and the
claim has been corrected in the new module rather than repeated. So the case
for the gate is narrower than the warning implies: the compiler names a token
and says nothing about backticks, template literals, or the warning three
hundred lines above.

## How it decides without parsing

It cannot parse — the file does not parse, which is the whole situation. The
template opens at `return <backtick><!doctype html>` and should close right
after the page's final `</html>`. The first unescaped backtick after the
opening IS the close, so if the text before it is not that tag, the literal
ended early and that is where the stray one is.

Deliberately not a backtick census: a backtick before the opening (a doc
comment, an import) is fine and must stay fine, or the gate becomes something
to work around. There is a test for exactly that.

## Done when

- [x] a planted backtick is reported with its file, line and the line's text
- [x] a backtick outside the template is NOT reported
- [x] the gate fails a generator that has moved, rather than passing over it
- [x] registered in `code-quality-gates.yml`, so `bun run gates` derives it

Six tests, and the negative half is the one that matters: every real file is
currently fine, so the corpus alone would pass a checker that answered "fine"
unconditionally.

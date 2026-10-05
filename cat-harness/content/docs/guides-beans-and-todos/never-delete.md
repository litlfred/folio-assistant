`beans delete` exists in the CLI. **Do not use it.**

Work that turns out not to be wanted is **scrapped** — `status: scrapped`,
with a section saying why. That is what "disable" means here; the CLI has no
disabled state, and its vocabulary is `draft`, `todo`, `in-progress`,
`completed`, `scrapped`.

The reason is not tidiness. A scrapped bean records that something was
considered and rejected, and on what grounds — which is worth as much to the
next agent as the record of work that was done, because it is what stops the
same dead end being re-entered. A deleted bean leaves a sibling session unable
to tell abandonment from accident, and leaves the next agent free to start
over on the thing you already ruled out.

The prohibition is written here, and in the diagram's own documentation,
precisely because the tool offers the operation. A rule that depends on nobody
noticing a command is not a rule.

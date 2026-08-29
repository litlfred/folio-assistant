# platform-boundary-guard — memory

Entry types: **STABLE** · **TRAP** · **BASELINE** (re-measure, never quote).
Seeded 2026-08-29 from `AGENTS.md`. Confirm entries as you use them.

---

## STABLE — the shape of every defect here

A folio's specifics written into platform code. It works for exactly one
consumer and silently damages the rest. Ask of every change: **does this
name, assume, or default to one folio?**

## STABLE — adapter vs profile: a different axis, and conflating them is costly

- **Adapters** (`paper`, `dak`) partition block kinds into **disjoint**
  namespaces. `adapterForKind` is what QA-criterion scoping reads, and it
  must stay **total and unambiguous**.
- **Profiles** (`document`, `paper`) **nest**: every document kind is also a
  paper kind.

Making `document` a third adapter would have made `adapterForKind` ambiguous
on all **eight** shared kinds. When adding a content type, ask whether it
needs different **code** (adapter) or only different **rules** (profile plus
a subclass).

`PaperContentAdapter` extends `DocumentContentAdapter`; `MATH_BLOCK_KINDS` is
written out in `schemas/block-kinds.ts` and `DOCUMENT_BLOCK_KINDS` is its
**derived** complement, so a kind added to `BLOCK_KINDS` cannot go
unclassified. Keep that derivation — do not hand-maintain both lists.

## STABLE — what the schema structurally cannot catch

`content/pipeline/profile-check.ts` runs on every `content_validate` and
catches what Zod cannot: a `theorem` is a valid `theorem` whatever folio it
sits in, and `constraints.ts` cannot read `folio.config.json`.

Two rules: kind-within-profile, and (document only) **no `lean` field and no
`.lean` sibling** — because `remark`, `example`, `algorithm` and `simulator`
all *declare* an optional `lean` that the type permits and the profile
forbids.

## TRAP — the README generator that replaced the whole file

`scripts/generate-readme.sh` ended in `cp "$OUT" README.md`. It held one
folio's content **in the platform**: the title `# Quantum Observable
Universe`, three `litlfred/qou` badges, a Knot Registry of Alexander-Briggs
indices, a Project Structure table naming
`content/quantum-observable-universe/lean/`, and a CC BY 4.0 licence block.
Run it in any other folio and the author loses their README. Only five of its
sections were derived from the tree at all; the rest was prose, and prose
about a folio belongs to that folio. Deleted, with
`scripts/readme-metadata.ts`, its only consumer.

**The replacement inverts the ownership**: `content/pipeline/readme-sections.ts`
holds a registry (`folio:toc`, `folio:lean-coverage`, `folio:lean-modules`,
`folio:simulators`, `folio:workflows`) and writes each section **only where
the README already carries its `<!-- marker:begin -->` / `<!-- marker:end -->`
pair**. The folio opts in per section; nothing outside a marked region is
ever touched. Adding a section is one entry in `SECTIONS` — the CLI, the MCP
tool and the staleness check all read the registry.

`readme_sync` is registered among the **generic** tools: a document folio has
chapters, simulators and workflows for the same reason a paper folio does,
and simply never carries the Lean markers.

## TRAP — three literals worth recognising in new code

Each shipped once:

1. **Modules prefixed `QOU.`** regardless of the folio's Lake library. Now
   read from `lakefile.toml`, and left **unprefixed** when no lakefile names
   one — *a wrong namespace is worse than none*, because it is what a reader
   pastes into an `import`.
2. **Workflow descriptions from a hardcoded map of twelve `qou` filenames**,
   consulted *before* the workflow's own `name:`. Now always the `name:`.
3. **The simulator directory as the literal `folio-assistant/simulators`.**
   Now `folio.config.json`.

## TRAP — "could not determine" is a THIRD state, everywhere

A section that cannot read its source returns `skip` and the region is left
exactly as it was. Not decoration:

- qou configures its simulators under `folio-assistant/simulators`, which
  exists only once the platform submodule is checked out. The first version
  rendered "directory absent" as "this folio has no simulators" — replacing a
  correct nine-row table with a sentence.
- A shallow clone with no `gh-pages` must not silently blank a contents table
  that was right yesterday.

**An empty directory is still a determined empty.** Distinguish absent from
unreadable, always.

## TRAP — compose nothing; resolve everything

The old contents table built every PDF cell as
`${PAGES}/papers/<paper>/chapters/<dir>.pdf` — by convention, checked against
nothing. The folio's `gh-pages` has no `chapters/` directory, so **all
twenty-three chapter links were 404 and always had been**; three of six
appendix links happened to resolve. Every PDF cell is now looked up in a real
`git ls-tree` of the publish ref, and a chapter with no published PDF renders
`—`.

The same script also **described one folio from inside the platform** (paper
directory, title, badges and a `PAGES` constant as literals) in a repo whose
`folio.ts` lists five papers, and resolved its helpers against the folio root
(`bun run scripts/readme-metadata.ts`) where the platform's scripts are not —
so it could only run from a platform checkout, which has no papers.

## STABLE — link style: `raw` is not the private-repo answer

A private folio whose README links to `https://<owner>.github.io/...` is
unreachable for exactly the people who have repository access, and
`raw.githubusercontent.com` does not fix it — it 404s on a private repo
without a token, and a browser session cookie does not authenticate it.

Default is **`blob`** (`github.com/<owner>/<repo>/blob/<ref>/<path>`): follows
the viewer's GitHub session, works public or private, renders PDFs inline.
`pages` and `raw` remain available under `readme.linkStyle` in
`folio.config.json`, and each prints a note under the table saying who can
follow its links.

## STABLE — the builder shim, and why `folio_init` is generic

`bun run init-folio` / the `folio_init` MCP tool writes a folio's `content/`,
`uploads/`, `library/`, manifests, `folio.config.json`, the `content/schema/`
builder shim, `AGENTS.md` + `CLAUDE.md`/`GEMINI.md` stubs, `.mcp.json`, the
session-start hook and the beans store.

- **The builder shim exists so the path to folio-assistant is written down
  once**: block manifests import `../schema/builders`, never the platform
  directly, so re-linking is a two-file edit rather than a corpus sweep.
- **`folio_init` is registered among the generic tools**, not in an adapter,
  because it runs *before* the folio has a content type. A bare repo falls
  back to the paper adapter, so an adapter-scoped tool would be unreachable
  in exactly the case it exists for.

## STABLE — the document render path takes no TeX

`content/pipeline/render-markdown.ts` assembles the folio to one Markdown
file; `document_render_{md,html,pdf}` take it through pandoc, the PDF via
weasyprint/prince/wkhtmltopdf. It **never** falls back to `latexmk`,
deliberately — a PDF that silently came out of LaTeX would misreport what the
folio needs to build, and the next person on a clean machine pays for that.
Registered for **both** content types, because it is the render that works
while drafting on a machine with no TeX.

## STABLE — there is no `recommendation` block kind

A normative statement is a labelled, titled `prose` block; the convention and
its limits are in `skills/folio-document-adapter/normative-statements.md`. A
real kind means a builder, a Zod schema, a label prefix, viewer registration,
constraint rows and QA criteria — about **thirty files** — and is tracked
separately rather than half-done.

Known-wrong and predating the document profile: `document-intake.md` maps
guideline recommendations onto `definition`, which is wrong for a document
folio, where `definition`'s `lean` field is required.

## BASELINE — re-measure, do not quote

| what | command |
|---|---|
| folio-specific literals in platform code | grep the change for a paper dir, a title, an owner/repo, a Lake prefix, a workflow filename |
| README sections a folio can opt into | `bun run readme:sections` |
| README staleness | `bun run readme:sync:check` |
| block-kind classification totality | read `schemas/block-kinds.ts`; `DOCUMENT_BLOCK_KINDS` must stay derived |

---

## Session log

One line per review: what you checked, any literal you caught, any TRAP you
added. Keep under ~200 lines — prune the log, never the TRAPs.

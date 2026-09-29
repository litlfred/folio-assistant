---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Liquid templates'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/liquid-templates.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/liquid-templates.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/liquid-templates.md){: .fa-edit-source }

{% raw %}
# Liquid templates — layout only, every fact from the graph

Two engines run Liquid here, and they produce different kinds of output. Know
which one you are writing for before you write a line:

| | README templates | site templates |
|---|---|---|
| engine | liquidjs, run by `subgraph-readmes` (`jekyllInclude: true`, `strictFilters: true`) | Jekyll, run by `docs-site.yml` with the pinned just-the-docs `remote_theme` |
| lives in | `templates/readme/` inside the declared `tools` directory (`cat-harness/tools/templates/readme/`) | `cat-harness/docs/_includes/` — just-the-docs' extension points (`head_custom.html`, `footer_custom.html`, `nav_footer_custom.html`) plus our own |
| output | `<directory>/README.md`, **committed**, read on GitHub where no Liquid runs | `_site/`, **never committed**, published to Pages |
| data | only what the generator passes: `subgraph`, `instance`, `kg`, `files`, `subdirs`, `summary` | `site`, `page`, `include`, and `_data/*.json` written by the pipeline |
| verified by | `bun run readme:subgraphs:check` — the diff is the output | building the site: [`rendered-verification`](rendered-verification.md), `bun run preview:site` |

## Where a template lives

**Inside a declared directory, and found through that directory's `id`.**
`templatesDir()` in `scripts/subgraph-readmes.ts` resolves the `tools` entry
of the declaration and joins `templates/readme/` to it, rather than spelling
the whole path, so the tools directory can move without the generator
changing ([`directory-conventions`](directory-conventions.md) — ids are
stable, paths are not). The templates are files OF the tools graph, not a
directory of their own: a declared directory nested inside another is refused
by `check:layout-norms`. Never an inline template string in a `.ts` file and
never a `.liquid` file outside a declared directory: a template nobody
declared is one no checker looks at, and its README row cannot say what it is.

## What a template may read — and what it must not compose

**A template arranges facts; it never states one.** Every word that is not
layout comes from a variable the generator read from the Knowledge Graph: the
directory's declared `title` and `description`, each file's own account of
itself, a relation a diagram records. No count, URL, name or claim typed into
a template — each is a second answer free to drift from the first, which is
[`readme-sections`](readme-sections.md) §"Resolve links; never compose them"
one level down.

- **Computation belongs in the generator**, where it is tested: counting,
  grouping, choosing a link target, collapsing a long list. The template sees
  results (`subdirs[].count`, `summary`), not inputs to derive them from.
- **A missing value is shown as missing**, never papered over:
  `{{ subgraph.title | default: subgraph.id }}` and
  "_No description is declared for …_" are the pattern. The generator records
  the gap as a QA finding in `test/results/subgraph-readmes.qa-results.json`;
  the template must not make it look filled.
- **A new variable is a generator change first.** Add it to the object passed
  to `renderFile`, list it in the template's comment, then use it.

## The leading comment IS the file's description

Open every template with a `{%- comment -%}` block. Its **first sentence** is
what the directory README's "what it is" column shows for the file
(`describe()` in `content/pipeline/readme-graph-sections.ts`), so write it for
a reader of that table — "The file table: files directly in the directory,
then its subdirectories." — and put the variables it reads in the lines after.
No comment and the row says only "a template".

## Includes

`jekyllInclude: true` gives Jekyll's syntax: `{% include files.liquid %}`, the
file name unquoted and with its extension. An include with no parameters sees
the including template's variables (`files.liquid` reads `files` directly); a
parameter passed as `{% include x.liquid key=value %}` is read as
`include.key`, as in Jekyll. Split a template when a part is reusable or when
a reader would want its own row for it — not to hide logic.

## Whitespace — check the output, not the template

`{%-` and `-%}` strip the whitespace on that side of the tag, and that is how a
template emits clean Markdown. It is also how a separator the output needs
disappears: one `{% endif -%}` in `_includes/landing.html` glued two HTML
attributes together and the live landing page printed its own markup as text,
past every gate ([`continual-progress`](continual-progress.md) §"A template is
not a page"). Strip freely inside a tag's own lines; think before stripping
next to a table row's newline, the blank line before a heading or table, or
an attribute boundary. `subgraph-readmes` also collapses three or more
newlines to two, so do not fight blank lines with stripping.

## Escaping

- **`strictFilters: true`** — an unknown filter is an error, not a silent
  pass-through. No custom filter is registered.
- **A value bound for a table cell is escaped before it reaches the
  template** — the generator's `cell()` turns `|` into `\|` and folds
  newlines. A new cell-bound field goes through it; a raw `|` from a file's
  description splits the row.
- **Liquid syntax in prose that Jekyll will build** must sit inside a `raw`
  block. `gen-skill-docs` wraps every skill page in one, so a skill may quote
  `{{ }}` and `{% %}` freely — but never the closing `endraw` tag itself,
  which ends the block early. A generated README
  that sits under a site source (`cat-harness/docs/`, root `docs/`) may be
  read by the site build too; if a KG value there can carry Liquid, build the
  site and look before assuming either way.

## Markers — the platform owns the region, the folio owns the file

`subgraph-readmes` writes only between `<!-- kg:subgraph:begin -->` and
`<!-- kg:subgraph:end -->`, creates a README holding just that region when
there is none, and leaves an unmarked README alone and reported. The rules,
and why the whole-file generator they replaced was wrong, are in
[`readme-sections`](readme-sections.md); do not restate them in a template.

## Regenerate, commit, and the gate

```sh
bun run readme:subgraphs          # render every declared directory's README + the QA sidecar
bun run readme:subgraphs:check    # fail on a stale README or sidecar — CI and the pre-commit hook
```

Changing a template changes every README it renders; commit them with the
template, in one commit. So does adding or removing a file in any declared
directory — that directory's table changed. `readme:subgraphs:check` runs in
`code-quality-gates.yml` and in `cat-harness/scripts/git-hooks/pre-commit`; it
is part of `bun run gates`.

## On the site specifically

- Pages need front matter to be pages — `title`, and `parent` / `nav_order`
  for just-the-docs' sidebar, which it builds from front matter at build time.
- `baseurl` is `/folio-assistant`; a link or asset path goes through
  `relative_url`, never a literal `/…`.
- Override just-the-docs through its extension-point includes, not by copying
  a theme layout — a copied layout silently stops tracking the pinned version
  ([`upstream-version-adoption`](upstream-version-adoption.md)).
- A generated reference directory (`reference/skill-instructions/`,
  `reference/skills/`, `docs-auto/`) is never hand-edited; change its generator.
{% endraw %}

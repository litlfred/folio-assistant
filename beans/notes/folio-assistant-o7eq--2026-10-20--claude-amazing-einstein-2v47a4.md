---
# note on folio-assistant-o7eq from claude/amazing-einstein-2v47a4
$schema: folio-bean-note/v1
bean: folio-assistant-o7eq
branch: "claude/amazing-einstein-2v47a4"
created: "2026-10-20"
---
## sthf workflow half: what remains, and the locale conflict

## Measured 2026-10-20, read-only, in the composed index

- **No consumer uses the resolver.** `publishedPath` and `isPublished` (`cat-harness/schemas/url-space.ts`) are called only by their own test.
  - `docs-site.yml` composes paths by hand at :613-617, :661-664, :682 and :708; `feature-staging.yml` at :1291-1311, :1415-1416 and :1446.
  - So do `root-index.ts:117`, `site-links.ts:130-147` (used by `sync-docs-harness.ts:296`), `instance-exports.ts:199-218`, `kg-export.ts:3010` and `:3050`, and `mount-instance-docs.ts:258`, `:1734` and `:2015`.
- **`enabled:false` is never honoured.** It is a schema field only, and no declaration sets it.
- **`instance-exports.ts` uses the STUB as its segment**, where the ruling says the instance NAME. bootstrap matches only because its stub equals its name.
- **No test checks the layout** of two or more instances in the built `_site`.
- **Locale conflict.** The owner's 2026-10-05 ruling (folio-assistant#2527, cited at `viewer-declarations.ts:32-41`) puts every visualiser page at `/<locale>/<declaring>/<kind>/…`, and the live site serves `<base>/en/<owner>/<visualiser>/…`. `url-space.ts` has no locale, so sthf's case 3, `<base>/<owner>/<graph>/<subject>/`, disagrees with `visualiserRoute`. Put to the owner 2026-10-20.
- **Collision.** cat-harness's stub is now `cat-harness`, so the KG viewer at `_site/cat-harness/index.html` takes case 2's `<base>/cat-harness/` address.

## Owner ruling (2026-10-20, structured question in session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Asked which published pages carry the locale segment (A: visualiser pages only; B: everything; C: none). The owner chose **A, "Viewers only"**:
- the root `<base>/` and each instance `<base>/<instance>/` (with its `.jsonld`/`.json` graph) stay without a locale;
- visualiser pages keep `<base>/<locale>/<owner>/<kind>/…`, as ruled 2026-10-05;
- `publishedPath` gains an optional locale for case 3 so it agrees with `visualiserRoute`, and the work left on sthf (consumers through the resolver, `enabled:false` honoured, name not stub, a two-instance layout test) goes ahead on that basis.

## Owner ruling (2026-10-20, in session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

On the collision at `<base>/cat-harness/`, where cat-harness's KG graph viewer (`_site/<stub>/index.html`, stub `cat-harness`) sits on case 2's address for the instance itself, the owner said verbatim: *"move graph viewer so aligns."* The graph viewer moves to a viewer route, case 3: `<base>/<locale>/<owner>/<kind>/…` via `visualiserRoute`/`publishedPath`. `<base>/cat-harness/` is left for the instance as itself. Any link to the old address gets a forwarding page, as `t4xb` does for the other moved visualisers.

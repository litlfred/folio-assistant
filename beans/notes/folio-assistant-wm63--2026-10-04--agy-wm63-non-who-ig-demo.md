---
# note on folio-assistant-wm63 from agy/wm63-non-who-ig-demo
$schema: folio-bean-note/v1
bean: folio-assistant-wm63
branch: "agy/wm63-non-who-ig-demo"
created: "2026-10-04"
---
## Demonstration of bare FHIR IG pipeline on HL7 IPS (non-WHO)

## Demonstration of bare FHIR IG pipeline on HL7 IPS (non-WHO IG) — 2026-10-04

Demonstrated the bare FHIR IG pipeline (`SUSHI` → `IG Publisher` → `fhir-harness` Jekyll site) running on an IG that is not WHO's:
HL7 International Patient Summary (IPS), using no `smart-base` / DAK overlays and no WHO pre/post-processing steps.

### Target IG Selection & Evaluation
1. **Default evaluated**: HL7 Sample IG (`https://github.com/FHIR/sample-ig`, commit `89299992d3fc169c0d42cf89c1a99fcfe0f954eb`).
   - Cloned to `~/space_cats/ig-demo/sample-ig`.
   - Evaluation: Legacy XML-based IG with no FHIR Shorthand (FSH) files and no `sushi-config.yaml`.
   - `sushi` exited 0 with `"No FSH files or sushi-config.yaml present."`.
   - Staging via `build-ig-site.ts` failed with `ENOENT: no such file or directory, open '.../sushi-config.yaml'`.
   - Per prompt instruction ("If that doesn't build, use HL7 IPS and say why"), switched to HL7 IPS.
2. **Selected non-WHO IG**: HL7 International Patient Summary (IPS) (`https://github.com/HL7/fhir-ips`).
   - Cloned to `~/space_cats/ig-demo/fhir-ips`.
   - Checked-out commit SHA: `df270978cf5bf4ee7c907f005d722bed7235f384`.

### Toolchain Versions
- **SUSHI**: `v3.16.3` (implements FHIR Shorthand specification v3.0.0)
- **FHIR IG Publisher**: `v2.3.4 (Git# 7ae92f79415a)`, built 2026-09-04T06:21:07.840Z
- **Jekyll**: `4.3.2` with `just-the-docs 0.12.0`
- **Java**: OpenJDK `21.0.3` (Zulu 21.34+19-CA) macOS aarch64

### Commands Verbatim and Exit Codes
1. **SUSHI compilation**:
   ```sh
   sushi /Users/litlfred/space_cats/ig-demo/fhir-ips
   ```
   Exit code: `0`
   Output: 0 Errors, 0 Warnings. Output generated to `fsh-generated/resources/`.

2. **IG Publisher run**:
   ```sh
   java -Xmx4g -jar ./input-cache/publisher.jar -ig .
   ```
   (Executed in `/Users/litlfred/space_cats/ig-demo/fhir-ips` with symlinked `~/.fhir/publishers/publisher.jar` v2.3.4)
   Exit code: `0`
   Output: 3,790 HTML output files in `output/`, 0 broken links.

3. **Artefact ingestion (`ingest-ig-artifacts.ts`)**:
   ```sh
   bun run fhir-harness/scripts/ingest-ig-artifacts.ts --ig-out /Users/litlfred/space_cats/ig-demo/fhir-ips/output --out /Users/litlfred/space_cats/ig-demo/fhir-ips-artifacts
   ```
   Exit code: `0`
   Output: Ingested 77 artefacts, generated `fhir-artifact-index/index.json`.

4. **Artefact documentation pages generation (`gen-ig-pages.ts`)**:
   ```sh
   bun run fhir-harness/scripts/gen-ig-pages.ts --artifacts /Users/litlfred/space_cats/ig-demo/fhir-ips-artifacts/fhir-artifact-index/index.json --out /Users/litlfred/space_cats/ig-demo/fhir-ips-artifacts/docs/artifact --assets-dir /Users/litlfred/space_cats/ig-demo/fhir-ips-artifacts/docs/assets
   ```
   Exit code: `0`
   Output: Generated 77 individual artefact documentation pages.

5. **Staging Jekyll Site (`build-ig-site.ts`)**:
   ```sh
   bun run fhir-harness/scripts/build-ig-site.ts --ig-src /Users/litlfred/space_cats/ig-demo/fhir-ips --out /Users/litlfred/space_cats/ig-demo/fhir-ips-jekyll-src --artifacts /Users/litlfred/space_cats/ig-demo/fhir-ips-artifacts
   ```
   Exit code: `0`
   Output: Staged Jekyll site source with navigation hierarchy, fhir variables (`_data/fhir.json`), `_config.yml`, includes, images, and staged artefact pages.

6. **Jekyll Site Build (`jekyll build`)**:
   ```sh
   bundle exec jekyll build --source /Users/litlfred/space_cats/ig-demo/fhir-ips-jekyll-src --destination /Users/litlfred/space_cats/ig-demo/fhir-ips-jekyll-site
   ```
   Exit code: `0`
   Output: Built in 0.74s into `/Users/litlfred/space_cats/ig-demo/fhir-ips-jekyll-site`.

### Findings & Layering Enhancements
1. **Publisher Intermediate Includes & `lang-fragment` macro**:
   Standard HL7 IG Publisher templates use `{% lang-fragment <file> %}` Liquid tags for localized includes (in `About.md`, `profiles.md`, `examples.md`, etc.). Standard Jekyll aborts with `Liquid syntax error: Unknown tag 'lang'`.
   `fhir-harness/scripts/build-ig-site.ts` was updated to:
   - Identify `lang-fragment` targets alongside `include` targets;
   - Normalize `{% lang-fragment file %}` to `{% include file %}` during page staging;
   - Resolve intermediate includes from Publisher's `temp/pages/_includes/` when available before falling back to `notRenderedMarker`.
   - Support `--artifacts <dir>` to copy ingested artefact documentation directly into the staged Jekyll site.
   These changes are completely generic to any FHIR IG and introduce zero WHO/DAK assumptions or dependencies.

### Rendered Pages Inspected
- **Home page** (`/Users/litlfred/space_cats/ig-demo/fhir-ips-jekyll-site/index.html`):
  Inspected full Just-the-Docs layout rendered with title "International Patient Summary Implementation Guide", sidebar navigation tree with 18 narrative section links, search integration, IPS diagrams ("Figure 1: The IPS product and by-products", "Figure 2: The IPS composition"), Purpose, Project Background, Scope, Authors table, and responsive CSS styles.
- **Artefact page** (`/Users/litlfred/space_cats/ig-demo/fhir-ips-jekyll-site/artifact/StructureDefinition-Patient-uv-ips.html`):
  Inspected rendered title "PatientUvIps — hl7.fhir.uv.ips artefact | International Patient Summary Implementation Guide", backlink "← all 77 artefacts", resource type stat box (`StructureDefinition`, version `2.0.1`), canonical URL (`http://hl7.org/fhir/uv/ips/StructureDefinition/Patient-uv-ips`), download links (json, xml, ttl, html), materialization tag, and IG API status note.

# Translation scripts

Scripts for the folio-assistant translation pipeline.

## Origin

The Python scripts in this directory are copied from
[`WorldHealthOrganization/smart-base/input/scripts/`](https://github.com/WorldHealthOrganization/smart-base/tree/main/input/scripts).
They are the upstream authority for FHIR IG translation workflows.
The TypeScript ports in `pipeline/` are the folio-assistant equivalents.

## Smart-base Python scripts

| Script | Role |
|---|---|
| `extract_translations.py` | POT extraction: PlantUML, SVG, ArchiMate, Markdown |
| `inject_translations.py` | PO injection for all four formats |
| `translation_config.py` | GitHub URL helpers, shared config |
| `translation_security.py` | Shared security helpers (request timeouts) for the service scripts |
| `extract_script_strings.py` | Script/template string extraction |
| `pull_translations.py` | Orchestrator for translation platform pulls |
| `pull_weblate_translations.py` | Weblate API sync |
| `pull_crowdin_translations.py` | Crowdin API sync |
| `pull_launchpad_translations.py` | Launchpad API sync |
| `register_translation_project.py` | Per-project Weblate registration |
| `register_all_dak_projects.py` | Bulk DAK project registration |
| `generate_weblate_yaml.py` | Weblate component discovery config |

## TypeScript ports (folio-assistant native)

| Module | Smart-base source | Functions ported |
|---|---|---|
| `pipeline/pot-extract.ts` | `extract_translations.py` L633–856 | `extractMarkdown`, `cleanMarkdownText`, `formatPot` |
| `pipeline/po-inject.ts` | `inject_translations.py` L56–818 | `injectMarkdown`, `parsePo`, `gettextToLiquid` |

## Simulation

```sh
bun run scripts/translation/simulate-translation.ts [path-to-md]
```

Runs the full pipeline on a markdown page (default: `docs/guides/agent-onboarding.md`):
1. Extract translatable strings → POT
2. Simulate French translation → PO
3. Inject translations → French markdown
4. Round-trip semantic verification (back-translate and compare)
5. Write `status.json`

Output goes to `translations/fr/`.

## Tests

```sh
bun test pipeline/translation.test.ts
```

Covers text cleaning, extraction, formatting, PO parsing, injection, and the
full round-trip.

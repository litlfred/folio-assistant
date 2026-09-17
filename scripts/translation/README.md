# Translation scripts

Scripts for the folio-assistant translation pipeline.

## Origin

The Python scripts in this directory are copied from
[`WorldHealthOrganization/smart-base/input/scripts/`](https://github.com/WorldHealthOrganization/smart-base/tree/main/input/scripts).
They are the upstream authority for FHIR IG translation workflows.
The TypeScript ports in `content/pipeline/` are the folio-assistant equivalents.

## Smart-base Python scripts

| Script | Lines | Role |
|---|---|---|
| `extract_translations.py` | 1,158 | POT extraction: PlantUML, SVG, ArchiMate, Markdown |
| `inject_translations.py` | 933 | PO injection for all four formats |
| `translation_config.py` | — | GitHub URL helpers, shared config |
| `extract_script_strings.py` | 276 | Script/template string extraction |
| `pull_translations.py` | 269 | Orchestrator for translation platform pulls |
| `pull_weblate_translations.py` | 401 | Weblate API sync |
| `pull_crowdin_translations.py` | 313 | Crowdin API sync |
| `pull_launchpad_translations.py` | 196 | Launchpad API sync |
| `register_translation_project.py` | 630 | Per-project Weblate registration |
| `register_all_dak_projects.py` | 182 | Bulk DAK project registration |
| `generate_weblate_yaml.py` | 274 | Weblate component discovery config |

## TypeScript ports (folio-assistant native)

| Module | Smart-base source | Functions ported |
|---|---|---|
| `content/pipeline/pot-extract.ts` | `extract_translations.py` L633–856 | `extractMarkdown`, `cleanMarkdownText`, `formatPot` |
| `content/pipeline/po-inject.ts` | `inject_translations.py` L56–818 | `injectMarkdown`, `parsePo`, `gettextToLiquid` |

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
bun test content/pipeline/translation.test.ts
```

40 tests covering text cleaning, extraction, formatting, PO parsing,
injection, and full round-trip.

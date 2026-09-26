---
layout: default
title: Contribuir
lang: es
nav_exclude: true
translation_status: unverified
translation_source: contributing.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# Contribuir
{: .no_toc }

1. TOC
{:toc}

---

## Configuración de desarrollo

```sh
git clone https://github.com/litlfred/folio-assistant.git
cd folio-assistant
bun install
bun test          # pruebas unitarias
bun run lint      # eslint
bunx playwright test   # e2e (test:e2e)
```

## Plan de trabajo con `beans`

Este proyecto utiliza [`beans`](https://github.com/hmans/beans) como el mecanismo único
de tareas pendientes/plan de trabajo (consulta `AGENTS.md`). **No** configures un almacén
de tareas separado.

```sh
scripts/install-beans.sh
beans list
beans create "<título>"
beans <id> --status in-progress   # reclama antes de trabajar
```

`beans ≠ sidecars`: nunca uses `beans create` para colas masivas generadas por máquinas (QA,
witness, watcher); esas se mantienen como JSON masivo.

## Guía para agentes

`AGENTS.md` es la fuente única de verdad genérica para agentes (leída de forma nativa por Claude Code,
Gemini CLI, Antigravity, Cursor, Copilot). `CLAUDE.md` / `GEMINI.md` son stubs mínimos
que apuntan a él. Actualiza `AGENTS.md` en lugar de un archivo específico de una herramienta cuando
cambies las pautas para agentes.

## Documentación

- La documentación en prosa se encuentra en `docs/` (este sitio Jekyll).
- La **referencia de esquemas de habilidades** es generada — nunca edites a mano
  `docs/reference/skills/*.md`. Edita los esquemas JSON en
  `schemas/skills/<skill>/` y vuelve a generar:

  ```sh
  bun run scripts/gen-schema-docs.ts
  ```

- Las **instrucciones de habilidades** (`docs/reference/skill-instructions/*.md`) también son
  generadas — nunca las edites a mano. Edita el cuerpo de las habilidades en
  `skills/content-lifecycle/*.md` o `src/skills/*.md` y vuelve a generar:

  ```sh
  bun run scripts/gen-skill-docs.ts
  ```

- La **referencia de la API de TypeScript** (`/api/`) es generada por TypeDoc en CI.
- El sitio se compila y despliega en GitHub Pages mediante
  `.github/workflows/docs-site.yml` en cada push a `main` que modifique la documentación,
  los esquemas o el código fuente.

Previsualizar localmente:

```sh
cd docs
bundle install
bundle exec jekyll serve
```

## Publicar un cambio

Verifica → confirma que se pueda fusionar → push → (solo si se solicita) abre un PR. Consulta
`skills/folio-core/prepare-merge.md`. Mantén el **formalismo del marco de trabajo
separado del contenido** — el contenido pertenece a su propio repositorio, y cualquier contenido
en esta documentación es solo ilustrativo.

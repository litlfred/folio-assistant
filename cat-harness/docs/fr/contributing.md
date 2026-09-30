---
layout: default
title: Contribuer
lang: fr
nav_exclude: true
translation_status: unverified
translation_source: contributing.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# Contribuer
{: .no_toc }

1. TOC
{:toc}

---

## Configuration du développement

```sh
git clone https://github.com/litlfred/folio-assistant.git
cd folio-assistant
bun install
bun test          # tests unitaires
bun run lint      # eslint
bunx playwright test   # e2e (test:e2e)
```

## Plan de travail avec `beans`

Ce projet utilise [`beans`](https://github.com/hmans/beans) comme unique
mécanisme de tâches et de plan de travail (voir `AGENTS.md`). Ne mettez **pas** en
place de système de tâches séparé.

```sh
scripts/install-beans.sh
beans list
beans create "<title>"
beans <id> --status in-progress   # prendre en charge avant de commencer
```

`beans ≠ sidecars` : ne faites jamais `beans create` pour des files générées automatiquement en masse
(QA, witness, watcher) — celles-ci restent au format JSON brut.

## Directives pour les agents

`AGENTS.md` est la source de vérité générique pour les agents (lue nativement par Claude Code,
Gemini CLI, Antigravity, Cursor, Copilot). `CLAUDE.md` / `GEMINI.md` sont de légers stubs
qui pointent vers lui. Modifiez `AGENTS.md` plutôt qu'un fichier spécifique à un outil lors
de la mise à jour des directives pour les agents.

## Documentation

- La documentation rédigée se trouve sous `docs/` (ce site Jekyll).
- La **référence des schémas de compétences** est générée — ne modifiez jamais
  manuellement `docs/reference/skills/*.md`. Modifiez les schémas JSON sous
  `schemas/skills/<skill>/` et régénérez :

  ```sh
  bun run scripts/gen-schema-docs.ts
  ```

- Les **instructions de compétences** (`docs/reference/skill-instructions/*.md`) sont également
  générées — ne les modifiez jamais manuellement. Modifiez le corps des compétences sous
  `skills/content-lifecycle/*.md` ou `src/skills/*.md` et régénérez :

  ```sh
  bun run scripts/gen-skill-docs.ts
  ```

- La **référence de l'API TypeScript** (`/api/`) est générée par TypeDoc dans la CI.
- Le site est construit et déployé sur GitHub Pages par
  `.github/workflows/docs-site.yml` à chaque push sur `main` qui modifie la documentation,
  les schémas ou le code source.

Aperçu local :

```sh
cd docs
bundle install
bundle exec jekyll serve
```

## Livrer une modification

Vérifier → confirmer l'aptitude à la fusion → pousser (push) → (uniquement sur demande) ouvrir une PR. Voir
`skills/folio-core/prepare-merge.md`. Maintenez le **formalisme du framework
séparé du contenu** — le contenu a sa place dans son propre dépôt, et tout contenu
dans cette documentation n'est fourni qu'à titre d'illustration.

---
layout: default
title: Intégration de l'agent (FR)
parent: Authoring guides
lang: fr
# `lang` above is what makes this a translation -- nothing reads `fr` out of
# the path. `nav_exclude` keeps it out of the statically built nav, and
# `mountNavLocale` (docs/assets/js/docs-ui.js) puts it back in place of its
# source when this locale is selected. There is no `nav_order`: it stands
# where its source stands. skills/folio-core/translation-manager.md
nav_exclude: true
translation_status: unverified
translation_source: guides/agent-onboarding.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# Intégration de l'agent
{: .no_toc }


Vous êtes un agent LLM qui vient d'être placé dans un dépôt utilisant
folio-assistant. Cette page est votre orientation : ce que vous regardez,
ce qu'il faut faire en premier, et où chercher les informations.

Pour l'architecture des compétences, des rôles et des capacités, lisez
[Compétences & rôles](../../skills.html). Cette page est la version pratique.

1. TOC
{:toc}

---

## 1. Déterminez dans quel dépôt vous vous trouvez

Il en existe deux types, et les confondre est l'erreur la plus fréquente au début.

| | **folio-assistant** (la plateforme) | **Un folio** (le dépôt de contenu) |
|---|---|---|
| Contient | compétences, schémas, pipeline, serveur MCP | le document / la directive / l'IG réel(le) |
| A `content/<paper>/` | non — seulement `content/pipeline/` | oui |
| Vous éditez ici pour | modifier le fonctionnement de la rédaction | modifier ce qui est rédigé |

```sh
ls content/          # pipeline/ only  ⇒ platform;  paper dirs ⇒ folio
```

**folio-assistant ne contient aucun contenu.** Si vous vous apprêtez à y
écrire de la matière — un chapitre, une constante, une liste de mots-clés
de chapitre — vous êtes dans le mauvais dépôt, ou ce que vous écrivez
devrait être des données fournies par le folio. Voir §7.

## 2. Vos cinq premières minutes

```sh
beans prime && beans list      # le plan de travail — voir §6
scripts/session-start-coord-sweep.sh   # équivalent indépendant du CLI
bun run src/index.ts --check-deps      # ce que cet environnement peut faire
```

`--check-deps` importe plus qu'il n'y paraît. De nombreuses vérifications
se dégradent en `n/a` au lieu d'échouer lorsqu'un outil est manquant (pas
de chaîne Lean, pas d'Atlas, pas de LaTeX). **Un `n/a` n'est pas une
réussite.** Si vous rapportez « tout est propre » sans savoir ce qui a été
ignoré, vous rapportez l'absence de données comme un résultat.

## 3. Trouvez la bonne compétence — n'improvisez pas

Les compétences sont l'unité de travail ici. Avant de créer une procédure
à la main, vérifiez si une existe déjà.

| Où | Ce que ça vous donne |
|---|---|
| `skills/folio-core/` | indépendant du contenu : coordination, watchers, QA, rendu, bibliographie |
| `skills/folio-paper-adapter/` | articles : Lean, LaTeX, preuves, simulateurs |
| `skills/authoring-who-smart-guidelines/` | WHO SMART DAK / IG |
| [Référence du schéma de compétences](../../reference/skills/) | contrat d'entrée/sortie typé par compétence |
| [Instructions de compétences](../../reference/skill-instructions/) | corps d'instructions complets générés |
| [Compétences & rôles](../../skills.html) | comment les compétences, rôles et capacités se composent |

Les deux répertoires `reference/` sont **générés** — ne les modifiez jamais
à la main. Régénérez avec `bun run scripts/gen-schema-docs.ts` et
`bun run scripts/gen-skill-docs.ts`.

## 4. Le modèle d'objets de contenu, en bref

Un bloc de contenu est un **triple** partageant un nom racine :

```
<bloc>.ts     manifeste — label, kind, uses[], lean.ref, cites[]
<bloc>.md     le narratif qu'un lecteur lit réellement
<bloc>.lean   la formalisation (quand le type l'exige)
<bloc>.qa.json  fichier QA — résultats d'audit, par critère
```

Le manifeste `.ts` est la source de vérité pour la structure. Le *statut*
de formalisation est dérivé au moment de la construction, jamais stocké
dans le manifeste.

## 5. Deux relations de dépendance — ne les confondez pas

Cela perturbe constamment les agents.

- **`uses[]` est éditorial.** « Qu'est-ce qu'un lecteur doit avoir lu
  pour suivre ce bloc ? » Rédigé — maintenu par l'agent/humain.
- **Le graphe formel est dérivé automatiquement** de `lean.ref`, jamais
  écrit à la main.

Ils divergent légitimement dans les deux sens : une preuve invoque des
lemmes `simp` dont personne n'a besoin de lire ; un théorème est motivé
par un exemple qu'il ne cite jamais formellement.

**Ne peuplez jamais `uses[]` depuis Lean.** Cela détruit le signal à
partir duquel chaque métrique d'ordonnancement est calculée.

## 6. Suivez le travail dans beans, pas dans votre tête

`beans` est le **seul** mécanisme de tâches — local à la session *et*
multi-agents. `beans/` est commité, donc un plan survit à une reprise
dans un nouveau conteneur.

```sh
beans list
beans create "<titre>"
beans update <id> --status in-progress    # REVENDIQUEZ avant de travailler
```

Revendiquez avant de travailler pour que deux sessions ne prennent pas le
même élément, et ne résolvez ou supprimez jamais le bean d'un pair.

## 7. Fichiers QA et axes

Chaque bloc peut porter un `<bloc>.qa.json` enregistrant, par critère, ce
que chaque réviseur a trouvé — `script`, `agent`, ou `human`.

Les critères sont regroupés en **axes** (`proof`, `voice`, `detangler`,
`uses`, `canonical`, `compute`, `bibliography`, …). Exécutez-en un :

```sh
bun run content/pipeline/qa-sweep.ts --axis uses content/<paper>
bun run content/pipeline/qa-staleness.ts content/<paper>
```

## 8. Livrer le travail

```sh
/prepare-merge [base]
```

## 9. Où chercher les informations

| Question | Réponse |
|---|---|
| Commandes du projet, conventions | `AGENTS.md` (source de vérité générique pour les agents) |
| Ce que fait une compétence | `skills/**/`, ou les [corps d'instructions](../../reference/skill-instructions/) générés |
| Le schéma des blocs | `schemas/types.ts` |

## 10. Habitudes pour éviter les ennuis

- **`n/a` n'est pas une réussite.** Dites ce qui a été ignoré et pourquoi.
- **Revendiquez un bean avant un travail durable.** D'autres peuvent être en cours.
- **Ne codez pas en dur un nom de document.** Un folio peut en contenir plusieurs.
- **N'écrivez pas de contenu dans la plateforme.**
- **Régénérez, ne modifiez jamais à la main,** tout ce qui est sous `docs/reference/`.

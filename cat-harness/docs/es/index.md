---
layout: default
title: "Inicio (ES)"
lang: es
# `lang` above is what makes this a translation -- nothing reads `fr` out of
# the path. `nav_exclude` keeps it out of the statically built nav, and
# `mountNavLocale` (docs/assets/js/docs-ui.js) puts it back in place of its
# source when this locale is selected. There is no `nav_order`: it stands
# where its source stands. skills/folio-core/translation-manager.md
nav_exclude: true
translation_status: unverified
translation_source: index.md
description: "folio-assistant — un marco de habilidades de agente independiente del contenido."
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# folio-assistant
{: .fs-9 }


Un marco de habilidades de agente independiente del contenido para la autoría de
contenido riguroso con un modelo de lenguaje grande — artículos científicos y
libros, Directrices SMART de la OMS y Guías de Implementación FHIR —
respaldado por un servidor MCP, control de acceso basado en roles y un modelo
de objetos de contenido tipado.
{: .fs-6 .fw-300 }

[Comenzar](../getting-started.html){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Instalar](../installation.html){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Ver en GitHub](https://github.com/litlfred/folio-assistant){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Cuatro cosas, en orden

**1. El plan de trabajo es donde dices lo que estás haciendo.**
No un mensaje de chat, no un comentario: [beans]({{ '/beans-and-todos.html' | relative_url }}), un almacén versionado que cualquier sesión o agente puede leer. Reclama antes de trabajar para que una sesión hermana no tome el mismo elemento; un bean que resulta no ser necesario se marca `scrapped`, con sus razones, y nunca se borra.

```sh
cat-harness/scripts/install-beans.sh && export PATH="$HOME/.local/bin:$PATH"
beans list                          # lo que está abierto
beans create "<title>"              # …tras comprobar que el título no existe
beans <id> --status in-progress     # reclamarlo, de forma visible
```

**2. Crea tu primer folio.** Este repositorio es la *plataforma*; tu contenido vive en el suyo. Un solo comando lo prepara: los manifiestos, la declaración, los archivos del agente y el enlace de vuelta aquí:

```sh
bun run init-folio --help
```

Después, [Primeros pasos]({{ '/getting-started.html' | relative_url }}) acompaña el primer bloque por la validación, el renderizado y la revisión.

**3. Sabe qué tipo de cosa estás escribiendo.** Un *documento* es prosa estructurada; un *artículo* (paper) es eso más los tipos de bloque cuya afirmación es una aserción formal, respaldada por Lean y compuesta con LaTeX. La elección decide qué bloques son válidos y qué controles se ejecutan: [Tipos de contenido]({{ '/content-types.html' | relative_url }}).

**4. La documentación que nunca leerás.**
[Toda ella]({{ '/guides/index.html' | relative_url }}): las guías de autoría, la arquitectura, el flujo de publicación, la referencia generada de esquemas y habilidades. Está aquí, es exhaustiva, y lo honesto es esperar que llegues a ella desde un buscador en el momento exacto en que algo se rompe. Es una buena forma de usarla. Los tres pasos de arriba son los que vale la pena leer ahora.

Cuando lo que te desconcierta es la *maquinaria* y no la autoría —quién hace algo, en qué proceso, con qué habilidad— empieza por [La plataforma]({{ '/platform.html' | relative_url }}). Una sola frase allí contiene todo el modelo, y cada palabra en ella es un objeto declarado por separado.

---

## ¿Qué es folio-assistant?

**folio-assistant** es la *plataforma* — no contiene contenido. Proporciona
las habilidades, los esquemas, las herramientas y un servidor MCP (Model Context
Protocol) que un agente impulsado por LLM utiliza para planificar, redactar, validar,
revisar, probar y publicar un **folio** de contenido que reside en un repositorio independiente.

> **Separación de responsabilidades.** Esta documentación describe el *formalismo del
> marco de trabajo* y *cómo usar folio-assistant* — mantenido deliberadamente **separado
> de cualquier contenido específico**. Cuando aparece contenido en estas páginas, es
> puramente ilustrativo (un *ejemplo*), nunca el artefacto canónico.

```mermaid
flowchart LR
    A[Autor + LLM] -->|chat / herramientas MCP| B(folio-assistant)
    B --> C{Adaptador de contenido}
    C -->|artículo| D[Repositorio Lean + LaTeX]
    C -->|WHO SMART DAK| E[L2 BPMN / DMN / Excel]
    C -->|WHO SMART IG| F[L3 FHIR / FSH]
    B --> G[Habilidades + Esquemas + RBAC]
    D & E & F --> H[Sitio publicado / PDF / IG]
```

## Tipos de contenido admitidos

folio-assistant es **extensible** — cada tipo de contenido es gestionado por un
adaptador de contenido y un paquete de habilidades correspondiente. Los tipos
admitidos actualmente:

| Tipo de contenido | Artefactos | Paquete de habilidades |
|-------------------|------------|------------------------|
| **Artículos científicos y libros** | Formalización Lean 4 + LaTeX/Markdown | [`authoring-math`](../content-types.html#scientific-papers--books) |
| **Kits de adaptación digital (DAK) de las Directrices SMART de la OMS** | Artefactos L2 — BPMN, DMN, diccionarios de datos Excel, personas | [`authoring-who-smart-guidelines`](../content-types.html#who-smart-guidelines-daks-l2) |
| **Guías de implementación SMART de la OMS** | Recursos FHIR L3, FSH, salida de IG Publisher | [`authoring-who-smart-guidelines`](../content-types.html#who-smart-implementation-guides-l3) |
| **Otros** | Extensible — agregue un nuevo adaptador + paquete de habilidades | [Añadir un tipo de contenido](../guides/new-content-type.html) |

El ciclo transversal [`content-lifecycle`](../content-types.html#the-content-lifecycle)
(planificar → redactar → validar → revisar → probar → publicar → retroalimentación → retirar)
se aplica a cada tipo de contenido. El
[flujo de publicación](../publication-workflow.html) lo modela adecuadamente —
en diagramas de carriles BPMN, con los roles, la puerta de validación HCI y el
plan de trabajo compartido.

## A dónde ir a continuación

- **[Instalación](../installation.html)** — requisitos previos, clonación, `bun install`, verificación de capacidades.
- **[Primeros pasos](../getting-started.html)** — conecte el servidor MCP a su LLM y ejecute su primera habilidad.
- **[Tutorial: Redactar un artículo con folio-assistant](../guides/writing-a-paper.html)** — un recorrido completo guiado por LLM con una sesión de chat simulada.
- **[Tipos de contenido](../content-types.html)** — el formalismo de cada dominio de autoría.
- **[Flujo de publicación](../publication-workflow.html)** — diagramas de carriles BPMN de los procesos de edición y publicación.
- **[Incorporación del agente](../guides/agent-onboarding.html)** — orientación para un agente LLM situado en un folio: primeros pasos, búsqueda de habilidades, el modelo de objetos de contenido, sidecars de QA.
- **[Habilidades y roles](../skills.html)** — cada habilidad y rol, y cómo interactúan junto con el LLM.
- **[Referencia del esquema de habilidades](../reference/skills/)** — contratos de entrada/salida generados para cada habilidad.
- **[Referencia de la API de TypeScript](../api/)** — el modelo de objetos de contenido (`Block`, `Chapter`, `Paper`, builders, restricciones Zod).
- **[Arquitectura](../architecture.html)** — adaptadores, servidor MCP, RBAC, el modelo de bloques.

## Mapa de la documentación

```mermaid
flowchart TD
    Inicio --> Instalar[Instalación]
    Inicio --> PP[Primeros pasos]
    Instalar --> PP
    PP --> Tut[Tutorial: redactar un artículo]
    PP --> TC[Tipos de contenido]
    TC --> Habilidades[Habilidades y roles]
    TC --> FP["Flujo de publicación<br/>(carriles BPMN)"]
    TC --> Guias[Guías de autoría]
    Guias --> Articulo[Artículos: Lean + LaTeX]
    Guias --> DAK[WHO SMART DAK / L2]
    Guias --> IG[WHO SMART IG / L3 FHIR]
    Guias --> Nuevo[Añadir un tipo de contenido]
    Habilidades --> Ref[Referencia de esquemas]
    TC --> Ref
    Ref --> API[Referencia API TypeScript]
    Inicio --> Arch[Arquitectura]
```

> Los nodos del mapa son clicables en el sitio de documentación.

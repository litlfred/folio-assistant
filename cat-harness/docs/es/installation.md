---
layout: default
title: Instalación
lang: es
nav_exclude: true
translation_status: unverified
translation_source: installation.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# Instalación
{: .no_toc }

1. TOC
{:toc}

---

> Instalar es la parte fácil. Lo que debes ejecutar **antes de hacer push** es
> [`platform-gates`](reference/skill-instructions/platform-gates.html) —
> que `bun test` pase no significa que los gates hayan pasado, y la lista se deriva del
> flujo de trabajo de CI en lugar de estar fijada por escrito. Si estás incorporando folio-assistant sobre
> un repositorio que ya existe, lee primero
> [`repo-conversion`](reference/skill-instructions/repo-conversion.html).

## Requisitos previos

folio-assistant se ejecuta sobre [Bun](https://bun.sh) y se conecta a un agente LLM a través de
MCP. La plataforma en sí solo necesita Bun; los tipos de contenido individuales incorporan
cadenas de herramientas más pesadas (LaTeX, Lean, el FHIR IG Publisher) que se verifican en
tiempo de ejecución y se pueden instalar bajo demanda.

| Requisito | Necesario para | Instalación (Linux/macOS) | Instalación (Windows) |
|-------------|-----------|---------|---------|
| **Bun ≥ 1.0** | el marco de trabajo (siempre) | `curl -fsSL https://bun.sh/install \| bash` | `winget install Oven-sh.Bun` |
| Git + git-lfs | repositorios de contenido | `apt install git git-lfs` | `winget install Git.Git GitHub.GitLFS` |
| LaTeX (`latexmk`, `texlive`) | renderizado de artículos | `apt install texlive-full latexmk biber` | `winget install MiKTeX.MiKTeX` |
| Lean 4 (mediante `elan`) | formalización de artículos | `curl …/elan-init.sh \| sh -s -- -y` | consulta las [versiones de elan](https://github.com/leanprover/elan/releases) |
| Java 21 + IG Publisher + SUSHI | IGs SMART de la OMS (L3) | consulta la [guía de IG SMART de la OMS](guides/who-smart-ig.html) | `winget install EclipseAdoptium.Temurin.21.JDK`, luego la guía |
| `pandoc`, `ripgrep` | conversiones, búsqueda | `apt install pandoc ripgrep` | `winget install JohnMacFarlane.Pandoc BurntSushi.ripgrep.MSVC` |

No necesitas todos estos requisitos — instala solo lo que requieran los tipos de contenido
que redactas. La comprobación integrada de capacidades te indica qué falta.

> **Solo se requiere Bun.** Cada una de las demás filas depende del tipo de contenido y se comprueba en
> tiempo de ejecución, por lo que no instales nada más hasta que `check-deps` lo solicite.

## Clonar e instalar

```sh
git clone https://github.com/litlfred/folio-assistant.git
cd folio-assistant
bun install
```

### En Windows, existe un script

En una máquina limpia que solo cuenta con un cliente git, este script instala Bun (a través de winget donde
esté disponible), actualiza el `PATH`, ejecuta `bun install` y luego da paso a la
comprobación de capacidades:

```powershell
git clone https://github.com/litlfred/folio-assistant.git
cd folio-assistant
.\cat-harness\scripts\bootstrap.ps1 -CheckOnly   # solo reporte, no instala nada
.\cat-harness\scripts\bootstrap.ps1              # ejecutarlo
```

Instala Bun y nada más — LaTeX, Lean, Java y el IG Publisher se mantienen
por tipo de contenido, reportados por `check-deps` con sugerencias de instalación.

### En Linux/macOS, también existe un script

`cat-harness/scripts/start-folio-assistant.sh` instala Bun si no está presente y
luego inicia el servidor, y
`cat-harness/adapters/mcp-server/install.sh` es un instalador más completo que cubre
también TeX Live. Ambos estuvieron indocumentados hasta el 2026-09-21
([#740](https://github.com/litlfred/folio-assistant/issues/740)) — motivo por el cual
existe esta sección.

## Verifica tu entorno

La comprobación con `--check-deps` informa qué capacidades están presentes y proporciona una
sugerencia de instalación para cualquier elemento faltante:

```sh
bun run cat-harness/src/index.ts --check-deps
# o a través del script de npm
bun run check-deps
```

## Ejecutar el servidor

folio-assistant es un servidor MCP. Admite dos transportes:

```sh
# transporte stdio — lo que inician los arneses de LLM (Claude Code, etc.)
bun run cat-harness/src/index.ts --stdio

# transporte HTTP — para una instancia compartida de larga duración / la interfaz web
bun run cat-harness/src/index.ts --http

# apúntalo al repositorio de contenido que estés redactando (por defecto ../.. )
bun run cat-harness/src/index.ts --stdio --repo /path/to/your/content-repo
```

Hay scripts de conveniencia en `package.json`:

```sh
bun run start          # predeterminado (stdio)
bun run start:http     # transporte HTTP
bun run test           # pruebas unitarias (bun test)
bun run test:e2e       # pruebas de extremo a extremo con Playwright
bun run lint           # eslint
```

## Configurar para tu folio

Copia la configuración de ejemplo en tu repositorio de **contenido** (no en
folio-assistant) y ajústala para tu tipo de contenido:

```sh
# El DESTINO se nombra según tu instancia -- `my-folio.config.json`, no una
# palabra fija. El archivo de ejemplo conserva su propio nombre: así es como se llama.
cp harness.config.example.json /path/to/your/content-repo/<your-name>.config.json
```

```json
{
  "contentType": "document",
  "adapter": "document",
  "adapterModule": "./folio-assistant/adapters/document/index.ts",
  "feedbackDir": ".folio-feedback",
  "skills": ".claude/skills/local"
}
```

`contentType` selecciona tanto el adaptador como el *perfil* de tipo de bloque. Utiliza
`"paper"` (y `adapters/paper/index.ts`) para un folio con matemáticas respaldadas
por Lean — el adaptador paper amplía el de document, por lo que también ofrece todas
las herramientas de document. `folio_init` escribe este archivo por ti; consulta
[Iniciar un nuevo folio](https://github.com/litlfred/folio-assistant#start-a-new-folio).

---

## Conectar un arnés de LLM
{: #connecting-an-llm-harness }

folio-assistant expone sus herramientas a través de MCP, por lo que cualquier arnés de agente compatible con MCP
puede controlarlo. A continuación se presentan las configuraciones para los más comunes. En todos los casos, el agente
inicia el servidor mediante **stdio**.

### Claude Code

Agrega folio-assistant como un servidor MCP. La configuración con ámbito de proyecto se encuentra en `.mcp.json`
en la raíz de tu repositorio de contenido:

```json
{
  "mcpServers": {
    "folio-assistant": {
      "command": "bun",
      "args": ["run", "/path/to/folio-assistant/cat-harness/src/index.ts", "--stdio", "--repo", "."]
    }
  }
}
```

O regístralo desde la CLI:

```sh
claude mcp add folio-assistant -- bun run /path/to/folio-assistant/cat-harness/src/index.ts --stdio --repo .
```

Claude Code también lee `AGENTS.md` / `CLAUDE.md` de forma nativa y respeta el
hook `SessionStart` en `.claude/settings.json` — de modo que la preparación del plan de trabajo se ejecuta
automáticamente cuando inicia una sesión.

### Antigravity

Antigravity lee `AGENTS.md` de forma nativa y admite servidores MCP y un
hook de ciclo de vida `SessionStart`. Agrega el servidor a su configuración de MCP (formato JSON
compartido con Gemini CLI):

```json
{
  "mcpServers": {
    "folio-assistant": {
      "command": "bun",
      "args": ["run", "/path/to/folio-assistant/cat-harness/src/index.ts", "--stdio", "--repo", "."]
    }
  }
}
```

Conecta la preparación de inicio de sesión al hook `SessionStart` de Antigravity para que cada
sesión se prepare con el plan de trabajo — apunta el comando del hook al script
compartido `cat-harness/scripts/session-start-coord-sweep.sh` (el mismo script que utilizan todos
los arneses; solo el formato de configuración del hook varía según la herramienta).

### Gemini CLI

Gemini CLI lee `AGENTS.md` / `GEMINI.md` de forma nativa. Registra el servidor MCP en
su configuración y reutiliza el mismo script `SessionStart`:

```json
{
  "mcpServers": {
    "folio-assistant": {
      "command": "bun",
      "args": ["run", "/path/to/folio-assistant/cat-harness/src/index.ts", "--stdio", "--repo", "."]
    }
  }
}
```

### Cualquier otro cliente MCP

Apunta tu cliente al comando stdio anterior, o ejecuta el transporte HTTP
(`bun run start:http`) y conéctate a través de HTTP. El servidor MCP expone una
herramienta `work_plan_prime` que cualquier agente conectado por MCP puede invocar para obtener
una preparación idéntica del plan de trabajo en tiempo real, independientemente del arnés.

> **Por qué funciona en diferentes arneses.** La disciplina reside en `AGENTS.md` (un
> estándar de agentes de la Linux Foundation leído de forma nativa por Claude Code, Gemini CLI,
> Antigravity, Cursor, Copilot y otros); el estado en tiempo real se expone tanto como un
> hook `SessionStart` específico de cada arnés a través de un script compartido, como mediante la
> herramienta MCP `work_plan_prime`. Consulta la página de [arquitectura](architecture.html).

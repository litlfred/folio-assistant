---
title: "Deploying the Interoperability Test Bed with the harness"
kind: proposal
issue: 991
summary: >-
  Puts what is decided and what is still open about deploying the Interoperability Test Bed (ITB) next to the harness on one page: the parts of an ITB installation, the hosting choices, the `itb-benchmark` deployment description and what it still needs, the credentials by name, and the process and skill that do not exist yet. Draft, not built; four owner questions.
---

# Deploying the Interoperability Test Bed with the harness
{: .no_toc }

**Draft, 2026-11-10. Not built.** Issue #991. Asked by the owner on 2026-11-10: *"deployment in context ITB"*: where the deployment architecture, the process and the skills for the ITB live.

Today the answer is spread over three proposals and two folders, and part of it does not exist. This page gathers it in one place. It changes no decision. Each decision it repeats links to where it was made. What is new is a list of the gaps and four questions for the owner (§7).

1. TOC
{:toc}

---

## 1. Where things are today

| Topic | Where | State |
|---|---|---|
| How a test run works, end to end | [Testing AI agents fairly](assured-ai-test-harness-2026-11-03.md) §4 | Agreed design |
| The harness services the ITB calls (`harness-up`, `seed`, `start-agents`, `observe`, `state`, `harness-down`) | [Work items store and process driver](bean-store-and-process-driver-2026-11-02.md) §4.8 | Agreed design, not built (step 12) |
| The ITB drives each run | same, decision Q6 (2026-11-02) | Decided |
| Plans reach the ITB as OpenTestBed Gherkin | [Test plans, FHIR TestPlan and the ITB](test-interop-itb-fhir-testplan-2026-10-24.md), decision D4 | Decided |
| The ITB export and the results import live in cat-harness-tools | same, decision D3 | Decided, not built (P6) |
| How a deployment is described (placements, credentials by name) | [Deployment descriptions](deployment-descriptions.md) | Schema built in cat-harness-tools (`schemas/process/deployment-description.ts`) |
| The deployment examples | `scenarios/deployments/`: `developer`, `private-github`, `self-sovereign`, `sovereign-cloud`, `test-swarm`, `today` | No `itb-benchmark` yet |
| A sketch of `itb-benchmark` | [Work items store and process driver](bean-store-and-process-driver-2026-11-02.md) §4.11 | Sketch only (step 14) |
| The ITB's own installation guide | ingested in fhir-harness, `library/isaitb-2026-interoperability-test-bed-readme` | Source material |
| A process (BPMN) for setting up or running the ITB | none | **Missing** |
| A skill for deploying or running the ITB | none. `sdlc/skills/sdlc-core/test-engineer.md` mentions the ITB only in passing | **Missing** |

---

## 2. The parts of an ITB installation

From the ITB's own README, as held in fhir-harness's library:

| Part | Docker image | Job |
|---|---|---|
| Test engine | `isaitb/gitb-srv` | Runs the test cases and reports progress and outcome |
| Front end | `isaitb/gitb-ui` | User interface, users, configuration, REST API, webhooks |
| Database | `isaitb/gitb-mysql` (MySQL 8+) | Keeps everything the ITB stores |
| Session cache | `isaitb/gitb-redis` (Redis 7+) | Keeps user sessions |
| Extension services | for example the OpenTestBed plugins (`itb-plugin-fhir-validator`, `itb-plugin-jwt`, `itb-plugin-oauth`, `itb-plugin-hcert-decoder`) | Validation and processing steps a test case calls |

The four main parts are started together from one `docker-compose.yml` (`docker compose up -d`). The European Commission's DIGIT also runs a shared ITB instance, and OpenTestBed's `itb-manager` deploys and drives an instance.

**What the harness adds next to it:**

```
   ┌─────────────── ITB ───────────────┐        ┌──────────── harness ────────────┐
   │ gitb-ui ── gitb-srv ── plugins    │ calls  │ harness services                │
   │    │          │                   │ ─────► │ harness-up, seed, start-agents, │
   │  MySQL      Redis                 │        │ observe, state, harness-down    │
   └───────────────────────────────────┘        │    │                            │
           ▲                                    │    ├─ run-scoped work-plan store │
           │ test suites (GITB TDL)             │    ├─ pinned context repository  │
           │ compiled by otb-gherkin            │    └─ agents, each started by    │
   ┌───────┴─────────────┐                      │       its launch Tool + model   │
   │ ITB export          │◄── test-plan/v1      └─────────────────────────────────┘
   │ (cat-harness-tools) │                               │ trace
   └─────────────────────┘    results (TAR) ──► folio-test-run/v1 (import)
```

**The fact that shapes the hosting choice:** the ITB's test engine must be able to **reach the harness services**. Where the ITB runs therefore decides whether the harness services need an address that can be reached from outside the machine they run on.

---

## 3. Where the ITB runs: the choices

| | Choice | What it costs | What it gives |
|---|---|---|---|
| **H1** | **Our own ITB, on the same machine as the harness**, from the ITB's `docker-compose.yml` | Docker on that machine; six ITB secrets to supply (§5) | Nothing is exposed to the internet: the ITB reaches the harness services on the local machine. Repeatable, and can be thrown away after a run. Fits developing the services and the Gherkin steps |
| **H2** | **Our own ITB, in a cloud project** (vendor cloud or sovereign cloud) | A host to run and pay for; the harness services need an address the ITB can reach, with authentication | Several people and agents can use one instance; fits the benchmark runs that the concept note's cloud credits would pay for |
| **H3** | **A WHO ITB instance** (the one WHO-ITB's community uses) | Needs WHO's agreement and an account; the harness services must be reachable from WHO's instance; we do not control its versions | Results sit where the WHO community looks for them; fits the `who-itb-agreement` plan |
| **H4** | **DIGIT's shared ITB instance** | An account with DIGIT; same reachability need as H3 | No hosting at all, but the instance is shared with unrelated projects |

**Recommended, for the owner to rule (Q-ITB-1):** **H1 first**, so the services and steps can be built and tested with nothing exposed and no cloud spend. Then **H2** for the benchmark, once step 10's cloud credits exist. H3 stays the target for results WHO should see. One installation can be described for each, so choosing H1 now does not close off the others.

---

## 4. The `itb-benchmark` deployment description

The sketch in [the process driver proposal](bean-store-and-process-driver-2026-11-02.md) §4.11 describes the agents and leaves out the ITB itself. Written as a file in `scenarios/deployments/` for choice H1, it would read:

```json
{
  "id": "itb-benchmark",
  "title": "ITB benchmark run: Claude and Gemini on one plan",
  "description": "A local ITB from its docker-compose file drives the harness services on the same workstation. Nothing is published.",
  "topology": {
    "forge": "github",
    "network": "internet",
    "compute": "workstation",
    "modelProvenance": "hosted",
    "toolSurface": "mcp",
    "modelCardinality": "stack",
    "dataStores": ["none"],
    "outwardFacing": false
  },
  "publicationHost": "none",
  "modes": ["test"],
  "stores": { "work-plan": "beans-run-scoped" },
  "placements": [
    { "actor": "test-bed", "host": "local", "compute": "workstation",
      "credentials": { "harness-services": "ITB_HARNESS_SERVICES_KEY" } },
    { "actor": "agent-claude", "host": "local", "compute": "workstation", "toolSurface": "mcp",
      "launch": { "tool": "launch-beans-serve", "model": "claude-<version>" } },
    { "actor": "agent-gemini", "host": "vendor-cloud", "compute": "vendor-cloud", "toolSurface": "mcp",
      "modelProvenance": "hosted",
      "launch": { "tool": "launch-antigravity", "model": "gemini-<version>" },
      "credentials": { "model-api": "GCP_WIF_ASSURED_AI" } }
  ],
  "liveData": "artefacts-only"
}
```

**What has to exist before this file passes the schema's checks:**

| Needed | Why | Where it is tracked |
|---|---|---|
| A declared actor for the ITB (`test-bed` above, `kind: "system"`) | A placement may only name an actor that is already declared in `scenarios/actors/`. None stands for the ITB today | New; Q-ITB-2 |
| Declared actors for the agents under test (`agent-claude`, `agent-gemini`), or a ruling to reuse existing ones | Same rule. `test-swarm` reuses `authoring-agent` and `review-agent` | New; Q-ITB-2 |
| `launch` on a placement | Not in the schema; open question Q8 | Step 14 |
| A `beans-run-scoped` work-plan store Tool | The deployment's `stores` must name a Tool the toolset has | Step 9 |
| The harness services | What the ITB calls | Step 12 |

---

## 5. Credentials, by name only

Following [Credentials: needs and supply](credentials-needs-and-supply.md), the deployment names each secret and never holds a value.

| Need | Secret name (proposed) | Used by |
|---|---|---|
| The ITB calls the harness services | `ITB_HARNESS_SERVICES_KEY` | `test-bed` placement and the harness services |
| An agent's model API | for example `GCP_WIF_ASSURED_AI` | the agent's placement |
| The ITB's own install (H1, H2) | `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `DB_DEFAULT_PASSWORD`, `APPLICATION_SECRET`, `MASTER_PASSWORD`, `HMAC_KEY` | the ITB's `docker-compose.yml` only; the harness never reads them |

The ITB's six names are the ones its own README requires. They stay in the environment of whoever starts the ITB. They are listed here so a deployment check can say they are set, never what they are.

---

## 6. The process and the skill that are missing

Nothing below is drawn or written yet. This only says what each would cover, so the owner can decide whether to have them (Q-ITB-3).

**A process, `itb-test-run`** (in `sdlc/processes/`), with lanes for the owner, the CI pipeline or tester, and the ITB:

1. Choose the installation (`CAT_DEPLOYMENT=itb-benchmark`) and check its secrets are set, by name.
2. Start the ITB, or confirm the hosted one is up (H1: `docker compose up -d`).
3. Export the plan: `test-plan/v1` to Gherkin and an OpenTestBed configuration, compiled to a GITB test suite, uploaded to the ITB.
4. The ITB runs the suite, calling the harness services.
5. Import the results as `folio-test-run/v1` and judge them by the plan's exit rule, the same as an in-house run (the existing `test-plan-execution` process and `test-certification` decision).
6. Tear down (H1: remove the run-scoped store and, if wanted, the ITB containers).

Steps 4 and 5 are already drawn in `test-plan-execution.bpmn` for in-house runs. The new process would call it rather than draw them again.

**A skill, `itb-deployment`** (in `sdlc/skills/sdlc-core/`), for the agent or person doing steps 1, 2 and 6: which hosting choice applies, the secret names, how to check the ITB is reachable, and how to confirm it can reach the harness services.

---

## 7. Questions for the owner

| | Question | Recommended |
|---|---|---|
| **Q-ITB-1** | Where does the ITB run first? | **H1**, our own ITB on the same machine as the harness, then H2 for the benchmark (§3) |
| **Q-ITB-2** | Is the ITB a declared actor, and do agents under test get their own actors (`agent-claude`, `agent-gemini`) or reuse existing ones? | A new `test-bed` system actor, and one actor per agent under test, so a run's trace names each one |
| **Q-ITB-3** | Draw the `itb-test-run` process and write the `itb-deployment` skill now, or when step 12 starts? | When step 12 starts, so they describe services that exist |
| **Q-ITB-4** | Where does the ITB's `docker-compose.yml` for H1 live: in cat-harness-tools beside the ITB export (D3), or taken from OpenTestBed's `itb-manager`? | Reuse `itb-manager` if it fits, so there is no second copy to keep current. To check before step 12 |

---

## 8. What would change this

- If the ITB can run plans **without** calling back into the harness, the reachability point in §2 falls away and H3 or H4 become as easy as H1.
- If WHO asks for results on its own instance from the start, H3 comes before H2.
- If `itb-manager` already describes an installation in a form the deployment description can point at, §4's ITB placement becomes a reference to it rather than a new actor.

---

## Sources

- [Testing AI agents fairly: the WHO Assured AI test harness](assured-ai-test-harness-2026-11-03.md) §4, §8.6, §8.8, §9.4.
- [The work items store and process driver](bean-store-and-process-driver-2026-11-02.md) §4.8, §4.11, decisions Q6 and Q8.
- [Test plans, FHIR TestPlan and the ITB](test-interop-itb-fhir-testplan-2026-10-24.md): decisions D3 and D4, and the OpenTestBed repositories.
- [Deployment descriptions](deployment-descriptions.md), [Deployment topologies](deployment-topologies.md), [Credentials: needs and supply](credentials-needs-and-supply.md).
- The ITB README, ingested in fhir-harness as `library/isaitb-2026-interoperability-test-bed-readme` (sections s002, s003, s009, s020, s021).

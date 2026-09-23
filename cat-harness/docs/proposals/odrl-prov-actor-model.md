---
title: "Actors, ODRL and PROV-O: one permission language, one execution log"
kind: proposal
issue: 363
bean: folio-assistant-bkje
summary: >-
  How to simplify the actor / role / permission schema now that the owner has chosen W3C ODRL 2.2 for permissions and W3C PROV-O for logging. Actors shrink to prov:Agents with no permission list; the 14 flat permission ids become an ODRL profile of actions that inherit through includedIn; grants become ODRL rules scoped by Process, Task and Role constraints; every task run becomes a prov:Activity. The deterministic and the agentic BPMN engine then check the same policy, before and after the fact.
---

# Actors, ODRL and PROV-O: one permission language, one execution log

## What the owner decided, 2026-09-23

> "Actors can be instantiated.... actor schema instancnes could then be
> referenced. tools is what that corresponds to (e.g. github user). whatever
> the tool is, the process is that the data store manage authoentication and
> authorixation of the KG DS. up to their permission Actors should be able to
> visualize, render, commment on and or manipulate the KG or otherwise engage in
> a named Task under a Process with a specific Role."

Then, choosing among options:

- **Identity:** the login → Actor mapping lives **in the data store only**. An
  actor file never carries a login.
- **Grant scope:** by **Process, Task or Role**, and no scope means everywhere.
- **Permissions:** *"want more granular permissions, can inherit. options for
  existing json open standards. doensnt necc need to be rooted acyclic graph."*
  Then, having seen the comparison: **W3C ODRL 2.2**, with **W3C PROV-O** for
  logging.
- **Where this is going:** *"need to get to computable data sharing agreements.
  something that can work w/ digital wallets, gdhcn+vc's+hcert"*. ODRL's
  `Agreement` is that artefact, and this proposal keeps the door open to it
  without building it (§6).

## 1. What is there today, and why it is too much

An actor file (`.claude/skills/actors/*.json`, 32 of them) carries **three
lists** that answer three questions:

| field | answers | e.g. `admin.json` |
|---|---|---|
| `roles` | what it may act **as** | `administrator`, `editor`, `reviewer`, … |
| `permissions` | what it may **do**, in any lane | `admin-settings`, `role-management`, `release-authorization` |
| `capabilities` | what its **machine** has | `git-push` |

`permissions` draws on 14 flat ids in `skills/permissions/permissions.json`.
They have no hierarchy, no scope and no standard behind them, and nothing
enforces them (bean `bkje`). Identity exists only as prose in
`skills/folio-core/deployment-auth.md`, as a gateway role (viewer,
collaborator, owner) that joins to nothing here.

## 2. The simplified model

Four things, each borrowed from a standard, and nothing invented that a
standard already names.

### 2.1 Actor = `prov:Agent`, and nothing about permission

```jsonc
// .claude/skills/actors/admin.json — after
{
  "id": "admin",
  "@type": "prov:Person",            // person → prov:Person; agent, system → prov:SoftwareAgent; external → prov:Organization
  "title": "Administrator",
  "roles": ["administrator", "programme-manager", "editor", "reviewer"],
  "capabilities": ["git-push"],
  "identities": [{ "tool": "github-user", "withheld": true }]
}
```

- **`permissions` leaves the actor file.** What an actor may do becomes an
  ODRL rule *about* the actor (§2.3), so it lives in one place for every actor.
- **`kind` becomes the PROV-O class.** The four `ACTOR_KINDS` map onto PROV-O's
  three agent classes, and nothing is lost.
- **`roles` stays.** It is eligibility, "who is expected in a lane", which is
  what `role-model.md` already says it is. It is not a permission.
- **`capabilities` stays.** It is a fact about the machine (can it push, is it
  air-gapped), not a grant. `actor-facts-and-their-processes` is about those
  facts.
- **`identities` is new and says only that a binding exists.** The login is in
  the data store. `withheld: true` is the default, and a published actor file
  carrying a login is a QA failure.

### 2.2 Permission ids → an ODRL profile of actions

The 14 ids become **actions** in a folio ODRL profile, and each one is
`odrl:includedIn` an action from ODRL's own vocabulary. That is the inheritance
the owner asked for. `includedIn` forms a graph with no required root, and one
action may sit under several.

| folio action | `odrl:includedIn` | was |
|---|---|---|
| `folio:visualize` | `odrl:display` | new |
| `folio:render` | `odrl:derive` | new |
| `folio:comment` | `odrl:annotate` | `review-comments` |
| `folio:author` | `odrl:modify` | `content-authoring` |
| `folio:translate` | `odrl:translate` | `translation` |
| `folio:administer` | `odrl:modify` | `admin-settings`, `role-management`, told apart by `target` (the settings, the role graph) |
| `folio:perform` | `odrl:execute` | new: perform a named Task |
| `folio:approve`, `folio:adjudicate`, `folio:first-pass-review`, `folio:coordinate-smes`, `folio:validate-clinically`, `folio:report-qa`, `folio:govern`, `folio:authorize-release`, `folio:manage-release` | `folio:perform` | the other 9 ids, which are all *kinds of task* |

The last row is the simplification. Nine of today's 14 ids are not really
permissions to touch the graph. They are permission to perform a particular
kind of task, so they sit under `folio:perform` and are then scoped by
constraints (§2.3) instead of each becoming its own global switch. Two more
were one action on two targets, and ODRL's `target` says which.

### 2.3 Grants → ODRL rules, scoped by Process, Task and Role

```jsonc
// policies/folio-defaults.jsonld — one odrl:Set for the instance
{
  "@context": ["http://www.w3.org/ns/odrl.jsonld", { "folio": "…/ns/folio#" }],
  "@type": "Set",
  "uid": "…/policies/folio-defaults",
  "profile": "…/ns/folio-odrl",
  "permission": [
    { "assignee": "actor:admin", "action": "folio:authorize-release",
      "constraint": [{ "leftOperand": "folio:process", "operator": "eq",
                       "rightOperand": "release" }] },
    { "assignee": "actor:admin", "action": "folio:administer", "target": "graph:roles" },
    { "assignee": "actor:reviewer-agent", "action": "folio:comment" },
    { "assignee": "folio:anyone", "action": "folio:visualize" }
  ]
}
```

- **Scope is a constraint.** The profile defines three `leftOperand`s:
  `folio:process`, `folio:task` and `folio:role`. No constraint means
  everywhere, which is the owner's rule.
- **Performing a task needs two things**: a permission for `folio:perform`
  whose constraints match the task, **and** the actor holding the lane's role.
  Role eligibility (`roles`) and permission stay separate, as `role-model.md`
  already insists.
- **Inheritance between policies** is `odrl:inheritFrom`. An instance's policy
  inherits cat-harness's defaults, the same way `needs` inherits everything
  else.
- **Conflict** is ODRL's own `conflict` term (`perm`, `prohibit` or `invalid`), so
  "what if a permission and a prohibition both match" has a standard answer
  instead of ours.

### 2.4 Every task run → a `prov:Activity`

```jsonc
{
  "@type": "prov:Activity",
  "prov:startedAtTime": "2026-09-23T19:36:08Z",
  "prov:qualifiedAssociation": {
    "prov:agent": "actor:authoring-agent",
    "prov:hadRole": "role:author",
    "prov:hadPlan": "process:content-lifecycle#Task_author"   // the BPMN task is the prov:Plan
  },
  "prov:actedOnBehalfOf": "actor:admin",                   // an agent working for a person
  "prov:used": ["kg:…"], "prov:generated": ["kg:…"],
  "folio:underPolicy": "…/policies/folio-defaults"          // the one non-PROV term
}
```

PROV-O already has every piece the log needs:
- `hadPlan` is the BPMN task;
- `hadRole` is the lane's role;
- `actedOnBehalfOf` is a swarm agent working for a person;
- `used` and `generated` are the graph nodes touched.

## 3. Why this fits both BPMN engines

See [BPMN execution: one skill, two engines](../agentic-harness.html#bpmn-execution).

- **The deterministic engine** reads the ODRL policy **before** each task and
  refuses one that no permission covers. It writes the `prov:Activity` as it
  runs.
- **The agentic swarm** acts first. Its QA/QC report reads the PROV-O log
  **after**, and every `prov:Activity` with no matching ODRL permission, or a
  `hadRole` the lane does not bind, is a finding.

It is the same policy and the same log, checked at two different times. That
is exactly how the figure describes the mitigation at the agentic end:
"mechanical + agentic QA/QC reports".

## 4. What gets deleted

- `skills/permissions/permissions.json` becomes the ODRL profile. All 14 ids
  survive as actions or action + target, with their descriptions.
- `permissions` in every actor file moves into `policies/*.jsonld`.
- The gateway roles (viewer, collaborator, owner) in `deployment-auth.md`
  become default policies. The data store maps a login to an actor and
  evaluates ODRL.
- `LoadedActor.permissions` in `schemas/role-graph.ts` gives way to a pure
  `permits(actor, action, scope, policies)` that returns `permit`, `deny` or
  `unknown`. `unknown` is never permit.

**What does not change:** RoleDef, lanes and role `inherits`, RACI (which is
responsibility, not permission, as `raci.md` says), and `capabilities`.

## 5. What this needs, and in what order

Each step is its own PR with its own QA, and missing QA is a failure:

1. **The profile and the schemas**:
   - `schemas/odrl.ts`: zod for the ODRL subset used (Set, Agreement, Rule,
     Constraint, Party), validated against the W3C JSON-LD context;
   - `schemas/prov.ts`: the PROV-O Activity/Association subset;
   - the profile as JSON-LD, with a test that every `includedIn` resolves.
2. **Migration**: a script moves `permissions` out of the 32 actor files into
   `policies/folio-defaults.jsonld`. A test checks that no actor lost or gained
   a permission, by comparing before and after `permits`.
3. **`permits()`**: a table-driven test covering permit, deny, unknown, the
   role check and the conflict strategy.
4. **The skills**, rewritten:
   - `role-model.md`: three lists, and permissions are policies;
   - `deployment-auth.md`;
   - `process-state.md`: entering a task names its permission;
   - `bpmn-authoring.md`: lanes bind roles, never people;
   - `raci.md`.
5. **The QA/QC report over PROV-O**: the agentic end's mitigation, which is the
   first real consumer of all this.
6. **ihris**:
   - the 2009 use-case actors (A-PT1 HR Manager, …) become Roles;
   - "Assigned To" and "Source" become opaque `prov:Person` actors
     (`ihris-2009-staff-NN`), one each, with the identity withheld;
   - a leak check fails if a withheld name reaches `library/` or the site.

## 6. Not in this proposal: data sharing agreements

A computable data sharing agreement is an **`odrl:Agreement`**: an assigner, an
assignee, and permissions, prohibitions and duties. Nothing above prevents
signing one as a W3C Verifiable Credential, holding it in a wallet, trusting
its issuer through the WHO GDHCN trust lists (`did:web:tng-cdn.who.int:v2:trustlist:-:<country>`,
already indexed by `smart-trust`), or carrying it as an HCERT. That is the next
proposal, and it depends on this one: an Agreement is only as computable as the
actions and constraints it is written in.

## 7. Open questions for the owner

1. **Where policies live.** `policies/` at the instance root, or a declared
   directory with its own graph kind? A graph kind is recommended, because it
   is how everything else gets a viewer and QA.
2. **Default for an unauthenticated reader.** `folio:visualize` and
   `folio:render` only, or nothing?
3. **Enforcement engine.** Evaluate ODRL directly in the data store, or compile
   it to a relationship engine (OpenFGA/Zanzibar) there? The model above is the
   same either way, so this can wait until a data store is built.

## What would change this proposal

- **If an ODRL constraint cannot express a scope we need** (say, "only while the
  bean is in state X"), the fix is a new `leftOperand` in the profile. That
  would only change the proposal if it needed a rule shape ODRL does not have.
- **If PROV-O cannot record something the QA/QC report must check**, that goes
  in as a `folio:` term beside the PROV-O ones, the way `underPolicy` does
  above.

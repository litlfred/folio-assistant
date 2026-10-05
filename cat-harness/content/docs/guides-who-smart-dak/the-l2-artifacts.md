| Artifact | Skill | Format |
|----------|-------|--------|
| Business processes | [`bpmn-authoring`]({{ site.baseurl }}/reference/skills/bpmn-authoring.html) | BPMN 2.0 XML |
| Decision logic | [`dmn-authoring`]({{ site.baseurl }}/reference/skills/dmn-authoring.html) | DMN tables |
| Data dictionary | [`l2-dak-authoring`]({{ site.baseurl }}/reference/skills/l2-dak-authoring.html) | Excel / structured |
| Terminology | [`terminology-management`]({{ site.baseurl }}/reference/skills/terminology-management.html) | code systems / value sets |
| Review | [`content-review`]({{ site.baseurl }}/reference/skills/content-review.html) | criteria-based |

The table is the authoring skills, not the DAK. A DAK has **ten components**
(owner, 2026-09-30): the original eight, plus **scheduling logic**, split out
of decision-support logic, and **test scenarios**. Against the skills above:

| # | DAK component | covered above by |
|---|---|---|
| 1 | Health interventions and recommendations | — (cites L1) |
| 2 | Generic personas | — |
| 3 | User scenarios | — |
| 4 | Business processes and workflows | `bpmn-authoring` |
| 5 | Core data elements | `l2-dak-authoring`, `terminology-management` |
| 6 | Decision-support logic | `dmn-authoring` |
| 7 | Scheduling logic | `dmn-authoring` (decision tables) |
| 8 | Indicators and monitoring | — |
| 9 | Functional and non-functional requirements | — |
| 10 | Test scenarios | — |

A dash means *no skill in this table*. It does not mean no skill anywhere. It
is where to look before starting a component.

**Scheduling logic is authored, but not yet formalized.** It is written as DMN
decision tables, like decision-support logic. But it may not yet have its own
L2 logical-model component or L3 artefact (owner, 2026-09-30). That is why the
sources count differently, and the difference is recorded here:

- WHO's DAK figure (slide 3 of `cat-harness/library/kg-folio-asst-2026-09-30`)
  shows nine cards, with scheduling logic as #7, and testing drawn beside them.
- The SMART Base `DAK` logical model (`DAK.fsh`) declares nine fields: test
  scenarios **in**, and scheduling logic carried **inside** decision-support
  logic.
- The speaker notes on that slide said eight.
- WHO's IG starter kit, *L2 DAK authoring*
  (<https://smart.who.int/ig-starter-kit/l2_dak_authoring.html>; source
  `input/pagecontent/l2_dak_authoring.md` in
  `WorldHealthOrganization/smart-ig-starter-kit`, read from `main` on
  2026-09-30) **disagrees with itself**. Its introduction counts *"9
  interlinked components"* with scheduling logic as #7 and no testing. Its own
  table counts 9 with **test scenarios** as #9, and scheduling logic inside
  decision-support logic.

Ten is the owner's count, and this repository encodes it. `DAK_COMPONENTS` in
`smart-base/schemas/dak-kinds.ts` lists ten, and names scheduling logic in
`DAK_UNFORMALIZED_COMPONENTS`: it has a field name ready (`schedulingLogic`),
but `DAK.fsh` does not yet declare that field. The other nine are checked
against `DAK.fsh` field for field.

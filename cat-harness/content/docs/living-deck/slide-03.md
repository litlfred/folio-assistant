| # | component | what it holds |
|---|---|---|
| 1 | Health interventions and recommendations | the WHO guideline's recommendations; informs DAK scope |
| 2 | Generic personas | roles, responsibilities and interventions of the targeted personas |
| 3 | User scenarios | brief narratives of how the personas engage with the system |
| 4 | Business processes and workflows | generic clinical and non-clinical workflows; when data is collected and used |
| 5 | Core data elements | data for decisions and indicators; informs forms and L3 interoperability |
| 6 | Decision-support logic | decision tables for counselling and treatment algorithms |
| 7 | Scheduling logic | decision tables for scheduling by care plan (formerly part of 6) |
| 8 | Indicators and monitoring | numerators and denominators; person-centred data linked to aggregate |
| 9 | Functional and non-functional requirements | key functions and requirements of a digital tracking and decision-support system |
| 10 | Test scenarios | test data and scenarios to check a system against the other nine |

The figure draws the tenth, **testing: test data and test harness**, beside the nine cards rather than as one of them.

**Sources:** the owner, 2026-09-30 (ten: the original eight plus scheduling
logic and test scenarios); the SMART Base 1.0.0 `DAK` logical model;
[the L2 artefacts and their skills](guides/who-smart-dak.html).

> **Misaligned, in three directions:** the speaker notes said 8. The figure
> shows 9 cards, with testing beside them. The SMART Base `DAK` logical model,
> as the repository pins it, declares 9 fields: test scenarios **in**,
> scheduling logic carried **inside** decision-support logic. The owner's
> count is 10. WHO's IG starter kit disagrees with itself the same way: its
> introduction counts 9 with scheduling and no testing, and its table counts 9
> with test scenarios and scheduling inside decision support. Scheduling logic is authored as DMN decision tables but may not
> yet be formalized as its own L2 component or L3 artefact, and that is the
> gap the logical model shows. The notes are corrected in the owner's copy.

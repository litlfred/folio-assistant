The distinction is not terminology. The two have different owners, different
lifecycles and different failure modes.

| | **Bean** | **Todo** |
|---|---|---|
| Owner | An agent session | A person |
| Purpose | Process state for work in flight | A reminder of intent |
| Store | `beans/`, committed and shared | Not yet defined |
| Created by | An agent, after an exact-title check | The person, whenever they like |
| Closed by | The agent that did the work, with a summary | The person, on their own judgement |
| Visible to | Every sibling session | The person, primarily |
| Failure mode | Duplicated, or closed by the wrong session | Forgotten |

**The failure modes are what make the split worth keeping.** A duplicated bean
starves the work plan of signal — in one folio an unguarded re-run produced
14,688 duplicates, 92 % of every open bean in the repository. A forgotten todo
inconveniences one person. Machinery sized for the first is ceremony on the
second, and machinery sized for the second is nowhere near enough for the
first.

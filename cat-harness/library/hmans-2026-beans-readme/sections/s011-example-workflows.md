---
doc_id: hmans-2026-beans-readme
doc_title: "beans"
section_id: s011-example-workflows
section_title: "Example Workflows"
file: "README.md"
lines: 122-156
source_sha256: 85b9eb0aaedd41bb
granularity: heading
---
### Example Workflows

**But the real power of Beans** comes from letting your coding agent manage your tasks for you.

Assuming you have integrated Beans into your coding agent correctly, it will already know how to create and manage beans for you. You can use the usual assortment of natural language inquiries. If you've just
added Beans to an existing project, you could try asking your agent to identify potential tasks and create beans for them:

```
Are there any tasks we should be tracking for this project? If so, please create beans for them.
```

If you already have some beans available, you can ask your agent to recommend what to work on next:

```
What should we work on next?
```

You can also specifically ask it to start working on a particular bean:

```
It's time to tackle myproj-123.
```

Consider that your agent will be just as capable to deal with beans as it is with code, so how about using it to quickly restructure your tasks?

```
Please inspect this project's beans and reorganize them into epics. Also please create 2-3 milestones to group these epics in a meaningful way.
```

You can also add Beans-specific instructions to your `AGENTS.md`, `CLAUDE.md` or equivalent file, for example:

```
When making a commit, include the relevant bean IDs in the commit message
```

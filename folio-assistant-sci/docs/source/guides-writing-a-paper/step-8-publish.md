Finally, publish the rendered artifacts. In CI this is the `publish` workflow;
locally the agent runs `content_build` and the render tools, then commits.

> **You:** Publish it.
>
> **Assistant:** *(loads `content-publish`, `content_build`, commits + pushes)*
> Published. PDF, HTML, and the Lean blueprint are built; the work-plan item is
> marked resolved.

```sh
beans <id> --status resolved
```

---

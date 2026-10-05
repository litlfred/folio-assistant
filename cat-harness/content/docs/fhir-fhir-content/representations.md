The IG Publisher emits **three serialisations of every resource** — JSON, XML
and Turtle — plus HTML per resource page.

This platform's render path takes the **JSON**, wrapped in JSON-LD and JSON
Schema. That is a decision rather than an omission: three serialisations of
one resource are three chances to disagree about what the resource says, and
the JSON-LD wrapper carries the semantics the other two were being kept for.
An instance that genuinely needs RDF gets it by projecting the JSON-LD, not by
shipping the Publisher's Turtle.

**A representation that arrives and is not taken is recorded as a refusal.**
Otherwise "this IG publishes no Turtle" and "we ignored its Turtle" become the
same observation, and only one of them is a fact about the IG.

The `.html` case is different and worth separating. The Publisher's HTML is
not a serialisation of a resource — it is a *rendering*, with the Publisher's
own navigation, theme and cross-links baked in. Mounting it is what this
platform is moving away from, because finished HTML carries no front matter:
the navbar, the language bar, the QA badges and the translation surface all
stop at its edge.

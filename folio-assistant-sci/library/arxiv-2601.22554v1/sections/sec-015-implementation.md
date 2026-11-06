---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-015-implementation
section_title: "Implementation"
section_number: null
pages: 13-15
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
We briefly introduce the implementation of LeanArchitect. However, note that since writing this section, the
LeanArchitect implementation has changed and will continue to change for new features, performance, and
bug fixes.
At its foundation, LeanArchitect is built upon the following Node datatype, which represents a @[blueprint]-
tagged Lean declaration with relevant metadata.
/-- The statement or proof of a node. -/
structure NodePart where
/-- The natural language description of this part. -/
text : String
/-- The specified set of nodes that this node depends on, in addition to inferred ones. -/
uses : Array Name
/-- The set of nodes to exclude from ‘uses‘. -/
excludes : Array Name
/-- Additional LaTeX labels of nodes that this node depends on. -/
usesLabels : Array String
/-- The set of labels to exclude from ‘usesLabels‘. -/
excludesLabels : Array String
/-- The LaTeX environment to use for this part. -/
latexEnv : String
/-- A theorem or definition in the blueprint graph. -/
structure Node where
/-- The Lean name of the tagged constant. -/
name : Name
/-- The LaTeX label of the node. Multiple nodes can have the same label. -/
latexLabel : String
/-- The statement of this node. -/
statement : NodePart
/-- The proof of this node. -/
proof : Option NodePart
/-- The surrounding environment is not ready to be formalized, typically because it requires
more blueprint work. -/
notReady : Bool
/-- A GitHub issue number where the surrounding definition or statement is discussed. -/
discussion : Option Nat
/-- The short title of the node in LaTeX. -/
title : Option String
Nodes are stored in a persistent environment extension, mapping the name of each @[blueprint]-tagged
constant to the underlying node.
/-- Environment extension that stores the nodes of the blueprint. -/
initialize blueprintExt : NameMapExtension Node ←
registerNameMapExtension Node
A less common but useful feature is for a blueprint “node” to correspond to different Lean declarations a and
b. In the output, the node would have \lean{a, b}. To enable this feature, the user would specify the same
LATEX label for different Lean declarations (which still technically correspond to different Lean Nodes). We
maintain a mapping from a LATEX label to the set of nodes with such a label, as an environment extension
alongside blueprintExt. During the output, the nodes with the same label are merged to a single LATEX
environment. This allows uses such as interaction with Mathlib’s to_additive:
@[to_additive (attr := blueprint "my-label")]
theorem mul_theorem := sorry
LeanArchitect
14
which defines a blueprint node with Lean declarations mul_theorem and add_theorem.
We then define an attribute @[blueprint]. Upon tagging a Lean declaration, the attribute constructs a new
Node with fields populated by the configuration given to @[blueprint]. The @[blueprint] attribute specifically
has the following configuration options:
@[blueprint
"latex-label"
-- The LaTeX label to use for the node (default: Lean name)
(statement := /-- . . . -/) -- The statement of the node in LaTeX
(hasProof := true)
-- If the node has a proof part (default: true if the node is a
theorem)
(proof := /-- . . . -/)
-- The proof of the node in LaTeX (default: the docstrings in proof
tactics)
(uses := [a, "b"])
-- The dependencies of the node, as Lean constants or LaTeX labels
(default: inferred)
(proofUses := [a, "b"])
-- The dependencies of the proof of the node, as Lean constants or
LaTeX labels (default: inferred)
(title := /-- Title -/)
-- The title of the node in LaTeX
(notReady := true)
-- Whether the node is not ready
(discussion := 123)
-- The discussion issue number of the node
(latexEnv := "lemma")
-- The LaTeX environment to use for the node (default: "theorem" or
"definition")
]
Then we add the node with the above data to blueprintExt.
We also define two auxiliary tactics for writing proofs that more elegantly integrate with LeanArchitect.
The first is allowing docstrings to prepend a tactic, such as /-- Proof by induction on $b$. -/ induction
b with . . .. Such docstrings will be concatenated and become the “proof text” of the node. The second is
sorry_using [a, b], which acts like sorry as a proof placeholder, but also allows for specifying constants used
by the would-be proof (achieving the same effect as proofUses).
The blueprint content of a module is the content of a Lean module to be converted to LATEX, and it is
defined as the ordered list of Nodes in the module. Users may also use blueprint_comment /-- . . . -/ to
manually write raw LATEX to the blueprint content. Suppose Lean declaration MyNat.add_comm is tagged with
@[blueprint "thm:add-comm"]. We specify the rules for converting this node into LATEX as follows.
• \label is thm:add-comm
• \lean is MyNat.add_comm
• \uses is the automatically inferred dependencies of the declaration, plus or minus any manually specified
dependencies or exclusions. Automatic collection of used constants uses the same logic as #print axioms
in Lean core, but it collects either dependencies tagged with @[blueprint] or axioms. The \uses of the
statement are the dependencies of the declaration type (and if a definition, its value), while the \uses of
the proof (if a theorem) are the dependencies of the declaration value.
• \leanok of the statement (resp. proof) is added if sorryAx is not in the inferred Lean dependencies above.
For example, if the proof of MyNat.add_comm depends on sorry, \leanok is not added to the proof; but if
its proof only depends on MyNat.succ_add which in turn depends on sorry, then \leanok is added to
denote a completed proof formalization pending on an earlier unformalized lemma.
• \mathlibok is added to the statement (signifying the declaration is already in Mathlib) if MyNat.add_comm
is defined in a module under Init, Std, Batteries, or Mathlib. To tag such a theorem, the user can
write attribute [blueprint] MyNat.add_comm. This automatically differentiates if a theorem is already
in Mathlib, easing management work for humans upstreaming results.
• The text of the statement is given by (statement := /-- . . . -/) in the attribute, and the proof by
(proof := /-- . . . -/) or the proof docstrings.
LeanArchitect
15
• The statement title (\begin{theorem}[title] . . . \end{theorem}) is given by (title := /-- . . . -/).
• Similarly for other metadata such as \discussion and \notready, which are utility features in leanblue-
print.
The output LATEX defines two macros:
• \inputleannode{thm:add-comm}, which expands to a node in the LATEX blueprint with the above infor-
mation, as shown in section 3.4;
• \inputleanmodule{MyModule}, a higher-level command which expands to the LATEX blueprint content of
the entire module MyModule.
These macro definitions are saved to separate files in the LATEX build artifacts directory .lake/build/blueprint.
In the LATEX blueprint, the user may import the macros and write \inputleannode{. . .} to enter a theorem in
the blueprint.
Parallel to doc-gen4, LeanArchitect provides an internal lean_exe executable extract_blueprint that outputs
the LATEX artifacts of a single module to a file in .lake/build/blueprint. LeanArchitect then specifies a
module facet6 blueprint (lake build My.Module:blueprint), that calls this executable and registers the output
file, allowing Lake’s incremental build mechanism to only build the file if it is not up-to-date. We define a
library facet blueprint (lake build my-library:blueprint) that outputs the main header file, and a package
facet blueprint (lake build :blueprint) that runs the library facet on all libraries.
The blueprintConvert script primarily uses Python regular expression parsing to read the nodes in the existing
blueprint, and calls Lean to obtain the locations of each node in Lean. Then it inserts @[blueprint] tags
at appropriate locations in the code (while respecting existing attributes like to_additive). For a Lean
declaration imported from another project (usually, from Mathlib), the script inserts attribute [blueprint]
mathlib_node at an appropriate location: immediately before the first node (in topological order) that
depends on this node, or the root file if there is no such location. Finally, the script replaces the existing
\begin{theorem}\end{theorem} nodes in LATEX with \inputleannode{}. The conversion script is invoked by a
Lake script called by lake script run blueprintConvert. Among the customizable options are: whether to
convert only the nodes with \lean (default) or all nodes, whether to remove the \uses information for \leanok
nodes and let LeanArchitect infer it (default) or not, and formatting options for docstrings.
6See the Lake documentation.

---
doc_id: 9789240120747-eng
doc_title: "9789240120747-eng"
section_id: page-067
section_title: "Page 67"
pages: 67-67
pdf_page: 67
source_pdf: 9789240120747-eng.pdf
source_sha256: c710f7cf4a432221
text_source: text-layer
granularity: page
---
55
Symbol
Symbol 
name
Description
Activity 
with a 
business 
rule
This denotes a decision-making activity that requires the business rule, decision-
support logic or scheduling logic to be detailed in a decision-support table. This 
means that the logic described in the decision-support table will come into play 
during this activity as outlined in the business process. This is usually reserved 
for complex decisions. 
Sequence 
flow
This denotes the flow direction from a process to the next process. The end 
event should not have any output arrows. All symbols (except for the start event) 
may have an unlimited number of input arrows. All symbols (except for the 
end event and gateway) should have one and only one output arrow, leading 
to a new symbol, looping back to a previously used symbol or to the end event 
symbol. Connecting arrows should not cross over each other.
Message 
flow 
This denotes the flow of data or information from a process to another process. 
This is usually used for when data are shared across pools. 
Exclusive 
gateway 
This depicts a fork or decision point in the workflow. This may be a simple binary 
(e.g. yes/no) filter with two corresponding output arrows, or a different set of 
outputs.
Only two different outputs should originate from a decision point. If more than 
two output or sequence flow arrows are needed, you are likely trying to depict 
decision-support logic or a business rule, which should be depicted as an 
activity with a business rule instead (see above).
Parallel 
gateway
This is used to model concurrency in a process. This type of gateway allows 
forking into multiple paths of execution or joining multiple incoming paths of 
execution. An important difference between this and other gateway types is that 
the parallel gateway does not evaluate conditions.
Throw – 
link event
This serves as the start of an off-page connector. It is the end of the process 
when there is no more room on the page for that workflow. It is the end of a 
process on the current page or the end of a subprocess that is part of a larger 
process. A catch – link event must follow the throw – link event. 
Catch – link 
event
This serves as the end of an off-page connector. It is the start of a new process 
on a different page from the throw – link event or the start of a subprocess 
that is part of a larger process. A throw – link event must be aligned to a catch 
– link event. 
Ad hoc 
subprocess
An ad hoc subprocess can contain multiple activities (tasks or subprocesses), 
which can be executed in any order, executed several times or skipped. However, 
not all these activities need to be finished before moving on to the next activity.
Loop 
activity
This indicates that the activity repeats until a defined condition applies or ceases 
to apply. The condition on which a loop executes is included as an annotation.
Source: Business Process Model and Notation [website]. Milford, MA: Object Management Group; 2026 (https://www.omg.
org/spec/BPMN/2.0).
Note: The BPMN standard outlines additional conventions and nuanced symbols that can be used. The above selection of 
symbols should be sufficient, though, for the purposes of illustrating the business process workflows in a clear, standard 
way.
Annexes

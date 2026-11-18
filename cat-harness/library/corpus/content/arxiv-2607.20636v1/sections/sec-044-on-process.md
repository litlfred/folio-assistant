---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-044-on-process
section_title: "On Process"
section_number: null
pages: 75-76
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Now that I have developed a framework for thinking about and evaluating models, the
natural next question is: how do we operationalize this? In this section, I overview a
seven-step process for developing theoretical models for social problems that is consistent
with the discussed framework.
First, we must ground ourselves in social science scholarship: as computer scientists,
we are not the first to study the social problem of interest. As we do so, we internalize
the argument or arguments made in the respective papers and identify the crucial parts
of it. This distillation process provides a checklist for whether our model has adequately
modeled the phenomenon or not. Much like how in a scientific experiment, we must define
10A complementary limitation identified by Kathleen Creel points out that transparency in algorith-
mic systems and models could entail functional (knowledge of the algorithm), structural (knowledge
of its implementation in code), and run (knowledge of its execution on particular hardware and data)
transparency[Cre20]. In TCS models, we automatically have functional transparency, but the other two
are essential for real-world deployment, and other epistemic approaches to evaluation will play significant
roles in providing run transparency, in particular.
60
the hypothesis we wish to test before designing and running the experiment, here, we must
define what we want our model to show before building it. Otherwise it is too easy to
move the goal posts.
Next, we should find general theoretical frameworks that are useful. These could be
relevant because others have used them as coarse models for human behavior, or they could
model decision problems in an interesting way to which we can add social considerations.
From there, we set up the rules specific to the setting. Then, we can “evolve” the system
forward to investigate the outcomes. Do they match what existing scholarship says or
not? Which parts of the setting lead to those outcomes? Can we simplify the model and
get the same results? These are important questions to engage with in the first phase of
developing such a model. At this stage, it is critical to explicitly articulate assumptions
and conditions in order to legitimize the construction of the model [Par20].
Now, let us pause and think about the modules that comprise our model. Approaching
this question from a TCS perspective, we can carefully devise and redevise the modules
in an attempt to isolate properties of interest (earlier, we spoke about how oracles allow
us to isolate computational complexity, but we can more broadly consider “oracles” that
encapsulate other properties of interest).
We must start by articulating the mapping
between the parts of the model and the respect aspects of the target. Next, we must ask
which are abstractions and which are idealizations. Articulating these explicitly will help
us understand the relationship between our model and the world we are modeling, and it
clarifies for us the different levers we have within the model.
We can next try to use the modules to develop explanations. The initial step is to
once again make explicit which aspects of our model relate to which aspects of the target
[Moh25]. Then, we explicitly state a hypothesized explanation. This should then lead us
to which module should be affected according to that explanation. We may try changing
it as a thought experiment. As we vary things within a module of the model, we will gain
intuition for what effect that module has.
Next, we think about interventions. What do we want to be different about the world?
What does the explanation suggest as a potential location to intervene? What kind of
intervention access is possible in the real world setting, and what informational constraints
does it come with? We can use these questions to guide the kind of intervention we develop.
Now, suppose we have an intervention that solves the desired problem.
We must
now critically engage with the proposed intervention.
What properties does it have?
What are the benefits, drawbacks? Are there ethical concerns with implementing such an
intervention in the real world?
Finally, we can consider practical evaluations. These can comprise experiments on
synthetic data or real world data.
If we are ambitious, we might even consider real-
world experiments. Our essay, however, is focused on theoretical models, and so we leave
details of this important stage to experts in designing and running experiments for social
problems.
5.2

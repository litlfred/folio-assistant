---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-017-case-study-with-security-policies
section_title: "Case study: with Security Policies"
section_number: null
pages: 15-16
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
In this section we consider the security policies that are expressible with CaMeL. We showed an
example of a calendar policy in Figure 6 earlier. Figure 10 shows the triggering rates for all of the
evaluations according to the policies outlined in Appendix E.
Gemini 2.5 Pro
Claude 4 Sonnet*
o3 High
0.0
0.2
0.4
0.6
0.8
1.0
Policy Triggering Rate
workspace
banking
slack
travel
(a) Benign evaluation
Gemini 2.5 Pro
Claude 4 Sonnet*
o3 High
0.0
0.2
0.4
0.6
0.8
1.0
Policy Triggering Rate
workspace
travel
banking
slack
(b) Adversarial evaluation
Figure 10 | When unified authentication is in place, security policies are triggered less often. This
figure shows how often security policies are triggered during the benign and adversarial evaluations
with CaMeL enabled. The x-axis shows the different models that were evaluated on AgentDojo’s
suites, and the y-axis shows the percentage of tasks for which the security policies were triggered.
The proportions are reported only over the successfully solved tasks; the workspace suite, where
users are identified by their email address, has more granular security policies which get triggered
less often. Figure 20 reports the same for all tasks.
Wait, why isn’t attack performance zero now? While we find that CaMeL stops almost all of the
attacks, we find that the number of successful attacks is not zero. The injection task that is successful
in the travel suite is the same as the one mentioned in Section 6.2.1. While this attack (which is not
15
Defeating Prompt Injections by Design
due to a prompt injection) can’t be prevented by our design, the fine-grained annotations maintained
by the CaMeL interpreter can be used to highlight in the user interface that the piece of text comes
from an untrusted source. In particular, this is useful in prompt injection attacks that aim to phish
the user, e.g., by impersonating someone urging the user to click on a link. This attack, as we note in
Section 3.1, is a non-goal for CaMeL.
How often do security policies get triggered? We show in Figure 10 for how many tasks security
policies deny tool execution, i.e., how often users are asked for explicit consent before executing a
given tool. We can see that, for the workspace suite, security policies deny tool execution a relatively
small amount of times. This is thanks to the fact that the tool outputs in the workspace suite can be
easily annotated (e.g., the set of people who can read the content of an email are the recipients of the
email), and this allows for more granular security policies. Differently, in the Slack suite, policies
deny execution much more often. This is because in the suite it is unclear from the suite specification
what the user’s account is (as opposed to the workspace suite), and because in many tasks data come
from web pages (which are untrusted). The denial rate is also higher on the banking suite. This is
because the security policy for the send_money tool is very strict and requires the recipient and the
amounts of the payment to have the user as a source, as well as no other untrusted parent source
in the dependency graph. Finally, the results for the travel suite are not particularly significant as
models have low utility when running this suite, for the reasons explained above.

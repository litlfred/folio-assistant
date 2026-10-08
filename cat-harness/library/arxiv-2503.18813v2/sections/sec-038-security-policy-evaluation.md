---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-038-security-policy-evaluation
section_title: "Security Policy evaluation"
section_number: null
pages: 36-38
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
For the policy evaluation we use the following policies:
• Banking
– send money policy: if the recipient comes from user, then we allow, otherwise, recipient
must be able to read all components of the transaction.
– schedule transaction policy: Only difference from send money is the possibility to make this
recurrent, which is not a problem.
– update scheduled transaction policy: Only difference from send money is the transaction id,
which is not revealed to the transaction recipient anyways.
– update password policy: Accept only if password comes from trusted source. Nobody can
read the output of this.
– update user info policy: Here no data is revealed, so we are not concerned with that, but
we want the data to come from the user.
• Slack
– send direct message policy: Message should be readable by the recipient (or recipient must
come from user).
– send channel message policy: Message should be readable by the channel members.
– post webpage policy: Only allow if content and url are public.
– get webpage policy: Only allow if url is public.
• Travel
36
Defeating Prompt Injections by Design
– send email policy: Recipients must come from the user, email body, subject and attachments
must be readable by all recipients.
– create calendar event policy: Title, description, location, start_time, end_time should be
readable by the participants or all participants should come from user.
– cancel calendar event policy: The event_id should come from an email that was requested
by the user directly.
• Workspace
– send email policy: recipients must come from the user, email body, subject and attachments
must be readable by all recipients.
– delete email policy: The email_id should come from an email that was requested by the
user directly.
– create calendar event policy: Title, description, location, start_time, end_time should be
readable by the participants or all participants should come from user.
– cancel calendar event policy: The event_id should come from the user (or from content
coming from the user).
– reschedule calendar event policy: New start and end times should be readable by the event
participants.
– add calendar event participants policy: Participants should be specified by the user, or event
data must be public.
– create file policy: This does have side-effects, but this function only makes the content
accessible to the user. The model needs to call share_file to make this data visible to ther
users.
– delete file policy: The file_id should come directly from the user.
– share file policy: Email to share to must come directly from the user.
– append to file policy: Can’t write on the file data that are not shared with the people with
access to the file.
The full policies can be found with the code release at https://github.com/google-research/
camel-prompt-injection/tree/45b656a0aaf688626955b12823ec0bd6af9f7df7/src/camel/
pipeline_elements/security_policies.
37
Defeating Prompt Injections by Design
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
Figure 20 | This figure shows how often security policies are triggered during the benign and adversarial
evaluations with CaMeL enabled. The x-axis shows the different models that were evaluated, and the
y-axis shows the percentage of tasks for which the security policies were triggered. The proportions
are reported for all tasks.

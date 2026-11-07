---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-17
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Algorithmic Approaches to
Sequential Decision-Making and
Social Epistemology
by
Kavya Ravichandran
A thesis submitted in partial fulfillment
of the requirements for the degree of
Doctor of Philosophy in Computer Science
at the
Toyota Technological Institute at Chicago
Chicago, IL
August 2026
The dissertation is approved by the following members of the committee:
Avrim Blum (Thesis Advisor)
TTIC
Madhur Tulsiani
TTIC
Alexander Williams Tolbert
Emory University
arXiv:2607.20636v1  [cs.DS]  22 Jul 2026
ii
Algorithmic Approaches to Sequential Decision-Making and
Social Epistemology
Kavya Ravichandran
Abstract
As humans, we face many decisions that require us to choose between sticking to something
and giving up. This thesis uses algorithmic tools to derive insights about such decision-
making problems in theoretical models, studying both near-optimal methods and outcomes
of social and behavioral influences. Along the way, this thesis sheds light on what we gain
and what we lose as we move from a messy and complex real world setting to a very
general abstract model by studying various points along this spectrum.
In Part I, we study algorithms for sequential decision-making in the improving multi-
armed bandits problem.
We provide nearly matching upper and lower bounds in the
general case. Then, we then ask what is possible if we have access to similar instances to
the one we wish to deploy our algorithm on. To that end, we provide guarantees in the
data-driven algorithm design framework, showing that a polynomial number of samples is
sufficient for learning good algorithms from a class of algorithms.
In Part II, we study algorithmic approaches for problems in social epistemology. We
start by analyzing what role theoretical models can play in the study of social problems.
We then study social and behavioral influences in decision-making requiring investment.
First, we provide mathematical formalism in which to study the formation of pessimism
traps, a phenomenon identified by philosophers in which agents are influenced by their
predecessors to engage in less-ambitious goals. We develop financial interventions to sus-
tainably shift communities out of these traps. The second problem we study is the in-
fluence of grit as a behavioral trait in ambitious decision-making. Overall, these works
seek to theoretically model phenomena in social epistemology and provide a framework
for intervening algorithmically.
iii
To the women who came before me, who cleared the way and paved the path.
iv
Acknowledgments
If it were not for the customary template for thesis acknowledgments, I would have a
hard time knowing where to start with the present expression of gratitude. Many people
have contributed significantly to my PhD journey, some directly during the PhD and some
much earlier in my life by setting me along this path.
I am lucky to have had weekly access to Avrim’s infinite wisdom, creativity, and
problem-solving prowess. In the early years, I would bring vague ideas and connections
to Avrim, which he let me believe were creative and useful while he steered us toward
actionable research ideas. I quickly realized that I should be paying attention to how
exactly he went about that, and watching Avrim in action turned out to be one of the
greatest treats of the PhD. Avrim helped me build both research skills and confidence
through his thoughtful mentoring style. Outside of research, Avrim’s wisdom and advice
has provided me with a lot of perspective on academic life, and the way he carries himself
as a leader – humble and quick to help – sets the standard for the rest of us. I couldn’t
have hoped for a better advisor for my PhD. I will call my academic career a success if I
can be a fraction of the researcher and academic that Avrim is. Thank you, Avrim.
Madhur Tulsiani’s wisdom is matched by his cheery demeanor. Through working with
him as a TA, I had the privilege of seeing his thinking in action, and I learnt a lot about
how to put building blocks together to reach mathematical truths. Madhur’s kindness
and support, though always present, were especially appreciated at times during the PhD
when I really needed it. I have benefitted greatly from his advice on everything from
coursework to burnout to advising students. Thank you, Madhur.
I will never be as well-read as Alex Tolbert but by working with him I both pick
up insights from his vast knowledge and am inspired to read more. When I started my
PhD, I fully anticipated that I would have to relegate my interest in the social sciences to
something I do in my personal time, but thanks to working with Alex, I have been able
to incorporate that interest in a meaningful way toward my research work. I am regularly
stunned by how our wide-ranging conversations still culminate at research ideas, and I
know that I will learn something new each time I pick up a call from Alex. Thank you,
Alex, for opening my research trajectory in such a significant way.
Ronitt Rubinfeld has been a source of tremendous inspiration and support since I took
her sublinear algorithms class in 2019. Ronitt’s insistence on conceptual clarity alongside
technical rigor shaped my thinking.
Moreover, her kindness and encouragement have
buoyed me at many tough points in the PhD. When I faced self-doubt, I often replayed to
myself the encouraging things she’d said to me, and it kept me going. Thank you, Ronitt.
I’m grateful that Nati Srebro shared his incisive thinking and research taste during
the Machine Learning and Optimization reading group sessions. These meetings and the
v
hours of preparation that went into each one taught me how to read papers critically
and understand what a paper claims to be saying vs is really saying. Through this, I
learned also how to approach research problems by first understanding what the most
basic approach achieves and using that to identify difficulties in the problem. Thank you,
Nati.
Emily Diana has repeatedly created opportunities for me and supported me through
them. I am grateful that we started working together during her year at TTIC; collab-
orating with Emily invited me into doing significantly interdisciplinary research, which
has been really fruitful for me. I also really appreciate all her wisdom throughout the job
search and decision-making. Thank you, Emily.
Maryam Aliakbarpour guided me through my first theory project and proceeded to
become a close mentor and friend. Maryam taught me a lot about how to approach theory
research and how to turn ideas into math; she has also been a source of wisdom and support
through the emotional journey of the PhD. I am grateful to have a mentor with whom I
can be so open. Our relationship has taught me a crucial lesson about academia: I will
never be able to repay Maryam for the positive influence she has had in my life, so all I
can hope to do is pay it forward. Thank you, Maryam.
Zooming out, faculty at both TTIC and MIT have provided me with a lot of advice
that has brought me to where I am today and will, I am sure, prove extremely valuable for
years to come. I am grateful to Julia Chuzhoy, Zhiyuan Li, Shiry Ginosar, Karen Livescu,
Yury Makarychev, and Matthew Turk for interesting classes and valuable advice over the
years. Several faculty in that list have been quite candid with me in matters of balancing
career and personal life, and I am thankful for their perspectives. I am especially grateful
to Greg Shakhnarovich and Matt Walter for their generosity with helping me prepare for
interviews during this job market season. Going back further, my academic journey was
significantly shaped by many faculty I interacted with in undergrad. An incomplete list:
Kai von Fintel, Stefanie Jegelka, Aleskander Madry, Piotr Indyk, Sasha Rakhlin, Anant
Madabhushi, George Verghese, Peter Hagelstein, Jacob White, Leslie Kaelbling, Duane
Boning, Raul Radovitsky.
My research journey actually started all the way back in high school. It was then that
I decided I wanted to do a PhD. Thank you to Mrs. Patty Hunt and Dr. Crystal Miller,
as directors of SREP, for finding me amazing opportunities and teaching me so much
about structuring research, communicating science, and professionalism. Thank you to
Dr. Anirban Sengupta and Dr. Christa Pawlowski for the chance to learn from you –
while I ended up in a field that is quite far away from biomaterials, I still use many skills
you taught and modeled for me: breaking down problems, designing complex solutions,
and reviewing literature, as well as technical writing and perseverance.
I had a great time collaborating with many people from many places during my PhD.
Thank you to my coauthors: Maryam Aliakbarpour, Amartya Shankha Biswas, Avrim
Blum, Yatin Dandi, Emily Diana, Marten Garicano, Stefani Karp, Francesca Mignacco,
Ronitt Rubinfeld, Dravyansh Sharma, Mor Shpigel-Nacson, Daniel Soudry, Nati Srebro,
Alex Tolbert. I also learnt a lot from reading papers, discussing research, and working on
problems with: Sam Buchanan, Surbhi Goel, Anmol Kabra, Gene Li, Sepideh Mahabadi,
Theodore Misiakiewicz, Saeed Sharifi-Malvajerdi, Jiawei Zhou.
In addition to direct collaborators, I have been lucky to interface regularly with many
academic communities. I am always energized by hearing ideas, results, perspectives, and
vi
more from people around the world. Some communities I’d especially like to acknowledge:
the Les Houches Summer School in July 2022, the NSF-Simons collaboration on Math-
ematical and Scientific Foundations of Deep Learning, the Simons collaboration on the
Theory of Algorithmic Fairness, ALT, FORC, and more.
TTIC has been an incredible place to do a PhD. I am constantly inspired by curiosity
and rigor with which every researcher here approaches research. This trait often visible at
seminars, with people asking thoughtful questions throughout the talk. The environment
is also extremely collegial and friendly. I always looked forward to coming into the office
and learning something new, whether from class, lunch discussions, or pure gossip.
I
am grateful for the camaraderie and friendship of: Saba Ahmadi, Idan Attias, Dimitar
Chakarov (incl deep chats about how to approach grad school), Lee Cohen, Xiaodan Du,
Melissa Dutz, Mahdi Haghifam, Nirmit Joshi (incl discussions about what constitutes
good / useful research), Jiahao Li, Omar Montasser (incl the guidance in the early years
of my PhD!), Olga Medrano, Marko Medvedev, Kanishka Mishra, Amin Mohamadi, Ron
Mozenson, Keziah Nagitta, Abhijit Mudigonda, Rachit Nimavat, Ankita Pasad (incl our
virtual roommate year!), Adela de Pavia, Donya Saless (incl conferences all over!), Omshi
Samal (incl our unrealized intentions to hit up a bakery!), Han Shao (incl job market
advice and gossip!), Vaidehi Srinivas, Shashank Srivastava, Kevin Stangl (incl coffee and
stationary discussions!), Kaylene Stocking, Ali Vakilian, Santhoshini Velusamy (how cool
to connect again in this phase!), Lingxiao Wang, David Yunis. Special shoutout to the
best officemates – Haochen Wang and Ju-Chieh Chou. You guys have been a constant
positive force; I will miss our chats about PhD / research life and learning distilled insights
about applied machine learning from you! And I would be remiss to not appreciate the
delicious water in the 4th and 5th floor kitchens which motivated me to come to the office
in a more significant way than one might think (and the coffee was not too bad, either).
I’m lucky to have gotten to know the TTIC staff through pandemic book club, vari-
ous internal committees, and all the wonderful community events they put on, including
karaoke, summer trips, tea times, and defense celebrations. Thank you to Mary Marre for
all the delicious food, fun conversations, and enthusiasm about holidays and celebrations.
Thank you to Brandie Jones for infinite support and being a friend on campus. Thank
you to Rose Bradford for your energy and passion – I had such a wonderful time working
on outreach activities with you and am inspired by your approach to improving the world
around us. Thank you to Randy Landsberg for listening to many versions of my talks and
giving me extremely helpful feedback. And thank you to Jessica Jacobson, Chrissy Cole-
man, Adam Bohlander, Erica Cocom, Celeste Ki, Deree Kobets, Alicia McClarin-DeMuro,
and Amy Minick for everything you do to make TTIC such a wonderful workplace.
My friends have made this journey a memorable and incredibly fun one. I moved to
Chicago in 2021 having sort of made virtual friends through zoom, gather.town, and FB
messenger with some folks at TTIC and UChicago. Whatever trepidation I had about
whether these friendships would hold up “in the real-world” went away quickly1. We have
spent long nights in West Loop Jeni’s, racked up tens of decibels in hearty laughter, and
gone on adventures in both Chicago and places we visit for conferences and weddings.
Naren, you are always up for an adventure and your energy ensured that alongside work,
1though I must admit it took some time to get used to the fact that these faces on a screen now had
height.
vii
we also did fun random things together. Kshitij, I learn so much from every conversation
with you, whether about research, food, or inane topics, and I admire how carefully you
think about each thing that enters your field of view. Anmol, the years we spent together
in Chicago were filled with ups and downs, and having you to commiserate with and
laugh with made a world of difference. Gene, your taste in memes is truly unparalleled,
something I could not have anticipated when you were the responsible, serious counselor
in charge of my group at Presidential Scholars 2016. Max, what a privilege it has been
to start and finish this journey together. I am grateful for our exploration of Chicago’s
neighborhoods, the Lula Cafe brunches, walks, and always having you to check in with.
Owen, I’m always amazed by how organized you are, and I’m inspired by your commitment
to community; I hope to emulate both. Sue, our regular lunchtime conversations give me
a lot of perspective on what’s important in life and research. Sudarshan, onnuda kathaigal
ku vara siruppu vera kathaigal ku varave varadhu. Pushkar, your groundedness inspires
me, and I enjoy sharing recipes and ideas based on our shared love for food! Tushant, our
conversations on why we want to be in academia always leave me more committed to the
cause, and I must, of course, thank you for the post-interview sambar rice! Naomi, what
a blessing to have shared not only these years in Chicago but also the majority of our
lives so far. Thank you for being a steadfast friend. Simran, I will never get over miracle
that landed you in Chicago after I started my PhD. Your work ethic inspires me and your
support buoys me. I am forever grateful that we have each other as we navigate various
life experiences, both personal and professional. Sarbari, our conversations are equal parts
profound and silly, and I always feel happier and more confident after them. Sushruth,
our discussions on math, probability, economics, and philosophy have been so formative
for me, both before and during the PhD.
My friends in PhD programs outside of TTIC provided much-needed perspective:
Samyu, though our distance has precluded continuing the shenanigans of our youth, I
am so grateful that we can lean on each other during these phases of life and hopefully
many more to come. Josephine, our conversations often land us up talking about the role
that theory plays in our respective fields, or what growth and achievement has looked
like over the years, or one of a myriad of other topics. I am grateful to have in you a
close friend, an ardent supporter, and a role model. Rohan, I feel lucky that we’ve been
able to compare notes on our PhD journeys, and each time we talk, I am struck by your
thoughtful approach to life.
A number of additional shoutouts: Emma, Katie, Ahona, Prabhav, Jean-Luc, Ying,
Yamin (who was in Chicago for both my thesis proposal and defense – incredible and
thank you!), Nalini, Kevin, Tam, Sohil, Gabe, Rene, Karunya, Agni, Haripriya, Aditi,
Stuti, Vivek.
During the pandemic period, a group of us had a weekly Advaita reading group. The
lessons I learnt from the texts and from our discussions have made me a better person
and more equipped to handle the ups and downs of life. The group being enriched with
PhDs (and theorists, in fact!) made the lessons from the texts all the more relevant to
my daily life. Thank you to Srini, Dheeraj, Suhas, and Aniruddh for engaging with me in
this valuable foray.
My curiosity and enthusiasm for learning has been consistently fostered by incredible
educators throughout my life. Looking back, I can recognize how each time I asked one
too many question or got distracted in class, a teacher made an intentional choice to give
viii
me an extra math problem or challenge me to learn a new word, nurturing my desire for
academic challenge. I hope to emulate the standard they have set in my own teaching.
I could never manage to capture verbally the impact they’ve had on my life, so for now,
my heartfelt thank you to this (highly incomplete) list of former teachers: Mrs. Nirmala
Bala, Mrs. Helene Debelak, Mr. Charles Debelak, Mrs. Lorraine Tzeng, Mrs. Connie
Miller, Ms. Linda Brown, Mrs. Geetha Vasanth, Mr. William Adler, Ms. Patty Hunt,
Mr. Kevin Purpura, Ms. Mary Kay Osredkar, Mr. Jason Habig, and many others.
To have found myself in these rich educational settings was not simply a stroke of luck
(though there was some of that, too). It was due to intention and action from the part of
my family, who have obviously made too big an impact on my life for me to adequately
express my gratitude in this one paragraph. My first educational environment, inside the
walls of our home, was filled with books, answers to endless “but why?”s, and times tables.
I cannot overstate the value of the culture of curiosity that my parents cultivated, and they
and my extended family matched that with searching for excellent schools and educational
opportunities for us. Thank you, Amma, for everything, but especially for being my first
math teacher, for setting a bar I’ll never clear in terms of being an all-around superwoman,
for picking every phone call no matter the time or circumstance, and for being not just
my mother but also a treasured mentor and friend. Thank you, Appa, for everything,
but especially for using those hours driving me to school teaching me about information
theory and machine learning, for demonstrating to me the value of intellectual courage
and the relentless pursuit of truth, for your attempts2 in making puns, and for giving me
the advice to keep writing my thoughts down while doing research. Shruthi, thanks for
being my built-in best friend, for the shenanigans and memes, and for the wisdom and
reminding me to not sweat the small stuff. It’s been especially cool this year to be on
opposite ends of the PhD journey, and I am so excited to see everything you accomplish in
yours! A special thank you to Thatha for the stories, wisdom, and constant blessings, and
for carrying forward Ammamma’s spirit in her absence. For my part, I strive to model
her curiosity and care for every person with whom she crossed paths. Halfway through
my PhD, I gained a second family. Thank you to Harini Amma and Raghu Appa for your
love and consistent checkins and good wishes. Thank you to Maithra and Arun for being
the original source of grad school wisdom.
Needless to say, this brings me to the customary final thank you – to Aniruddh, thank
you for always being so supportive in every way, big and small, for constantly working
together to build a life that suits us both, for racing3 me to share the memes from ML
twitter, for going through the PhD first so I could apply lessons from yours to mine, and
for making each day that much more joyful. Thanks for being with me on this crazy
journey not just of PhD but of life.
And if you have made it this far, thank you, reader, for your engagement with my
exercise in gratitude. Please take one more moment and tell someone how much they
mean to you.
2and fine, I’ll admit, successes
3and usually beating
ix
Contents
1
Introduction
1
1.1
Unifying Framework . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
2
1.2
Outline of Thesis . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3
1.2.1
Part I: Improving Multi-Armed Bandits . . . . . . . . . . . . . . . .
3
1.2.2
Part II: Social Epistemology . . . . . . . . . . . . . . . . . . . . . . .
4
1.2.3
Bibliographic Notes
. . . . . . . . . . . . . . . . . . . . . . . . . . .
5
1.3
Takeaways . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
5
I
Improving Multi-Armed Bandits
7
2
Setting and Preliminaries
8
2.1
Improving Multi-Armed Bandit Setting
. . . . . . . . . . . . . . . . . . . .
8
2.2
Formal Preliminaries . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
9
2.2.1
External and Policy Regret, Adversary Model . . . . . . . . . . . . .
9
2.2.2
Optimality and Competitive Ratio . . . . . . . . . . . . . . . . . . .
11
2.2.3
Diminishing Returns . . . . . . . . . . . . . . . . . . . . . . . . . . .
12
2.3
Related Work . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
13
3
Nearly-Tight Approximation Guarantees in the Worst Case
15
3.1
Worst-Case Setting . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
15
3.2
Lower Bound . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
16
3.3
Upper Bound . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
17
3.4
Removing Assumptions
. . . . . . . . . . . . . . . . . . . . . . . . . . . . .
21
3.4.1
Computing Range for a Fixed Arm . . . . . . . . . . . . . . . . . . .
22
3.4.2
Upper and Lower Bounds on Final Value of Best Arm From Explo-
ration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
22
3.4.3
Reward Approximation Guarantee With Learned Parameter . . . . .
23
3.4.4
Removing Dependence on Having To Know T . . . . . . . . . . . . .
24
3.5
Conclusion
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
25
4
Beyond Worst-Case: Data-Driven Algorithm Design
26
4.1
Data-Driven Algorithm Design Setting . . . . . . . . . . . . . . . . . . . . .
26
4.1.1
Our Contributions . . . . . . . . . . . . . . . . . . . . . . . . . . . .
28
4.2
Data-Driven Algorithm Design Perspective
. . . . . . . . . . . . . . . . . .
29
4.3
Using Strength of Concavity
. . . . . . . . . . . . . . . . . . . . . . . . . .
30
x
4.3.1
Algorithm Family
. . . . . . . . . . . . . . . . . . . . . . . . . . . .
31
4.3.2
Sharper Competitive Ratio
. . . . . . . . . . . . . . . . . . . . . . .
31
4.3.3
Sample Complexity of Learning the Curvature Parameter . . . . . .
34
4.3.4
Empirical Evaluation . . . . . . . . . . . . . . . . . . . . . . . . . . .
36
4.4
Achieving Best-of-both-worlds Best Arm Identification . . . . . . . . . . . .
37
4.4.1
Hybrid Algorithm Family . . . . . . . . . . . . . . . . . . . . . . . .
39
4.4.2
Best-of-Both-Worlds BAI guarantees . . . . . . . . . . . . . . . . . .
39
4.4.3
Sample Complexity for Tuning Curvature and Switch Parameters . .
41
4.5
Conclusion
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
42
II
Social Epistemology
44
5
Why Algorithmic Approaches?
45
5.1
On The Use of Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
45
5.1.1
Introduction
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
45
5.1.2
Taxonomy of TCS-based Social Models
. . . . . . . . . . . . . . . .
47
5.1.3
Reproduce Phenomenon . . . . . . . . . . . . . . . . . . . . . . . . .
49
5.1.4
Explain Phenomenon
. . . . . . . . . . . . . . . . . . . . . . . . . .
51
5.1.5
Suggest Intervention . . . . . . . . . . . . . . . . . . . . . . . . . . .
55
5.1.6
What Models Can and Cannot Do . . . . . . . . . . . . . . . . . . .
57
5.1.7
On Process . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
59
5.2
Modeling Ambition . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
60
6
Pessimism Traps and Algorithmic Interventions
62
6.1
Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
62
6.1.1
Our Contributions . . . . . . . . . . . . . . . . . . . . . . . . . . . .
63
6.1.2
Related Work . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
64
6.2
Preliminaries and Basic Model
. . . . . . . . . . . . . . . . . . . . . . . . .
65
6.2.1
Single Sequence Model . . . . . . . . . . . . . . . . . . . . . . . . . .
65
6.2.2
On Our Modeling Choices . . . . . . . . . . . . . . . . . . . . . . . .
67
6.3
Time-Varying Subsidy . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
68
6.4
Extension to multiple groups
. . . . . . . . . . . . . . . . . . . . . . . . . .
70
6.4.1
Formally Defining The Setting
. . . . . . . . . . . . . . . . . . . . .
71
6.4.2
Main Result . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
71
6.5
Experiments . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
73
6.5.1
Data Generation and Procedure
. . . . . . . . . . . . . . . . . . . .
73
6.5.2
Results
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
73
6.5.3
Discussion and Implications . . . . . . . . . . . . . . . . . . . . . . .
75
6.6
Discussion and Conclusion . . . . . . . . . . . . . . . . . . . . . . . . . . . .
76
7
A Theoretical Model for Grit
77
7.1
Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
77
7.1.1
Our Approach To Studying Grit
. . . . . . . . . . . . . . . . . . . .
78
7.1.2
Our Contributions . . . . . . . . . . . . . . . . . . . . . . . . . . . .
79
7.1.3
Related Work . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
79
xi
7.2
Formal Setting: Improving MAB . . . . . . . . . . . . . . . . . . . . . . . .
80
7.3
Rationality in Terms of Competitive Ratio . . . . . . . . . . . . . . . . . . .
81
7.3.1
Rationality in This Model . . . . . . . . . . . . . . . . . . . . . . . .
81
7.3.2
Modelling Grit: Optimism . . . . . . . . . . . . . . . . . . . . . . . .
82
7.3.3
Modelling Grit: Discomfort Tolerance . . . . . . . . . . . . . . . . .
85
7.4
Financial Support
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
87
7.4.1
No Safety Net . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
87
7.4.2
Free Reimbursement . . . . . . . . . . . . . . . . . . . . . . . . . . .
87
7.4.3
Which Wins? Trust Fund or Grit? . . . . . . . . . . . . . . . . . . .
88
7.5
Rationality as Being Bayesian . . . . . . . . . . . . . . . . . . . . . . . . . .
89
7.5.1
Rationality in This Model . . . . . . . . . . . . . . . . . . . . . . . .
89
7.5.2
Setting
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
89
7.5.3
Results for Modelling Grit as Uncertainty Tolerance . . . . . . . . .
90
7.6
Discussion of Modelling Choices . . . . . . . . . . . . . . . . . . . . . . . . .
91
7.7
Conclusion
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
92
7.8
Discussion in Relation to Pessimsim Traps . . . . . . . . . . . . . . . . . . .
92
III
Reflections and Conclusion
94
8
Conclusion
95
8.1
Interplay between sequential and social decision-making . . . . . . . . . . .
95
8.2
General vs Specific . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
96
8.3
Open Problems and Future Directions . . . . . . . . . . . . . . . . . . . . .
97
8.3.1
Concrete Technical Questions . . . . . . . . . . . . . . . . . . . . . .
97
8.3.2
Broad Future Directions . . . . . . . . . . . . . . . . . . . . . . . . .
97
8.4
Parting Thoughts . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
98
A Appendices for Improving Multi-Armed Bandits
109
A.1 Proof of Lemma 3.4.4
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 109
A.2 Maximum Reward Objective
. . . . . . . . . . . . . . . . . . . . . . . . . . 110
A.2.1
Lower Bound . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 110
A.2.2
Upper Bound . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 110
A.3 Extension to noisy rewards
. . . . . . . . . . . . . . . . . . . . . . . . . . . 111
A.3.1
Extension of Algorithm 1
. . . . . . . . . . . . . . . . . . . . . . . . 111
A.3.2
Extension of Algorithm 2
. . . . . . . . . . . . . . . . . . . . . . . . 113
B Appendices for Algorithm Design for Improving Multi-Armed Bandits 114
B.1
Additional Related Work
. . . . . . . . . . . . . . . . . . . . . . . . . . . . 114
B.2
Full Proofs for Sharper Competitive Ratio . . . . . . . . . . . . . . . . . . . 115
B.2.1
Upper Bound . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
B.2.2
Lower Bound . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
B.2.3
Doubling Trick for Unknown T . . . . . . . . . . . . . . . . . . . . . 123
B.3
Details for Sample Complexity Analysis . . . . . . . . . . . . . . . . . . . . 124
B.3.1
Results from Prior Work . . . . . . . . . . . . . . . . . . . . . . . . . 125
B.3.2
Uniform Convergence Implies Population Loss Near-Optimality . . . 125
xii
B.3.3
Average Regret . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
B.3.4
Computational Complexity of ERM
. . . . . . . . . . . . . . . . . . 126
B.3.5
An Algorithm for Finding a Suitable Value of the Parameter
. . . . 129
B.3.6
Full Empirical Evaluation . . . . . . . . . . . . . . . . . . . . . . . . 132
B.4
Best-of-both-worlds for Maximizing Cumulative Reward . . . . . . . . . . . 135
B.4.1
Motivating Examples . . . . . . . . . . . . . . . . . . . . . . . . . . . 135
B.4.2
Data-driven Hybrid Approach . . . . . . . . . . . . . . . . . . . . . . 136
B.5
BAI Comparison with Prior Work and Proof Details . . . . . . . . . . . . . 137
B.5.1
Comparison With Prior Work . . . . . . . . . . . . . . . . . . . . . . 137
B.5.2
Difficulty in Corralling Improving Bandit Algorithms . . . . . . . . . 138
B.5.3
Proofs for results in Section 4.4.2 . . . . . . . . . . . . . . . . . . . . 141
B.5.4
Proof of Lemma 4.4.2
. . . . . . . . . . . . . . . . . . . . . . . . . . 142
B.5.5
Cumulative Reward Best Arm Identification . . . . . . . . . . . . . . 142
B.5.6
Best-of-Both-Worlds Best arm identification guarantees . . . . . . . 143
C Appendices for Pessimism Traps
147
C.1
Key features of pessimism traps . . . . . . . . . . . . . . . . . . . . . . . . . 147
C.2
Related Works
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 147
C.3
Proof for Posterior Update (Eqn. 6.1)
. . . . . . . . . . . . . . . . . . . . . 149
C.4
Formulation as a Random Walk . . . . . . . . . . . . . . . . . . . . . . . . . 149
C.5
Time-Varying Subsidy Proofs . . . . . . . . . . . . . . . . . . . . . . . . . . 152
C.5.1
Proof of Theorem 6.3.1
. . . . . . . . . . . . . . . . . . . . . . . . . 152
C.5.2
Proof of Theorem 6.3.2
. . . . . . . . . . . . . . . . . . . . . . . . . 154
C.6
Details for extension to multiple groups
. . . . . . . . . . . . . . . . . . . . 154
C.6.1
Defining The Setting . . . . . . . . . . . . . . . . . . . . . . . . . . . 154
C.6.2
Analyzing the Subsidy Scheme . . . . . . . . . . . . . . . . . . . . . 155
C.7
Extra Experiments . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 160
C.7.1
Proportion Correct Cascades . . . . . . . . . . . . . . . . . . . . . . 160
C.7.2
Subsidy Size
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 160
D Appendices for Grit
163
D.1 Related Work . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 163
D.2 Why This Instance and Not Something Else? . . . . . . . . . . . . . . . . . 164
D.3 Proofs of Results . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 165
D.3.1
Proof of Lemma 7.3.2
. . . . . . . . . . . . . . . . . . . . . . . . . . 165
D.3.2
Proof of Lemma 7.3.3
. . . . . . . . . . . . . . . . . . . . . . . . . . 165
D.3.3
Proof of Lemma 7.3.4
. . . . . . . . . . . . . . . . . . . . . . . . . . 166
D.4 Fixed Time Financial Support . . . . . . . . . . . . . . . . . . . . . . . . . . 166
D.5 Calculations For Interplay of Grit and Trust Fund
. . . . . . . . . . . . . . 167
xiii
List of Figures
4.1
This figure summarizes the framework studied in this chapter. In phase
1 (left), the learning algorithm receives instances sampled iid from some
distribution. It uses its offline access to these instances to select the best
algorithm from a parameterized family of algorithms. This algorithm is the
version with parameter p . In the phase 2 (right), the algorithm with the
value of the parameter set to p is run online on a new instance. Thus, we
can see why we call this framework “offline-to-online transfer.”
. . . . . . .
29
4.2
This figure shows a snapshot of running PTRR with differing αs on the same
instance. In the case where α = 1 , recovering the algorithm of [BR25], we
see that each arm is discarded once it crosses the linear lower bound. Note
that the best arm (purple) is never discarded. On the right, we see the
run of the algorithm when α = 0.5. Here, since the best arm satisfies the
CEE with β = 0.5 , we never discard the best arm. However, we discard
worse arms faster. Thus, we can see the motivation for using PTRRα for
the largest possible α such that we still ensure we do not discard the best
arm. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
32
4.3
Lower bound instances: The spirit of the lower bound instances is that
most arms flatten after T/
√
k pulls but one arm keeps increasing. However,
since the algorithm needs to play any arm for a while before figuring out
whether it is the good arm or one of the regular arms, the expected reward
of the algorithm cannot exceed a certain amount. On the left, we reproduce
the instance for β = 1 , recovering the lower bound instance of [BR25], and
on the right we show instance for β = 0.5 . . . . . . . . . . . . . . . . . . . .
33
xiv
4.4
Sensitivity of PTRRα to α on selected LCDB instances (T = 44,
k = 22). Each curve corresponds to one CC-18 dataset d from LCDB 1.1
and reports the normalized cumulative reward E[PTRRα(d)]/OPT(d) as a
function of α ∈{0.1, 0.2, . . . , 1.0}, where OPT(d) = maxi
PT
t=1 ri,d(t) is
the cumulative reward of the best fixed-arm policy in hindsight under the
same horizon (which is not necessarily the optimal policy due to absence
of monotonicity, but it is a useful proxy.)
and ri,d(t) = 1 −erri,d(t) is
the mean (over cross-validation) reward at anchor t for arm i. For each
(d, α), E[PTRRα(d)] is estimated by averaging over 200 random arm order-
ings. The shaded regions are pointwise 95% Student-t confidence intervals
across the 200 runs (mean ± t0.975,199 · sd/
√
200). The displayed datasets
are selected to illustrate the range of sweep shapes observed across the
full benchmark (near-flat curves, monotone trends, and interior maxima).
For most datasets, performance differences across α are small relative to
the confidence intervals, while a minority show a significant trend across α
on this grid. Complete sweeps over all 27 usable datasets are included in
Appendix B.3.6.
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
36
4.5
Mean LCDB reward curves for three datasets with distinct best α
values on the grid. Each panel overlays the mean reward curves ri,d(t) =
1−erri,d(t) across anchors t for all k = 22 arms on a single CC-18 dataset d.
The title of each panel reports the value of α ∈{0.1, 0.2, . . . , 1.0} that max-
imizes the estimated normalized cumulative reward E[PTRRα(d)]/OPT(d)
at horizon T = 44 on that dataset. We selected these datasets to illus-
trate diverse best α values on the grid. Qualitatively, these plots suggest
a mechanism consistent with the influence of α on PTRRα, where datasets
preferring smaller α tend to exhibit early separation between ‘good’ and
‘bad’ arms (making aggressive abandonment beneficial). . . . . . . . . . . .
37
4.6
Examples demonstrating the need for a best-of-both-worlds approach.
. . .
38
6.1
Impact of Financial Supplement on Finding Correct Cascade with Supple-
ment, 100 agents. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
74
6.2
Probability of Finding Correct Cascade without Supplement . . . . . . . . .
74
6.3
Average Subsidy Progression for 100 Agents
. . . . . . . . . . . . . . . . .
75
7.1
This table shows the reward the agents described in Section 7.3.2 receive
if θ , the true threshold beyond which f2 pays off, lies in different regions.
The columns are increasing in grit from left to right. We can see that if θ is
larger, more grit can actually result in less reward, since the agent switches
back to the stable arm and accrues less reward there. . . . . . . . . . . . . .
84
7.2
Switch point as a function of standard deviation σ for prior of N(25, σ2).
.
91
xv
B.1
Sensitivity of PTRRα to α on all LCDB instances (T = 44, k = 22).
Each curve corresponds to one CC-18 dataset d from LCDB 1.1 and reports
the normalized cumulative reward E[PTRRα(d)]/OPT(d) as a function of
α ∈{0.1, 0.2, . . . , 1.0}, where OPT(d) = maxi
PT
t=1 ri,d(t) is the cumulative
reward of the best fixed-arm policy in hindsight under the same horizon
(which does not necessarily correspond to the global optimal policy due to
the absence of monotonicity) and ri,d(t) = 1 −erri,d(t) is the mean (over
cross-validation) reward at anchor t for arm i. For each (d, α), E[PTRRα(d)]
is estimated by averaging over 200 random arm orderings.
The shaded
regions are pointwise 95% Student-t confidence intervals across the 200 runs
(mean ± t0.975,199 · sd/
√
200). For most datasets, performance differences
across α are small relative to the confidence intervals, while a minority show
a significant trend across α on this grid. . . . . . . . . . . . . . . . . . . . . 134
B.2
Mean LCDB reward curves for three datasets with distinct best α
values on the grid. Each panel overlays the mean reward curves ri,d(t) =
1−erri,d(t) across anchors t for all k = 22 arms on a single CC-18 dataset d.
The title of each panel reports the value of α ∈{0.1, 0.2, . . . , 1.0} that max-
imizes the estimated normalized cumulative reward E[PTRRα(d)]/OPT(d)
at horizon T = 44 on that dataset. We selected these datasets to illustrate
the reward dynamics underlying distinct best α values on the grid.
. . . . 135
C.1
Proportion Correct Cascades for 10 Agents
. . . . . . . . . . . . . . . . . . 161
C.2
Proportion Correct Cascades for 1000 Agents . . . . . . . . . . . . . . . . . 161
C.3
Average Subsidy Progression for 10 Agents
. . . . . . . . . . . . . . . . . . 162
C.4
Average Subsidy Progression for 1000 Agents . . . . . . . . . . . . . . . . . 162
xvi
List of Tables
2.1
This table summarizes results in reward maximization for IMAB (equiva-
lently, rested rising bandits). We collect results for both regret and com-
petitive ratio, as the spirit of both is reward maximization. For brevity, we
omit best arm identification results. All works assume diminishing returns.
The “conditions” column only includes any additional conditions necessary
for the results.
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
14
1
Chapter 1

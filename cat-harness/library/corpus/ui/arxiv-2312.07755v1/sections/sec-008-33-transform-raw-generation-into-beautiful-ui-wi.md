---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-008-33-transform-raw-generation-into-beautiful-ui-wi
section_title: "Transform Raw Generation into Beautiful UI Wireframe"
section_number: 3.3
pages: 9-11
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
After fine-tuning process, we prompt the LLMs with a simple description of design intent to generate a HTML syntax of
mid-fidelity wireframes. However, programming languages like HTML and CSS are not easy for designers to understand.
We wish to hide the programming hardships under-the-hood to reduce the designer’s burden. Besides, the LLMs may
not fully capture the intricacies of the design knowledge behind the UI designs. To this goal, we propose post-processing
methods to transform the raw HTML syntax generation into intuitive, fluent, and interactive UI wireframes. An example
of the post-processing methods is shown in Fig. 5.
3.3.1
Semantic Icons. Different from the buttons with text that explicitly shows the functionalities, the icons fail to
expose the textual semantics. To address this, we add the semantic icons in the wireframe by leveraging the alt text in
the HTML syntax. First, we carry out a small study to understand the icons and their associated text semantics. Based
on the Rico dataset, we extract a large number (73,449) of icons and randomly select 4,000 (5%) as our experimental set.
To identify the set of frequently occurred icon semantics in the wireframe, we perform an iterative open coding of
the experimental set using the existing expert lexicon of categories in books and websites such as Google’s Material
icon set [38] and IBM’s Design Language of Iconography [45]. Two researchers from our team independently code the
9
Feng et al.
Table 2. The 10 most common icon semantics identified through an iterative open coding of Rico.
ICON
ASSOCIATED SEMANTICS
EXAMPLES
return, back, navigate up, previous, backwards, arrow back
menu, navigation drawer, list, card, dashboard
settings, toolbox, gear, preferences, options
more, more options, dots, three, overflow
information, info, help, support, question, ask, faq
person, user, avatar, account, customer, profile
close, quit, logout, exit, switch-off
search, investigate, search-engine, magnifier, find, glass
share, share button, forward, social media
favourite, like, heart, upvote
categories of these icons, recording any part of the initial vocabulary. Note that both researchers have design experience
in UI wireframe design. After the initial coding, the researchers meet and discuss the discrepancies and the set of
new semantic categories until a consensus is reached. A category of top 10 icon semantics can be seen in Table 2. For
example, the ←icon usually expresses the semantic of “return” and the × icon usually expresses the semantic of “close”.
Based on the icon semantic category, we prompt the LLMs to convert the alt-text description in the HTML syntax
into the corresponding icons. In detail, we first provide the LLMs with the context of our icon semantic category with
the prompt, i.e., “Here is an icon semantic category: first icon can be assigned an alternative description of return, back,
navigate up, previous, ...”. Next, we use a prompt to instruct the LLMs to identify each icon image with its alt-text
attribute in the HTML syntax. For instance, in Fig. 5-A, to generate the icon for the alt-text of “more options” at the top
right corner, we prompt the LLMs by “Please indicate the icon number if there is a corresponding icon for the alternative
description of “more options”. If there is no related icon, please respond with no.” In this case, the LLMs returns the “fourth”
icon in the category, which corresponds to the “three-dots” icon as shown in the Fig. 5-A. Note that we do not perform
LLMs fine-tuning for this task, as the icon identification is relatively straightforward, either select a single icon from
the category or indicate no relevant icons.
3.3.2
Text Typography. The typography of text layout is defined as the process of overlaying texts onto the text blocks
in the UI wireframe. However, the process poses potential challenges [11, 80] on text wrapping, text alignment, font size,
etc. We define text wrapping 𝑆= {𝑠1,𝑠2, ...,𝑠𝑛} consists of 2|𝑠|−1 possible wrapping ways on string 𝑠; text alignment
𝐴= {“left”, “center”, “right”} consists of the alignment ways of text in block; 𝐹= {“small”, “medium”, “large”} to
demonstrate the importance of the text and each font has a number of corresponding sizes (i.e., “normal” ∈{10, 11, ...});
𝑤and ℎdenotes the width and height of the text block. To ensure the text typography aligns with human design
principles, we formulate it as an optimization problem that minimizes the waste of spare block space and the mismatch
of information importance in perception and semantics.
𝑜𝑝𝑡𝑖𝑚𝑖𝑧𝑒(s | w, h) = 𝑚𝑎𝑥(𝑆𝑖∗𝐹𝑗
𝑤∗ℎ)
(1)
In detail, we first identify the text font by the class in the HTML syntax, that 𝐹corresponds to the title, normal text, and
subtitle for “small”, “medium”, “large”, respectively. Then, we calculate the area of each combination of text wrapping
10
Wireframing UI Design Intent with Generative Large Language Models
𝑆𝑖and font size 𝐹𝑗. By minimizing the waste of empty space, we calculate the ratio occupied by the text on the text
block and determine the combination with the largest ratio as the optimal text typography. Finally, we use optimized
wrapping text to imply the text alignment (𝑆𝑖⇒𝐴), i.e. text is center-aligned if it is a single line, otherwise, left-aligned.
For example, in Fig. 5-B, the text is generated as the class of “title”, so we highlight the text with “large” font. In Fig. 5-C,
the “subtitle” text is post-processed to “small” font.
3.3.3
UI Guidelines. UI design is not a simple recipe, it is subject to design rules and guidelines to match the psychology
of human perception, that machine may not aware of. To investigate the presence of design flaws in LLMs’ generated
UI wireframes, we conduct a small-scale study on randomly 100 generated UI wireframes. Note that this study just aims
to provide an initial analysis of possible UI design flaws in the generation of LLMs, and a more comprehensive study
would be needed to deeply understand it. Following the Card Sorting [70] method, we summarise three potential flaws
based on existing UI/UX design books and websites such as Design Pattern Gallery [61]. To enhance the wireframes,
we apply tailored heuristics that incorporate human design knowledge:
a) Occlusion: the textual information or element is occluded by other elements. This might be caused by the
improper generation of the element’s width and height. To resolve this, we add a small margin between them without
affecting other elements, as shown in Fig. 5-D.
b) Duplication: the elements are similar in many aspects of properties, such as size, class, position, text, etc. The
possible reason could be that LLMs lack a very long memory [82]. To resolve this, we compare the properties of each
element and empirically set a threshold to determine if they are similar to be removed, for example, the redundant and
overlapped buttons in Fig. 5-E.
c) Out-of-bound: the size of the element exceeds the bounds of the UI. It usually occurs with text elements that
require relatively wide borders. To resolve this, we trim the size of the element, as shown in Fig. 5-F.
4

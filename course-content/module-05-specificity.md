# Module 5: Why Specificity is Everything

**Track**: Foundation
**Estimated reading time**: 8 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain why vague prompts produce generic output
- Apply the "new hire" mental model to every task you give Claude
- Identify the three questions every Claude task needs answered
- Rewrite a weak prompt into a strong one

---

## The Output Reflects the Input

Claude is not holding back. When you give it a vague instruction and get a generic response, Claude is not being lazy — it is doing exactly what you asked, interpreted as broadly as possible.

*"Write an email about our new product"* could mean a hundred different things. Who is the audience? What product? What tone? What is the goal of the email — to inform, to sell, to invite? How long? What should the reader do after reading it?

Claude makes assumptions about all of these, picks the most probable interpretation, and produces the most probable response. The result is competent but generic — because generic is the most probable answer to a vague question.

**Specificity is not about being more demanding. It is about giving Claude enough information to do what you actually want.**

---

## The New Hire Mental Model

This is the most useful frame for prompting:

Imagine you have just hired a brilliant new employee. They are smart, hardworking, and capable of handling almost any task you give them. But they started yesterday. They do not know your company, your clients, your communication style, your history, or what "good" looks like in your context.

Would you send this new hire an email that says *"write something about the new fund"* and expect a polished client-ready document in return?

Of course not. You would brief them:
- Here is the fund and what is notable about it
- Here is the audience — they are institutional allocators with this profile
- Here is the tone — we are direct, not salesy
- Here is what I want them to do after reading it
- Here is an example of a previous communication I was happy with

Claude is that new hire. Every single conversation, it is day one. You are responsible for the brief.

The good news: unlike a real new hire, Claude never gets frustrated by detailed instructions. The more you give it, the better it performs.

---

## The Three Questions Every Prompt Must Answer

Before you send any substantive prompt, ask yourself:

**1. What do I want?**
Be specific about the task. Not *"write something about X"* but *"write a 200-word LinkedIn post about X that makes the key argument that Y."*

**2. Who is it for?**
The audience changes everything. The same information written for a CFO reads completely differently than the same information written for a sales rep. Tell Claude who the reader is, what they care about, and what they already know.

**3. What does good look like?**
This is the most neglected question and the one that creates the biggest quality gap. Give Claude a standard to hit:
- Share an example of previous work you were happy with
- Describe the tone, length, and structure you want
- Tell Claude what you do NOT want (no corporate jargon, no bullet points, no hedging)

When all three questions are answered, the quality difference is dramatic.

---

## A Before and After

**Weak prompt:**
*"Write an email to a prospect about our platform."*

Claude will produce a generic, forgettable email that sounds like every other SaaS sales email.

**Strong prompt:**
*"Write a short email (under 150 words) to a hedge fund COO we met briefly at a conference last week. They expressed interest in how we help alternative investment firms manage their GP database and reporting. The tone should be direct and professional — not salesy. Reference the conference briefly, make one specific point about what our platform does for firms like theirs, and end with a soft ask for a 20-minute call. No bullet points. Here is an example of a previous email we sent that worked well: [paste example]."*

Same task. Completely different output.

---

## Constraints Are Your Friend

Many people think adding constraints limits Claude. The opposite is true. Constraints focus Claude on what you actually want and prevent it from filling space with generic filler.

Useful constraints:
- Length: "under 150 words," "no more than one page," "three bullet points maximum"
- Tone: "direct and confident," "warm but professional," "concise — no hedging"
- Format: "structured as a table," "numbered steps," "no headers, flowing prose only"
- Audience: "written for someone with no finance background," "assumes the reader is a senior allocator"
- Exclusions: "no corporate jargon," "do not include any statistics unless I provided them," "do not use bullet points"

---

## Key Takeaways

1. Generic prompts produce generic output — this is by design, not a limitation
2. Claude is a brilliant new hire who knows nothing about your context — brief it accordingly
3. Every prompt needs: what you want, who it is for, and what good looks like
4. Constraints improve output by focusing Claude on what you actually want
5. Examples of previous good work are the single most powerful thing you can give Claude

---

## Practical Exercise

Take a task you are working on right now or a task you do regularly. Write your usual prompt — the way you would have written it before this course.

Then rewrite it using the three questions:
- What do I want? (Be specific about task, length, format)
- Who is it for? (Audience, their knowledge level, what they care about)
- What does good look like? (Tone, example, constraints, exclusions)

Submit both versions to Claude. Compare the outputs. The difference in quality between the two responses is the direct return on specificity.

---

*Complete the quiz below to proceed to Module 6.*

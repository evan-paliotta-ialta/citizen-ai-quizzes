# Module 7: Iteration, Examples, and Getting to Great

**Track**: Core Skills
**Estimated reading time**: 9 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Treat Claude's first response as a starting point, not a final answer
- Use targeted follow-up prompts to improve specific aspects of an output
- Give Claude examples of what good looks like and explain why this works
- Ask Claude to evaluate its own work

---

## The First Response Is a Draft

The single most common mistake new Claude users make is treating the first response as the final answer.

Experienced users know: the first response is a draft. It is Claude's best guess at what you want based on the information you provided. It is often good. It is rarely great on the first pass. Greatness comes from iteration.

This is not a flaw in the technology. It is the nature of any creative or analytical collaboration. You would not expect a colleague to hand you a perfect document on the first attempt based on a two-sentence brief. You would review it, give feedback, and let them revise. Claude works the same way — except it revises instantly and without frustration.

**The mindset shift**: stop evaluating Claude's first response as a success or failure. Start evaluating it as a starting point and ask: *what specifically would make this better?*

---

## Targeted Follow-Up Prompts

Generic feedback produces generic revisions. Specific feedback produces specific improvements.

**Weak follow-ups:**
- "Make this better"
- "This is not quite right"
- "Try again"

These give Claude nothing to work with. Claude will make changes, but they will be random revisions rather than targeted improvements.

**Strong follow-ups:**
- "The opening is too generic — rewrite it to lead with the specific problem this client faces"
- "The tone is too formal — make it sound more like a conversation and less like a report"
- "This is 400 words, I need it under 150 — cut everything that is not essential to the core argument"
- "The second paragraph buries the key insight — restructure it so the insight leads"
- "Add a brief section at the end that addresses the most likely objection to this proposal"

Each of these tells Claude exactly what is wrong and exactly what to change. The revision will be targeted and useful.

---

## Useful Iteration Patterns

**Expanding**
*"This is a good start but too brief — expand the second section with two more specific examples"*

**Compressing**
*"Too long — cut by 50% without losing the core argument"*

**Shifting Perspective**
*"Now rewrite this from the perspective of a skeptical reader who is looking for reasons to say no"*
*"How would a first-time client read this? What would they be confused by?"*

**Stress-Testing**
*"What are the three strongest arguments against the recommendation you just made?"*
*"What is missing from this analysis that a rigorous reviewer would notice?"*

**Tone Adjustment**
*"More direct — remove the hedging in the first and third paragraphs"*
*"Less formal — this reads like a legal document, not a client email"*

**Format Change**
*"Convert this to a table: column 1 is the action, column 2 is the owner, column 3 is the deadline"*
*"Turn these bullet points into flowing prose"*

---

## Giving Examples: The Highest-Leverage Technique

Telling Claude what you want is good. Showing Claude what you want is better.

Examples are the single most powerful input you can give. When you provide an example of an output you were happy with, Claude does not just note the words — it infers the tone, structure, level of detail, vocabulary choices, and underlying logic.

**How to use examples:**

*"Here is an email we sent to a similar prospect last year that got a strong response: [paste email]. Write a new email to [prospect name] using a similar tone and structure, but updated for [new context]."*

*"Here is a QBR deck introduction that I thought was excellent: [paste]. Write a new introduction for [client name] in the same style."*

*"Here is a version of this document I was not happy with: [paste]. Here is what was wrong with it: it was too jargon-heavy and buried the recommendation. Now write a better version."*

You can show Claude what good looks like. You can show Claude what bad looks like and why. Both are valuable.

---

## Asking Claude to Evaluate Its Own Work

Claude can be both the creator and the critic — if you ask it to be.

After receiving an output, try:
- *"What are the weaknesses in what you just wrote?"*
- *"What would a skeptical reader push back on?"*
- *"What is missing that a thorough analysis would include?"*
- *"Rate this on a scale of 1–10 and explain what would make it a 10"*

This produces genuine, useful critique. Claude will often identify problems it introduced in its own output — hedging that dilutes the argument, a structure that buries the key point, assumptions that were not stated.

Pairing output with self-critique is a fast path to high-quality work. Generate → critique → revise → critique again if needed.

---

## The Iteration Limit

Most good outputs are reached in 2–4 rounds of iteration. If you are on round 7 and still not satisfied, one of two things is true:

1. The original prompt was missing something fundamental — it may be faster to start fresh with a better brief
2. The task requires human judgment that Claude cannot replicate — you need to do this part yourself

Iteration is a tool, not an infinite loop. Know when to start over and when to take the work from here yourself.

---

## Key Takeaways

1. The first response is a draft — evaluate it as a starting point, not a final answer
2. Specific feedback produces specific improvements — tell Claude exactly what to change and why
3. Examples are the most powerful input you can provide — show Claude what good looks like
4. Claude can critique its own work — ask it to identify weaknesses and what would make it better
5. Most tasks reach high quality in 2–4 iterations — if you are past that, reconsider the approach

---

## Practical Exercise

Take any recent Claude output you were unsatisfied with — or generate one now by giving Claude a complex task.

Then run it through this sequence:
1. Ask Claude: *"What are the weaknesses in this output and what would make it a 10/10?"*
2. Review Claude's self-critique. Do you agree?
3. Use one specific follow-up prompt to address the most important weakness
4. Compare the revised output to the original

Notice that the self-critique step often surfaces the most important issues faster than you would have identified them yourself.

---

*Complete the quiz below to proceed to Module 8.*

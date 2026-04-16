# Module 8: Tips, Tricks, and Power User Habits

**Track**: Core Skills
**Estimated reading time**: 8 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Recover context after an interrupted or lost session
- Use persona stacking, negative instructions, and structured output techniques
- Build a habit of saving prompts that work
- Ask Claude what it needs before starting a complex task
- Use meta-prompting to build and improve prompts without starting from scratch
- Apply self-verification, steelmanning, and outcome-first prompting to improve output quality
- Flag uncertain claims so you know exactly what to verify

---

## The Logs / Context Recovery Trick

Sessions get interrupted. Windows close unexpectedly. Long sessions lose context as the window fills.

When you need to recover where you left off:

**Within a conversation:**
*"Please summarize what we have covered in this conversation so far — the context, key decisions, and where we left off."*

This works remarkably well. Claude can reconstruct a clear brief from the conversation history even when the session has been running for a while.

**Starting a new session after an interruption:**
Before closing any important session, ask Claude to produce a handoff brief:
*"Write a concise brief I can paste at the start of a new conversation to resume exactly where we are now. Include the full context, any decisions made, any constraints established, and the next steps."*

Save that brief as a file that lives with the project:

- **Claude Desktop**: paste it into a note in the relevant Project, or save it as a file and upload it to the Project — it will be available in every future conversation there

The brief should live *with the work*, not in a separate note-taking app you have to go find later.

---

## Persona Stacking

You can ask Claude to hold multiple perspectives simultaneously. This is particularly useful for pressure-testing any document, plan, or recommendation.

**Examples:**
- *"Review this proposal as both a skeptical CFO and a first-time client who does not know our product"*
- *"Give me feedback from the perspective of a regulator looking for compliance gaps AND a sales rep who needs to present this to clients"*
- *"Read this as both the writer trying to persuade and the reader looking for reasons not to agree"*

Persona stacking surfaces tensions and blind spots that a single-perspective review would miss. It is especially useful for client-facing documents, internal proposals, and any communication where multiple stakeholders will react differently.

---

## Negative Instructions: Tell Claude What NOT to Do

One of the most underused techniques is telling Claude explicitly what to avoid. Claude has defaults — it will hedge, it will add caveats, it will use certain phrases it has seen frequently in training. You can override all of these.

**Common negative instructions:**
- "Do not start your response with 'Certainly!' or 'Great question!'"
- "Do not use the words 'leverage,' 'synergy,' or 'seamless'"
- "Do not hedge with phrases like 'it is important to note' or 'it is worth mentioning'"
- "Do not add disclaimers unless they are essential"
- "Do not use bullet points — write in prose"
- "Do not include a conclusion section — end after the last point"

These instructions consistently improve output quality. Once you find the ones that matter for your work, add them to your Project instructions so they apply to every conversation.

---

## Ask Claude What It Needs

Before starting a complex task, ask Claude what information would help it do the work better:

*"Before you start, tell me: what information would help you produce the best possible output for this task?"*

Claude will surface the gaps in your brief — the context it is missing, the constraints it would benefit from, the decisions it will have to make without you if you do not specify. This is a fast way to strengthen your prompt without having to guess what is missing.

It also functions as a checkpoint: if Claude's list of questions surprises you, that is a signal the task is more complex than you thought and worth spending more time briefing.

---

## Ask for Options, Not Just Answers

On any task with multiple valid approaches, ask Claude to give you options rather than a single answer:

*"Give me three different approaches to this, each with a brief description of the tradeoff"*
*"Write two versions of this email — one direct and brief, one more detailed and relationship-focused"*
*"Give me five subject line options for this email, ranked by likely open rate, with a one-sentence explanation for each"*

Single answers anchor your thinking. Options create genuine decision points. For anything where the right path is not obvious, options give you more to work with.

---

## Structured Output

Asking for specific output formats makes Claude's responses immediately usable rather than requiring cleanup.

**Useful formats to request:**
- Tables: *"Output this as a table with columns for X, Y, Z"*
- Numbered steps: *"Format this as numbered steps, one action per line"*
- JSON or structured data: *"Output this as JSON with fields for name, status, and due date"*
- Before/after: *"Show me the original text and the revised text side by side"*
- Headers and subheadings: *"Structure this with H2 headers for each section and H3 for subsections"*

If you are going to paste Claude's output into another tool (a spreadsheet, a CRM, a presentation), specifying the format saves you reformatting time downstream.

---

## Meta-Prompting: Let Claude Build the Prompt

Writing a good prompt from scratch is hard. Meta-prompting flips the process: instead of crafting a perfect prompt, you describe what you want in plain language and let Claude structure it for you.

**Brain dump → prompt**

Write everything you know about the task — the goal, the context, the constraints, the audience, what good looks like — in whatever order it comes to you. Then ask Claude to turn it into a well-structured prompt.

*"Here's everything I know about what I need: [brain dump]. Turn this into a well-structured prompt I can reuse. Ask me if anything is missing before you write it."*

This removes the blank-page problem entirely. You think out loud; Claude organises it.

---

**Prompt refinement**

If you have a prompt that mostly works but the output is inconsistent or not quite right, ask Claude to diagnose and rewrite it.

*"Here's a prompt I've been using: [paste prompt]. The outputs are [describe the problem]. What's weak about this prompt and how would you rewrite it?"*

Claude will often spot missing context, ambiguous instructions, or conflicting constraints you did not notice.

---

**Reverse-engineering from great output**

If you got an exceptional output once — from any source — and want to be able to reproduce it consistently, paste the output and ask Claude what prompt would produce it.

*"Here's an output I want to be able to produce reliably: [paste output]. Write a reusable prompt template that would consistently generate outputs like this."*

---

**Prompt from example output**

Similar, but useful when you have an internal example (a piece of writing, a report, a client email) that represents the standard you're aiming for.

*"Here is an example of exactly the kind of output I want: [paste example]. Write a prompt that would reliably produce outputs matching this style, structure, and tone."*

---

## Self-Verify Against Criteria

Most back-and-forth with Claude is caused by the same thing: the output is missing something obvious in hindsight. You can eliminate most of that by having Claude check its own work before you see it.

At the end of any request for important output, add a self-check instruction:

*"Before you finish, verify your response against these criteria: [list]. Flag any criteria not met and fix them."*

**Example:**

*"Draft a renewal email for the Acme account. Before you finish, verify: (1) it references their specific use case, not generic benefits; (2) it has a clear next step with a date; (3) it is under 200 words; (4) it does not use the word 'leverage.' Fix anything that fails."*

Claude will surface and correct its own gaps. This is not Claude being humble — it is Claude doing a second pass with explicit success criteria it did not have the first time. You still review the output, but with far fewer obvious issues remaining.

---

## The Steelman and the Pre-Mortem

Two techniques for pressure-testing any plan, recommendation, or decision.

**The steelman** — ask Claude to make the strongest possible case for a position you are skeptical of, or against your own preferred option.

*"I am planning to [decision]. Make the strongest possible case against this. What would a smart, well-informed opponent say?"*

Not "what are the downsides" (which produces generic caveats) but "make the case" (which produces a real argument). The distinction matters.

**The pre-mortem** — imagine the plan has already failed, then work backwards.

*"Imagine it is 12 months from now and this initiative failed completely. What went wrong? Walk through the most likely failure modes in order of probability."*

Pre-mortems surface problems that prospective analysis misses because they reframe the question from "will this work?" to "how did this fail?" — and humans (and models) are better at explaining failure than predicting it.

Both techniques are most valuable on decisions that feel settled. Use them before, not after, you commit.

---

## Flag What Claude Is Not Sure About

Claude does not naturally signal its own uncertainty. It will state a confident-sounding claim whether it is certain or guessing. You can fix this by asking it to flag uncertain content explicitly.

*"In your response, mark any claim that I should independently verify with [CHECK]. Use it inline, like: 'The renewal rate was 87% [CHECK].' If you are confident in a fact, leave it unmarked."*

This makes verification fast. Instead of treating the whole response with suspicion, you know exactly where to focus. Use it whenever the output contains facts, figures, quotes, or any assertion that will go in front of a client or decision-maker.

A related variation for research tasks:

*"After your response, add a section called 'Verify before using' listing every factual claim I should confirm from a primary source before relying on this."*

---

## Work Backwards From the Reader

Most prompts describe what you want Claude to produce. This technique starts from what you want the reader to think, feel, or do — and asks Claude to work backwards from there.

Instead of: *"Write a follow-up email after the demo."*

Try: *"I need the prospect to feel that we understand their specific problem (not that we are pitching a generic solution), and I need them to agree to a 30-minute call with their CFO. Work backwards from those two outcomes and write the follow-up email."*

The difference is significant. Outcome-first prompts force Claude to think about the communication's job rather than its form. Generic prompts produce generic output because Claude fills in the intent; outcome-first prompts make the intent explicit.

This works for any communication: presentations, proposals, Slack messages, performance reviews. The question to ask yourself before prompting: *"What does the reader need to think, feel, or do after reading this?"* Put that in the prompt.

---

## Saving Prompts That Work

The best prompts take effort to build. Do not let them disappear into conversation history.

When a prompt produces an output you are genuinely pleased with, save the prompt immediately. The right place to save it depends on your setup — but the principle is always the same: prompts belong with the work, not in a disconnected tool.

- **Claude Desktop**: add prompts to an uploaded `prompts.md` file in your Project, or keep a dedicated "Prompt Library" Project with prompts as notes
- **Team sharing**: a GitHub repository is the best home for a shared prompt library — version-controlled, searchable, and anyone can contribute improvements. The program's shared prompt library lives there; add to it whenever you build something reusable

Structure each entry as:

```
Task: [what this prompt is for]
Prompt: [the full prompt text]
Notes: [when to use it, what to adjust for different situations]
```

Over time this becomes a team asset. When a new team member joins, the prompt library is part of their onboarding. When you need to do a task you have done before, you start from a proven prompt rather than from scratch.

---

## Key Takeaways

1. Recover interrupted sessions with a context summary or handoff brief — save it before closing important sessions
2. Persona stacking surfaces tensions a single perspective would miss; negative instructions eliminate Claude's defaults
3. Meta-prompting removes the blank-page problem — brain dump first, let Claude structure the prompt
4. Self-verify against explicit criteria before you review the output; flag uncertain claims with [CHECK]
5. Steelman and pre-mortem your plans before you commit to them
6. Work backwards from what you need the reader to think, feel, or do — not from what you want to produce
7. Save prompts that work — they are team assets, not throwaway inputs

---

## Practical Exercise

This week, try three of the techniques from this module on real tasks:

1. **Meta-prompting**: for your next complex task, do a brain dump first — write everything you know about what you need — and ask Claude to turn it into a proper prompt. Compare the output to what you usually get when you write the prompt yourself.

2. **Self-verify**: on any important output (a client email, a proposal, a report), add a self-check instruction listing 3–4 explicit criteria. Note how many issues Claude catches and corrects before you see the final output.

3. **Outcome-first**: take a communication you need to write this week and reframe the prompt: start with what you need the recipient to think, feel, or do, and ask Claude to work backwards from there.

Note which techniques made the most visible difference to your output quality. Those are the ones to add to your standing Project instructions.

---

*Complete the quiz below to proceed to Module 9.*

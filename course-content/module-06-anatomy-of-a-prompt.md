# Module 6: Anatomy of a Good Prompt

**Track**: Core Skills
**Estimated reading time**: 9 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Name and apply the five elements of a well-structured prompt
- Write a system prompt and explain how it differs from a user message
- Construct a full prompt from scratch for a real task in your role
- Recognize which elements are missing from a weak prompt

---

## The Five Elements

A good prompt is not a single sentence. It is a brief — a structured set of information that gives Claude everything it needs to do the work well.

There are five elements. You do not always need all five. But knowing each one and having the habit of considering them is what separates a power user from someone getting mediocre results.

---

### Element 1: Role

Tell Claude who it is in this conversation.

This is not about roleplay. It is about activating a specific perspective, knowledge base, and style. Claude has absorbed the communication patterns and knowledge of experts across many fields. When you assign a role, you are focusing that knowledge on your specific situation.

**Examples:**
- "You are a senior marketing strategist specializing in financial services."
- "You are an experienced HR business partner at a mid-sized professional services firm."
- "You are a rigorous editor. Your job is to improve clarity and remove anything that does not serve the reader."

A well-chosen role immediately shifts the tone, depth, and frame of reference of Claude's response.

---

### Element 2: Task

State what you want Claude to do. Be specific and action-oriented.

Weak: *"Something about the proposal"*
Strong: *"Write a two-paragraph executive summary of this proposal, leading with the business case and ending with the recommended next step"*

The task should answer: what output format, what action, what scope?

---

### Element 3: Context

Give Claude the background it needs. This is the most variable element — sometimes one sentence, sometimes a full paragraph.

Context might include:
- Who you are and what you are working on
- The situation or problem being addressed
- Relevant history or constraints
- What has already been tried
- Who the stakeholders are

The more consequential the task, the more context pays off. For a quick reformatting task, context is unnecessary. For a client proposal or a sensitive communication, thorough context is the difference between a usable first draft and a completely wrong one.

---

### Element 4: Constraints

Tell Claude what the output must and must not include.

Constraints clarify the boundaries of the task and prevent Claude from filling space with things you do not want. They are not limitations — they are precision.

**Examples:**
- Length: "Under 200 words"
- Tone: "Professional but conversational — not stiff or corporate"
- Format: "Structured as three bullet points, each under 20 words"
- Audience assumptions: "Assume the reader has no technical background"
- Exclusions: "Do not include any statistics I have not provided. Do not use the phrase 'leveraging.' No hedging language."

---

### Element 5: Output Format

Tell Claude exactly how to present the result.

This is distinct from constraints — it is specifically about the structure and formatting of the response.

**Examples:**
- "Give me three options, each with a title and a two-sentence description"
- "Output a table with four columns: Action, Owner, Deadline, Dependencies"
- "Write this as flowing prose with no headers or bullets"
- "Format this as a professional email with subject line, greeting, body, and sign-off"

When you specify a format, you eliminate the guessing Claude would otherwise do — and you get an output you can use directly rather than one that needs to be reformatted.

---

## System Prompts vs. User Prompts

There are two types of instructions you can give Claude:

**User prompts** are your messages — the instructions you type in the conversation. They are temporary and specific to the task at hand.

**System prompts** are standing instructions that run silently before every message in a conversation. They set permanent rules, role, and context.

In Claude Desktop **Projects** (covered in Module 12), your Project instructions are the system prompt. Every conversation within that Project starts with those instructions already loaded — Claude already knows your role, your company, your tone preferences, and any standing rules you have set.

Think of it as the employee handbook given to the new hire on their first day. User prompts are the specific assignments. System prompts are the rules of the office.

**What belongs in a system prompt (Project instructions):**
- Who you are and your role
- What the company does and who the customers are
- Tone and communication style
- Standing rules ("always format deliverables with headers," "never use the phrase 'synergy'")
- Reference information that applies to every task

**What belongs in a user prompt (the conversation message):**
- The specific task
- The specific context for this task
- The specific format or constraints for this output

---

## Putting It Together: A Full Example

**Scenario**: You are in Customer Success and need to prepare for a difficult renewal conversation with a client whose satisfaction has been declining.

**Weak prompt:**
*"Help me prepare for a renewal call with a difficult client."*

**Strong prompt:**
*"You are an experienced Customer Success manager at a B2B SaaS company. [ROLE]*

*I have a renewal call on Thursday with a client who has been with us for 18 months. Over the past two quarters, their NPS dropped from 7 to 4, they have raised two support escalations, and usage of the platform has declined by 30%. The renewal is worth $85K ARR and we are not confident it will close. [CONTEXT]*

*Help me prepare by: (1) identifying the likely objections I will face, (2) recommending how to open the conversation to build trust before addressing the commercial discussion, and (3) suggesting three specific commitments I could offer that might turn the relationship around. [TASK]*

*Keep each section concise — I want to be able to read this prep document in under 5 minutes. Use headers for each of the three sections. Do not include generic customer success advice — make it specific to this situation. [CONSTRAINTS + FORMAT]"*

The strong prompt takes 60 seconds longer to write. The output is immediately actionable. The weak prompt would require several rounds of follow-up to get anywhere near as useful.

---

## Key Takeaways

1. A good prompt has five elements: Role, Task, Context, Constraints, Output Format
2. You do not always need all five — but always consider whether each is relevant
3. System prompts (Project instructions) set standing rules; user prompts handle specific tasks
4. More time writing the prompt = less time fixing the output
5. The goal is to give Claude a brief so complete it has no reason to guess

---

## Practical Exercise

Choose a task you actually need to do this week. Write a full five-element prompt for it:
- Role: who is Claude in this task?
- Task: what specifically is it doing?
- Context: what background does it need?
- Constraints: what must it include or avoid?
- Output format: how should the result be structured?

Submit the prompt. If the output still needs work, note which element was incomplete — that is where your next iteration should focus.

---

*Complete the quiz below to proceed to Module 7.*

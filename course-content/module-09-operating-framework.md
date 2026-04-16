# Module 9: The Operating Framework — Working With AI Every Day

**Track**: Core Skills
**Estimated reading time**: 10 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Categorize your daily tasks into the three zones of AI delegation
- Apply a consistent daily workflow for integrating Claude into your work
- Evaluate Claude's output using a five-dimension framework
- Contribute to and use a team prompt library

---

## From Occasional Use to a System

There is a significant difference between using Claude occasionally when you think of it and having a system for how AI fits into your work every day.

The occasional user gets inconsistent results: sometimes impressive, sometimes frustrating, never quite predictable. They have not developed the muscle memory for prompting or the judgment for when to use Claude vs. when not to.

The systematic user has categorized their work, knows which tasks to hand off, has standing context pre-loaded in Projects, and gets consistent, high-quality results because they approach every task with the same framework.

This module gives you that framework.

---

## The Three Approaches

Not every task belongs in Claude. Trying to use AI for everything creates more friction than it saves. The key is knowing which approach each task calls for.

---

**Delegate**

Tasks Claude can own with minimal review before you use the output.

Characteristics:
- Low stakes if Claude makes an error
- Standard format with clear expectations
- Primarily generation or reformatting
- You will do a quick scan, not a detailed review

Examples:
- First drafts of routine internal emails
- Meeting agenda formatting
- Summarizing a document you have already read
- Reformatting a list into a table
- Generating 10 subject line options for an email
- First draft of a job posting based on a brief you provide

**Your role**: brief, scan, use.

---

**Collaborate**

Tasks where Claude does the heavy lifting and you direct, refine, and make judgment calls.

Characteristics:
- The output represents you or your team
- Requires your context, judgment, and knowledge of the situation
- Multiple rounds of iteration typically needed
- You own the final product

Examples:
- Client-facing proposals and presentations
- Strategic analysis
- Sensitive communications
- Complex research synthesis
- Process documentation
- Performance review drafts

**Your role**: brief thoroughly, iterate actively, own the final version.

---

**Oversee**

Tasks where you do the primary work and Claude assists at specific points.

Characteristics:
- High stakes or high consequence
- Requires human judgment, relationships, or accountability
- Claude can support but not lead
- The final product cannot be delegated

Examples:
- Final decisions with real consequences
- Sensitive interpersonal conversations
- Anything requiring current, verified facts
- Legal, compliance, or regulated content
- Executive judgment calls

**Your role**: do the work yourself; use Claude to sense-check, proofread, or explore alternatives.

---

## A Daily AI Workflow

This is a suggested daily structure for integrating Claude. Adjust it to your role.

**Morning (5 minutes)**
Scan your task list. For each item, ask: is this Delegate, Collaborate, or Oversee? For Delegate tasks, plan to batch them together — hand them all to Claude in one focused session rather than switching back and forth.

**Before starting any Collaborate task**
Open Claude Desktop and open or create the relevant Project (or, in Claude Code, navigate your terminal to the right project folder so CLAUDE.md loads automatically). Write a full brief before you ask for anything. The brief is the work. The prompt is the plan. A rushed brief produces a useless output.

**During work**
Use Claude as a thought partner, not just a drafting tool. "What am I missing here?" "What would a critic say about this?" "What are the three biggest risks in this plan?" These questions often surface things you would not have thought to ask.

**Before any important output goes out**
Ask Claude to review it as the intended audience: "Read this as a skeptical CFO receiving this for the first time. What would they be confused by, unconvinced by, or frustrated by?"

**At end of week (10 minutes)**
Review the prompts you used this week. Which ones produced excellent output? Save those to the team prompt library. Which ones required many iterations? Note what the brief was missing — that is where your prompting skill still needs development.

---

## Evaluating Claude's Output: The Five Dimensions

Most people either accept Claude's output too quickly or abandon it too quickly. Neither is productive. Develop a consistent evaluation habit.

For any substantive output, run it through these five dimensions:

**1. Accuracy**
Are the facts correct? Can you verify the specific claims? Pay particular attention to numbers, dates, names, and any assertion that could be checked.

**2. Completeness**
Is anything obviously missing? Would a knowledgeable reviewer expect to see something this output does not include?

**3. Relevance**
Did Claude answer the actual question or a slightly different version of it? Generic answers often indicate that Claude answered the most probable version of your question rather than the specific one you asked.

**4. Tone and Voice**
Does this sound like your company, your team, your voice? Would the intended audience respond well to this tone? AI-generated text often has a detectable flatness — does this need to be humanized?

**5. Actionability**
Can you actually use this? Is it specific enough to act on? A plan that says "improve customer communication" is not actionable. A plan that says "send a personalized follow-up email within 24 hours of every demo call" is.

If an output scores well on all five, use it. If it fails on one or two, targeted iteration (Module 7) is your next step. If it fails on most, the brief was probably missing something fundamental — start over with a better prompt.

---

## The Team Prompt Library

Prompts that work are team assets. A prompt library is one of the highest-leverage investments a team can make in its AI capability.

**Structure each entry:**
```
Task name: [short descriptive name]
When to use: [the situation this applies to]
Prompt: [the full prompt text, with [VARIABLES] marked for customization]
Output notes: [what good output looks like; what to watch for]
Last updated: [date]
```

**Where to keep it**: a shared GitHub repository is the best home for a team prompt library — version-controlled, searchable, and anyone can improve prompts via pull request. Each person clones it once and can reference prompts by file path from Claude Code. For Claude Desktop teams, upload the `prompts.md` file to a shared Project so every team member has access. The important thing is that prompts live where the work happens — not in a note-taking tool that requires a separate context switch to retrieve them.

**How to build it**: start with one prompt per person from a real task they did this week. Review and add monthly. Retire prompts that no longer work as tools or workflows change.

**The compounding effect**: a team that shares prompts builds skill collectively rather than individually. The best prompter on the team makes everyone better.

---

## Key Takeaways

1. Delegate, Collaborate, or Oversee — every task falls into one of these three approaches
2. The daily workflow makes AI use intentional rather than reactive
3. Evaluate outputs on five dimensions: accuracy, completeness, relevance, tone, actionability
4. A team prompt library compounds individual skill into collective capability
5. The goal is a system — not just occasional impressive moments

---

## Practical Exercise

Before your next work day, categorize your task list as Delegate, Collaborate, or Oversee. For every Delegate task, plan to batch them into one Claude session. For every Collaborate task, block time to write a proper brief before you open Claude.

At the end of the day, note: did categorizing your tasks change how you worked? Were the Delegate batches faster than doing tasks one at a time? Did the Collaborate briefs produce better first outputs?

This exercise, done seriously once, usually becomes a permanent habit.

---

*Complete the quiz below to proceed to Module 10.*

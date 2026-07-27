# Module 10: Claude Desktop Projects — Solving the Blank Slate Problem

**Track**: Claude Desktop
**Estimated reading time**: 9 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain what a Project is and why it matters
- Write effective Project instructions (system prompt) for your role
- Organize conversations within Projects
- Set up your own Project before completing this course
- Recognize when a shared Project, session memory, a custom Skill, or a subagent applies to a task

---

**In Claude today:** this entire module teaches one underlying concept — giving your AI standing context so it doesn't start blank every conversation — through Claude's current implementation of it: Projects, Shared Projects, CLAUDE.md, Skills, subagents, Workflows, and `/loop`. The concept of persistent context is universal to any AI tool you might use. These specific names and mechanics are Claude's current version of it, and are the ones covered here because Claude is Helm's tool today.

---

## The Problem Projects Solve

Every Claude conversation starts blank. No memory, no context, no awareness of who you are or what you are working on.

For simple, one-off tasks this is fine. For ongoing work — a project you return to daily, a client relationship you manage, a function like marketing or CS where you have standing context — starting from zero every time is expensive. You spend the first part of every conversation re-establishing context that should never have been lost.

**Projects solve this.** A Project is a persistent context layer that loads automatically before every conversation within it. Your role, your company, your tone preferences, your standing rules — all of it is in place before you type your first message.

Think of it as the difference between briefing a random temp every morning versus working with a dedicated assistant who already knows everything about your work.

---

## What Is a Project?

A Project in Claude Desktop is a container for:

1. **Project instructions** — the standing system prompt that applies to every conversation in the Project (more on this below)
2. **Uploaded files** — documents, reference materials, style guides, templates that Claude should have access to throughout the Project
3. **Conversations** — all the sessions you have had within this Project, named and organized

You can have multiple Projects — one for each major area of your work. A marketing manager might have: a Brand Voice project, a Campaigns project, and a Client Content project. A CS manager might have: an Account Management project and a Renewal Preparation project.

---

## Writing Your Project Instructions

The Project instructions are the single most important thing to get right. These are your system prompt — the instructions that run silently before every conversation.

A well-written system prompt means every conversation starts with Claude already knowing:
- Who you are
- What company you work for and what it does
- Your communication style preferences
- What Claude should always and never do
- Any standing reference information

**Template for Project instructions:**

```
## Who I Am
[Your name, your role, your team, and what you are responsible for.]

## The Company
[What Helm does, who the customers are, key context a smart colleague would need to work effectively here.]

## My Audience
[Who you typically communicate with — internal colleagues, clients, prospects. Their profile, what they care about, their level of sophistication.]

## Communication Style
[How you want Claude to write: direct, professional, no hedging, no corporate jargon, specific over vague. Include examples of phrases to avoid.]

## Standing Rules
[Things that apply to every task: always include a clear call to action in client communications; never include statistics without a source; always format deliverables with headers; etc.]

## Reference Information
[Pricing, product names, team names, key terminology, anything Claude will need repeatedly.]
```

You do not need to fill in every section for every Project. A lean, accurate set of instructions is better than a long, padded one. Start with what Claude genuinely needs to know, and add more as you notice gaps.

---

## What NOT to Put in Project Instructions

**Do not put task-specific instructions here.** The system prompt is for standing context — things that apply to every conversation. Task-specific instructions belong in the conversation itself.

**Do not make it too long.** A system prompt that is 10 pages long will consume significant context window space on every conversation and may actually reduce performance. Keep it to the essentials.

**Do not include sensitive information** like passwords, personal data about clients, or anything you would not want visible if someone accessed your account.

---

## Uploading Files to a Project

You can upload files to a Project that Claude can reference across all conversations within it. Useful files to upload:

- **Brand and style guide**: so Claude always writes in your voice
- **Product documentation**: so Claude knows your product accurately
- **Templates**: documents Claude should match the format of
- **Reference data**: pricing tables, team structures, key terminology

When Claude has access to these files, you stop needing to paste context into every conversation. You can simply reference: *"Write this email in line with our brand guidelines"* and Claude will use the uploaded guide.

Keep uploaded files current. If a style guide is updated, upload the new version.

---

## Organizing Your Conversations

Within a Project, name your conversations descriptively. "New Chat" is not useful. "Q2 Campaign Brief — LinkedIn" or "Renewal Prep — Acme Corp" is.

Descriptive names mean:
- You can find conversations again when you need them
- You can reference earlier work without starting over
- Your conversation history becomes a searchable record of your AI-assisted work

A simple naming convention: `[Client or Project Name] — [Task] — [Date if relevant]`

---

## Building Your First Project: Step by Step

1. Open Claude Desktop and click **New Project**
2. Name the Project after the area of work it covers (e.g., "Client Communications" or "Marketing Copy")
3. Click into Project Instructions and write your system prompt using the template above
4. Upload any standing reference files (style guide, product docs, templates)
5. Start a new conversation within the Project and test it: ask Claude to introduce itself based on your instructions, or give it a simple task and see if it applies your context correctly
6. Refine the instructions based on what you observe

The first version of your Project instructions will not be perfect. Treat them as a working document and update them as you learn what Claude needs to do your work well.

---

## Shared Projects — Team Context, Not Just Individual Context

Everything above describes a Project you build for yourself. Claude also supports **Shared Projects** — the same container, but visible to your whole team.

Every person on the team opens their conversations inside the shared Project and starts with the same org context pre-loaded. Instead of five people on the CS team each writing their own version of "here's how we talk to clients about renewals," one shared Project holds the renewal playbook and product brief for everyone.

**Use case examples:**
- A CS team Project with the renewal playbook and product brief
- A Sales team Project with the ICP, objection library, and tone guide
- A Marketing team Project with brand voice and campaign context

**How to set one up:** create a Project → Project settings → Share with people or groups → team members see it in their Projects list.

**What goes in a shared Project vs. your personal one:** standing context that applies to everyone on the team goes in the shared Project. Personal preferences and your own individual standing rules stay in your personal Project — do not mix the two, or the shared Project accumulates instructions that only make sense for one person.

**Governance matters here.** Someone owns the shared Project's instructions. Decide who that is and how often it gets reviewed — a shared Project with stale or contradictory instructions is worse than no shared Project at all, because everyone assumes it is current.

---

## Claude Code Equivalent: CLAUDE.md Files

Claude Desktop solves the blank slate problem with Projects. Claude Code solves it with **CLAUDE.md files**.

### What is a terminal?

Before explaining CLAUDE.md, a quick note for those unfamiliar: Claude Code runs in a **terminal** (also called a command prompt or shell). A terminal is a text-based interface where you type commands instead of clicking buttons. On a Mac, it is the Terminal app. On Windows, it is PowerShell or Windows Terminal. You type a command, press Enter, and the computer executes it.

To start Claude Code, you open a terminal and type `claude`. Everything after that is a conversation — same as Claude Desktop, except it is text-based and runs in the context of whatever folder (called a **working directory**) you opened the terminal in.

### How CLAUDE.md works

A `CLAUDE.md` file is a plain-text file you place in a project folder. When Claude Code starts, it automatically reads every CLAUDE.md file in the current directory and parent directories — loading them as standing context before your first message. No pasting required.

This is the Claude Code equivalent of Project instructions. The same principle applies: tell Claude who you are, what this project is, and what the standing rules are.

**Example CLAUDE.md:**

```
## Project: Q2 Campaign Assets

## Role
Marketing Manager, Helm. Responsible for B2B content across email, LinkedIn, and client-facing materials.

## Company Context
Helm is a financial technology firm. Clients are institutional investors and family offices. Tone is professional, direct, and jargon-free.

## Standing Rules
- Always use active voice
- Never use the words "leverage," "synergy," or "seamless"
- All client-facing output should end with a clear call to action
- Flag any claim that requires a data source

## Reference
Product: Verivend platform. Key contacts: Dan (Sales), Sam (CS).
```

**Where to put it:** Create a folder for your project, put `CLAUDE.md` in it, and always open your terminal from inside that folder before starting Claude Code. Claude will find the file automatically.

**Multiple CLAUDE.md files:** You can have one in your home directory for global standing context (applies to everything) and separate ones in each project folder for project-specific context. Claude Code loads all of them, with more specific files taking precedence.

### Uploading files in Claude Code

There is no attachment button in Claude Code. Instead, reference files directly by path:
- *"Read the file at `./brand-guide.pdf` and apply its tone guidelines to the following draft"*
- *"Analyse the data in `./q1-results.csv` and summarise the key trends"*

Claude Code can read any file on your filesystem that you have permission to access. The `./` prefix means "in the current folder."

### Beyond CLAUDE.md — What Claude Code Can Do

CLAUDE.md solves the blank-slate problem for standing context. Claude Code has several other capabilities worth knowing about — you do not need to master these to complete this course, but you should recognize them so you know what is available when a task calls for it.

**Session memory:** Claude Code automatically remembers facts about you and your projects across sessions, stored in a memory folder on your machine — you do not have to re-explain "I use Python, not JavaScript" or "this codebase is for Helm's internal tools" every time. You can also tell it explicitly: *"Remember that X"* and it saves the fact for future sessions. This is a genuine difference from Claude Desktop and claude.ai, where conversations do not carry memory forward except through what you put in a Project.

**Skills (custom slash commands):** You can build your own reusable slash commands — a saved set of instructions for a task you do repeatedly, invoked by typing `/[command-name]`. This course itself runs on one: the quiz-completion check your program administrator runs is a slash command, not a one-off script. If you find yourself giving Claude Code the same multi-step instructions more than twice, that is a signal to turn it into a Skill.

**Subagents:** For a large or multi-part task, Claude Code can spawn specialized helper agents that work in parallel — one searching the codebase, one reviewing a specific file, one drafting a report section — and bring their results back together. You do not need to set this up manually for routine work; it becomes relevant once a task is big enough that doing it serially would take noticeably longer.

**Workflows:** For genuinely large jobs — auditing many files, migrating something across a codebase, running the same review across a big list — Claude Code can run a structured, multi-stage script that fans work out to many subagents at once rather than one at a time. This is well beyond what most citizen developer tasks need, but if you ever have a job that feels like "the same thing, 50 times," this is the tool that exists for it.

**`/loop`:** Runs a prompt or command repeatedly on a schedule — for example, checking something every few minutes, or re-running a report on an interval — without you having to manually re-trigger it each time.

None of these replace the fundamentals from Modules 5–8. They are tools for scale and repetition, not substitutes for a well-written prompt.

---

## Key Takeaways

1. Projects pre-load standing context so you never start from zero
2. Project instructions (the system prompt) are the most important element to get right — the same principle applies to CLAUDE.md files in Claude Code
3. Write instructions covering: who you are, your company, your audience, your style, your standing rules
4. Upload standing reference files (Desktop) or reference them by file path (Claude Code)
5. Name conversations descriptively — your history is a resource, not a log
6. Shared Projects give a whole team the same standing context — decide who owns and maintains it
7. Claude Code adds session memory, custom Skills, subagents, Workflows, and `/loop` for scale and repetition — not fixes for a weak prompt

---

## Practical Exercise — Required Before Proceeding

**This exercise is the capstone of the Foundation and Core Skills sections.**

Before moving to the next module, set up a Project for your role:

1. Create a new Project in Claude Desktop
2. Write Project instructions using the template in this module
3. Upload at least one relevant reference file (style guide, product doc, or template)
4. Start a conversation and give Claude a real task from your work
5. Evaluate whether the standing context improved the output compared to a conversation without it

Your Project instructions are already saved inside the Project — no screenshot needed. For Claude Code users, they are your `CLAUDE.md` file, which lives in the project folder. Either way, they are always one step away from where you do the work. Refine them as you go.

---

*Complete the quiz below to proceed to Module 11.*

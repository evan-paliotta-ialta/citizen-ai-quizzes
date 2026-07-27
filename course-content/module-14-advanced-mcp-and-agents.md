# Module 14: Advanced Claude — MCP, Agents, and RAG

**Track**: Advanced
**Estimated reading time**: 11 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain what MCP servers are and why they matter
- Use a native connector without any developer involvement
- Describe the difference between an AI assistant and an AI agent
- Set up a Routine for a recurring task without writing any code
- Understand RAG at a conceptual level and explain its value
- Identify which advanced capability applies to which type of problem

---

## Moving From User to Citizen Developer

The previous modules covered how to use Claude well. This module covers how Claude gets extended — how it connects to your actual tools, how it takes actions instead of just generating text, and how it accesses information that is not in its training.

You do not need to build any of this yourself to benefit from it. But understanding the concepts means you can:
- Recognize when a problem calls for an advanced solution
- Have an intelligent conversation with a developer about what to build
- Evaluate whether a proposed AI workflow is sensible and safe
- Eventually build simple versions yourself

---

## MCP Servers — Claude With Superpowers

**Worth knowing:** MCP is an open, industry-wide standard, not a Claude-only feature — other AI tools are adopting it too. Of everything in this module, MCP is the concept and the mechanism most likely to still be relevant even if Helm's AI tooling changes down the road.

Claude Desktop on its own is powerful but isolated. It cannot see your HubSpot deals, your SharePoint files, your Slack messages, or your database — unless you copy-paste that information into it manually.

**MCP (Model Context Protocol)** is Anthropic's open standard for connecting Claude to external tools and systems. An MCP server is a connector — a bridge between Claude and a specific tool.

**Without MCP**: you copy data from HubSpot, paste it into Claude, get output, copy the output, paste it back into HubSpot.

**With an MCP server for HubSpot**: Claude can read from and write to HubSpot directly. No copy-pasting. Claude becomes a participant in your workflow, not just a text box alongside it.

**Examples of what MCP servers enable:**
- Claude reads your latest 10 deals in HubSpot and generates a pipeline risk summary
- Claude searches your Google Drive for relevant documents without you having to find and paste them
- Claude checks Slack for the latest update on a project before preparing a status report
- Claude creates a draft in your email client, ready to review and send

**Important**: MCP servers require setup — either by you or by a developer. Once configured, they are persistent. They are the infrastructure layer that turns Claude from a standalone tool into an integrated part of your workflow.

**The list of available MCP servers** grows every week as the industry adopts the standard. HubSpot, Notion, Google Drive, Slack, Linear, GitHub, and many databases already have MCP servers. Every major enterprise software vendor will have one within 12–18 months.

---

## Native Connectors — What's Available Right Now, No Developer Required

**In Claude today:** the specific "Connectors" panel described below is a Claude/Anthropic product feature. The underlying idea — some integrations need zero setup because the vendor pre-built them — is common across AI tools, but the exact mechanics here are Claude's.

Everything above about MCP servers requiring setup by you or a developer is true for *custom* connections. But claude.ai has a built-in **connector panel** with pre-built, pre-approved connections you can turn on yourself, with no setup cost and no IT ticket.

**Where to find it:** claude.ai Settings → Connectors.

**Available today:** HubSpot, Slack, Google Drive, GitHub, Clay, and a growing list. Check the approved-connector list in the AI policy for which ones are sanctioned for Helm use — it is the same list referenced in this course's MCP allowlist.

**How to use one:** Settings → Connectors → authorize the tool → done. Then just ask, in plain language: *"Summarize my open deals this week"* and Claude reads your actual HubSpot data to answer — no MCP server configuration, no developer involved.

**The difference from custom MCP:** connectors are pre-built and pre-approved for common tools — turn one on and go. Custom MCP servers (what the rest of this module covers) are for tools not on the connector list, or for more complex/custom integrations a developer builds specifically for your workflow.

**One thing does not change:** connecting Claude to a live system — through a connector or a custom MCP server — is automatically Zone 3, regardless of what data you think you are pulling. The zone framework from Module 13 applies exactly the same way.

---

## Agents — When Claude Takes Actions

There is a critical distinction between an AI **assistant** and an AI **agent**.

**An assistant answers questions.** You ask, it responds, you take action.

**An agent takes actions.** It can observe a situation, plan a sequence of steps, execute each step, check the result, and decide what to do next — without you managing each step.

**Example of a Claude assistant task:**
*You*: "How should I respond to this client escalation?"
*Claude*: "Here is a suggested response..."
*You*: Copy, paste, edit, send.

**Example of a Claude agent task:**
*You set up an agent that monitors your support inbox. When a message arrives flagged as urgent, the agent reads the message, looks up the client's account in HubSpot, drafts a response based on the account history, and drops it in a Slack channel for a human to review and send in one click.*

The difference is consequential. Agents take real-world actions. They can send emails, update records, create documents, query databases. This makes them powerful — and it makes getting the design right critically important.

**Key principle for agent design**: always build in a human review checkpoint for any action that is difficult to reverse. Sending an email, updating a client record, publishing content — all should pass through a human before execution, at least until the agent has proven reliable.

---

## Routines — Scheduled Tasks Without a Developer

**In Claude today:** "Routines" is Claude's specific name and implementation for scheduled, no-code automation. The underlying concept — describe a recurring task once, let the AI run it on schedule — is not unique to Claude, but the exact feature and where to find it are.

Everything in the agent example above ("monitors your support inbox... drops it in a Slack channel") sounds like it needs a developer to build. For a large class of everyday automation, it does not — that is what **Routines** are for.

A Routine is a task you describe once, on a schedule you set — daily at 8am, every Monday, monthly — and Claude runs it and delivers the output. No code, no MCP server setup, no developer.

**Examples:**
- A daily pipeline summary emailed to you every morning
- A weekly competitor news digest posted to a Slack channel
- A monthly usage report
- A Friday end-of-week team summary

**Where to find it:** claude.ai → left sidebar → Routines (naming may vary as the feature rolls out further).

**This is the "agent" concept made non-technical.** You are not building the monitoring-and-action system described above — you are describing a recurring task in plain language and letting Claude run it on schedule.

**Human review still applies.** For anything going to clients or leadership, configure the Routine to draft and deliver to your own inbox for review rather than sending or posting directly — the same human-in-the-loop principle from Module 13, just applied to something that runs automatically instead of something you trigger by hand.

**Data zones still apply.** A Routine that connects to live CRM data, Slack, or any other system is Zone 3, exactly like any other connected task.

---

## RAG — Giving Claude Current and Private Knowledge

**The problem RAG solves**: Claude's training ended at a cutoff date, and it knows nothing about your company's internal documents, proprietary data, or recent information.

**RAG (Retrieval Augmented Generation)** solves this at scale.

Here is how it works conceptually:

1. You have a library of documents — your knowledge base, product documentation, past proposals, research reports, client histories
2. Those documents are processed and stored in a way that makes them searchable by meaning, not just keywords
3. When someone asks Claude a question, the system first searches that library for the most relevant documents
4. Those relevant documents are added to Claude's context
5. Claude answers using both its trained knowledge and the retrieved documents

**The result**: Claude can answer questions accurately about your company, your products, your clients, and your internal processes — drawing on up-to-date, private information rather than guessing.

**Practical examples:**
- *"What did we promise client X in their last QBR?"* → RAG retrieves the QBR notes and Claude answers accurately
- *"What does our data suggest about this sector?"* → RAG retrieves relevant internal research and Claude synthesizes it
- *"Has anyone raised this compliance question before?"* → RAG searches past conversations and Claude surfaces the relevant precedent

**Manual RAG vs. Automated RAG**

Every time you upload a document to Claude Desktop and ask questions about it, you are doing manual RAG. You are retrieving the relevant document yourself and putting it in Claude's context.

Automated RAG does this at scale and automatically — the system retrieves the right documents without you having to find and upload them. Building an automated RAG system requires a developer, but using one (once built) is as simple as asking Claude a question.

---

## Which Tool for Which Problem

| Problem | Solution |
|---|---|
| Claude doesn't know about my company's internal processes | RAG — feed it your documents |
| I want Claude to read live data from HubSpot, Slack, Drive, or GitHub, no developer involved | Native connector (Settings → Connectors) |
| I have to copy-paste data between a tool without a native connector and Claude constantly | Custom MCP server for that tool |
| I want something to run on a schedule and land in my inbox or Slack, no developer involved | A Routine |
| I want Claude to monitor something and take action when conditions are met, with more logic than a schedule allows | Agent workflow (needs a developer) |
| I want Claude Code to run the same review or check across many files or a big list at once | Workflows / subagents |
| I want a task to repeat on an interval from Claude Code | `/loop` |
| I want Claude to do research and give me a report | Claude with web search + good prompting |
| I want Claude to generate content for me to review | Claude, no advanced tooling needed |
| I want Claude to update CRM records after every sales call automatically | Agent + MCP server (or connector) for your CRM |

---

## Key Takeaways

1. MCP servers connect Claude to your actual tools — eliminating the copy-paste loop
2. Native connectors do the same thing for common tools (HubSpot, Slack, Drive, GitHub) with zero setup — check Settings → Connectors before assuming you need a developer
3. Agents take actions rather than just generating text — powerful, but require careful human oversight design
4. Routines let you schedule a recurring task in plain language, no developer required — the non-technical version of an agent
5. RAG gives Claude accurate access to your private, current knowledge — solving the cutoff and company-knowledge problems
6. You do not need to build these systems to use them — but understanding the concepts helps you spot the right solution for the right problem
7. The more autonomous Claude becomes, the more important human review checkpoints are

---

## Practical Exercise

Think about your daily workflow and identify:

1. **One native connector to actually turn on**: check Settings → Connectors and connect one tool you use daily (if it's on the approved list). Have a real conversation with Claude that references live data from it. Note whether the output was meaningfully better than copy-paste.

2. **One RAG opportunity**: a question you wish Claude could answer accurately about your company or clients that it currently cannot — because the answer is in an internal document or system. Describe what that document or system is.

3. **One Routine or agent opportunity**: a repetitive, multi-step task you do that follows a consistent pattern. Describe the trigger, the steps, and where the human review point should be. If it's simple enough to describe as "do X every [schedule]," it's a Routine candidate — no developer needed. If it needs conditional logic or monitoring, it's an agent opportunity for a developer to help build.

You do not need to build the agent or MCP opportunities — just identify them. The connector, though, you can actually do today. This is the beginning of your personal AI automation roadmap.

---

*Complete the quiz below to proceed to Module 15.*

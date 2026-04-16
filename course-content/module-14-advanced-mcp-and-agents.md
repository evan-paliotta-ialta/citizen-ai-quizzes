# Module 14: Advanced Claude — MCP, Agents, and RAG

**Track**: Advanced
**Estimated reading time**: 11 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain what MCP servers are and why they matter
- Describe the difference between an AI assistant and an AI agent
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
| I have to copy-paste data between my tools and Claude constantly | MCP server for those tools |
| I want Claude to monitor something and take action when conditions are met | Agent workflow |
| I want Claude to do research and give me a report | Claude Desktop with web search + good prompting |
| I want Claude to generate content for me to review | Claude Desktop, no advanced tooling needed |
| I want Claude to update CRM records after every sales call automatically | Agent + MCP server for your CRM |

---

## Key Takeaways

1. MCP servers connect Claude to your actual tools — eliminating the copy-paste loop
2. Agents take actions rather than just generating text — powerful, but require careful human oversight design
3. RAG gives Claude accurate access to your private, current knowledge — solving the cutoff and company-knowledge problems
4. You do not need to build these systems to use them — but understanding the concepts helps you spot the right solution for the right problem
5. The more autonomous Claude becomes, the more important human review checkpoints are

---

## Practical Exercise

Think about your daily workflow and identify:

1. **One MCP opportunity**: a tool you currently copy-paste data to/from Claude manually. Name the tool and describe what you would want Claude to do if it were directly connected.

2. **One RAG opportunity**: a question you wish Claude could answer accurately about your company or clients that it currently cannot — because the answer is in an internal document or system. Describe what that document or system is.

3. **One agent opportunity**: a repetitive, multi-step task you do that follows a consistent pattern. Describe the trigger, the steps, and where the human review point should be.

You do not need to build these — just identify them. This is the beginning of your personal AI automation roadmap.

---

*Complete the quiz below to proceed to Module 15.*

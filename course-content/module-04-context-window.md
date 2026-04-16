# Module 4: The Context Window — Claude's Working Memory

**Track**: Foundation
**Estimated reading time**: 7 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain the context window using a clear analogy
- Describe what fills the context window and why it matters
- Manage conversations to maintain quality throughout a session
- Use the "summary prompt" trick to carry context across sessions

---

## The Whiteboard Analogy

Imagine Claude has a whiteboard. At the start of every conversation, that whiteboard is completely blank. As you talk — as you send messages, upload documents, and receive responses — information fills the whiteboard.

Claude can only work with what is on the whiteboard right now. It cannot see anything from yesterday's whiteboard. It cannot look up previous conversations. It cannot remember your name, your role, or your preferences unless that information is written on the current whiteboard.

This is the context window: **Claude's entire working awareness for this conversation, and nothing outside it.**

---

## What Goes On the Whiteboard

Every element of an active conversation consumes context window space:

- Your messages
- Claude's responses
- Documents and files you upload
- Project instructions (the system prompt — covered in Module 12)
- Results from tools like web search

The context window has a size limit measured in tokens. When you approach that limit, Claude does not crash or stop — but it begins to "forget" things from earlier in the conversation, giving more weight to recent content and less to older material.

---

## Why This Changes How You Work

**Every conversation is a blank slate**

When you open a new conversation, Claude has no idea who you are, what company you work for, what project you are working on, or how you like to communicate. You start from zero every time.

This is why experienced users either:
1. Use Projects (Module 12) to pre-load standing context, or
2. Start conversations with a brief that gives Claude the context it needs

Neither approach is complicated. Both make an enormous difference.

**Long conversations degrade**

A conversation you have been running all morning for a complex project has accumulated a lot on the whiteboard. If you are starting to get responses that seem to miss the point or ignore things you established earlier, the context window is the likely culprit.

The fix is not to repeat yourself in the same conversation — it is to start a new conversation with a tight, well-chosen brief.

**Document uploads count toward the limit**

A 20-page PDF uploaded to a conversation takes up a significant portion of the context window. If you then have a long back-and-forth, you may find quality degrading faster than in a text-only conversation. For long documents, consider whether you need the whole document or just the relevant sections.

---

## The Summary Prompt Trick

One of the most useful techniques for managing context across sessions: before a long conversation ends, ask Claude to write a brief you can use to restart with full context in a new session.

**Prompt**: *"Please write a concise summary of everything we've established in this conversation — the context, the decisions made, and where we left off — formatted as a brief I can paste at the start of a new conversation."*

Claude will produce a compact, accurate brief. Where you save it matters — the goal is that the brief lives *with the project*, not in a disconnected app you have to go find later.

- **Claude Desktop**: paste it as a note in the relevant Project, or save it as a file and upload it to the Project so it is available across sessions
- **Claude Code / folder-based workflow**: save it as a Markdown file directly in the project folder (e.g., `context-brief.md`). Next session, launch Claude Code from that same folder and reference the file directly — or paste its contents as your opening message. If you organise your work as a main AI folder on your desktop with subfolders per project, this brief file drops right into the relevant subfolder and stays with the work
- **Quick reference**: even naming the conversation descriptively ("Q2 Proposal — outline agreed, next: draft section 3") gives you a breadcrumb to find it again

The brief is most useful when it is one click away from where you do the work — not buried in a separate note-taking tool.

This turns the blank-slate limitation into something manageable.

---

## Knowing When to Start Fresh

Signs that it is time to start a new conversation:
- Claude gives an answer that contradicts something you established clearly earlier
- You are switching to a completely unrelated task
- The conversation has been running for hours with heavy document uploads
- You asked Claude to summarize what you covered and the summary was incomplete or inaccurate

Signs that you should keep going in the same conversation:
- You are iterating on the same document or output
- The current context is directly relevant to your next question
- You are fewer than 20–30 exchanges in with no large document uploads

---

## Key Takeaways

1. The context window is Claude's working memory for this conversation — nothing outside it exists for Claude
2. Every message, response, document, and tool result consumes context window space
3. When the window fills, earlier information carries less weight — quality can degrade in very long sessions
4. Use Projects to pre-load standing context so you do not start from zero every time
5. Use the summary prompt trick to carry context across sessions cleanly

---

## Practical Exercise

At the end of your next substantive Claude conversation, use the summary prompt:

*"Please write a concise summary of everything we've established in this conversation — the context, the decisions made, and where we left off — formatted as a brief I can paste at the start of a new conversation."*

Save the output. Notice how much context Claude was able to compress into a reusable brief. This is now part of your standard workflow.

---

*Complete the quiz below to proceed to Module 5.*

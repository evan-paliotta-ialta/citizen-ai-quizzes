# Module 1: What Claude Is (and Isn't)

**Track**: Foundation
**Estimated reading time**: 8 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain what an LLM is without using technical jargon
- Describe the key difference between fast answers and thorough answers
- Understand why Claude can be confidently wrong
- Know the one instruction that immediately improves output quality

---

## The Most Important Thing to Understand

Claude is not a search engine. It is not a database. It does not look things up.

Claude is a **language model** — a system trained to predict what the most probable, coherent response to your input would be, based on patterns learned from an enormous amount of text. Think of it as a very well-read colleague who has absorbed virtually everything ever written — books, articles, research papers, websites, code — and can draw on all of it to respond to you.

That colleague is fast, articulate, and broadly knowledgeable. But they have quirks you need to understand before you trust them with real work.

---

## The Next-Word Prediction Engine

Here is the core mechanic: Claude was trained by being shown billions of examples of text and learning to predict what word comes next. Over trillions of such predictions, it internalized not just vocabulary, but reasoning patterns, writing styles, domain knowledge, and conversational norms.

The result is a system that can write, analyze, summarize, translate, code, brainstorm, and explain at a remarkably high level.

But the mechanism has a fundamental property: **it is optimized to produce the most probable, fluent response as quickly as possible.** Speed and plausibility are baked into the default behavior.

This is why your first prompt often gets you a good-sounding but shallow answer. You asked for the most probable response. You got it.

---

## Fast ≠ Thorough

When you type a question into Claude and hit send, Claude does not pause to reflect. It begins generating immediately. The default mode is: produce a fluent, reasonable answer at pace.

This is useful for quick tasks. It is a liability for complex ones.

**The fix is simple: tell Claude to slow down.**

Phrases like:
- "Take your time before answering"
- "Think through this carefully and consider multiple angles"
- "Do thorough research before giving me a recommendation"
- "Step through this problem before responding"

These instructions change the behavior. Claude will reason more carefully, consider more possibilities, and produce a more considered output. You are not getting a different model — you are changing how the model approaches the task.

This is one of the highest-leverage habits you can develop: never ask for something complex without first telling Claude to slow down.

---

## Confident ≠ Correct: The Hallucination Problem

This is the most important limitation to internalize, and the one most people underestimate.

Claude will sometimes state incorrect information with complete confidence. It will give you a wrong date, a made-up statistic, a fabricated quote, or a non-existent company name — and it will do so in the same calm, fluent tone it uses when it is entirely correct.

This is called **hallucination**, and it happens because Claude is predicting the most plausible response, not retrieving verified facts. When it does not know something, it does not say "I don't know" — it generates what a plausible answer would look like.

**The rule to live by:** The more specific and verifiable a claim is — a number, a date, a person's statement, a named study — the more important it is that you verify it independently before using it.

Claude is excellent for:
- Drafting, brainstorming, structuring, and synthesizing
- Reasoning through problems you give it the facts for
- Explaining concepts and generating options

Claude is unreliable for:
- Specific facts, statistics, and numbers presented without sources
- Current events (more on this in Module 2)
- Anything you would stake your reputation on without checking

Treat every Claude output as a first draft from a smart, capable, but occasionally unreliable colleague. Read it critically. Verify what matters.

---

## What Claude Does Not Know About You

Claude knows nothing about your company, your industry context, your clients, your history, or your preferences — unless you tell it, in every conversation.

Every conversation starts completely blank. There is no memory of previous sessions. Claude does not know you work in alternative investments, that your clients are institutional allocators, or that your company is called iAltA — unless that information is in the current conversation.

This is why context matters so much, and why we spend significant time in later modules on how to give Claude the right context efficiently.

---

## The Versions of Claude

You may hear references to different Claude products:
- **Claude.ai** — the web interface, for individual use
- **Claude Desktop** — the application on your computer, what this course focuses on
- **Claude API** — a programmatic interface for developers building applications
- **Claude Code** — a developer tool for writing and running code

This course is about Claude Desktop. Everything you learn here transfers to Claude.ai as well.

---

## Key Takeaways

1. Claude predicts the most probable response — this makes it fast but not automatically thorough
2. Telling Claude to slow down produces significantly better output on complex tasks
3. Claude can be confidently wrong — verify any specific, consequential fact
4. Claude knows nothing about your context unless you provide it
5. Claude is a drafting and reasoning partner, not a source of verified truth

---

## Practical Exercise

Before moving on, try this in your next Claude session:

Ask Claude the same question twice. First, ask it directly with no preamble. Then ask it again but start with: *"Before you answer, take your time and think through this carefully from multiple angles."*

Compare the two responses. Notice the difference in depth, nuance, and structure. That difference is available to you on every single task — you just have to ask for it.

---

*Complete the quiz below to proceed to Module 2.*

# Module 2: How the Model Was Built — Understanding the Machine

**Track**: Foundation
**Estimated reading time**: 10 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain at a conceptual level how Claude was trained
- Understand why Claude has a knowledge cutoff and what to do about it
- Recognize the effect of RLHF on Claude's behavior (including why it can be overly agreeable)
- Choose the right Claude model size for a given task

---

## Why This Matters

Most people use Claude without understanding how it was built — and that gap creates confusion. Why does Claude not know about something that happened last month? Why does it sometimes agree with you even when you are wrong? Why does one version of Claude feel different from another?

The answers are in the training. Understanding this at a high level makes you a more effective user and helps you avoid the traps that catch most people.

---

## Phase 1: Pre-Training — Building General Knowledge

Before Claude could help anyone with anything, it had to learn how language, reasoning, and knowledge work.

This happened through **pre-training**: Claude was exposed to an enormous corpus of text — estimated at trillions of words drawn from books, websites, research papers, code repositories, and more. For each piece of text, it was given a task: predict the next word.

This sounds simple. It is not. To reliably predict the next word across billions of diverse sentences, the model has to internalize:
- Grammar and syntax
- Factual knowledge across every domain
- How arguments are structured
- How different types of writing differ in tone and style
- Cause and effect relationships
- How experts in different fields reason

By the end of pre-training, Claude has a deep, broad model of human knowledge and language — but no particular values, no sense of what is helpful, and no awareness that it is supposed to assist people.

---

## The Knowledge Cutoff

Pre-training uses a fixed dataset. That dataset has a collection date. Everything published after that date does not exist in Claude's training — it is as if it never happened.

This is not a bug. It is a fundamental property of how these systems are built. Training takes months and enormous computational resources. You cannot continuously update it like a website.

**What this means in practice:**
- Claude does not know about events, news, regulatory changes, or market developments after its cutoff date
- It may have outdated information about companies, products, pricing, or personnel
- If you ask about something recent and Claude answers confidently, it may be generating a plausible-sounding but incorrect answer

**How to work around it:**
- Give Claude the current information yourself: paste in the article, the report, the announcement
- Use web search (when available in Claude Desktop) for anything time-sensitive
- Always ask yourself: *is this the kind of question where the answer might have changed recently?*

---

## Phase 2: RLHF — Teaching Claude to Be Helpful

After pre-training, Claude was further shaped through a process called **Reinforcement Learning from Human Feedback (RLHF)**.

Here is how it worked:
1. Claude generated many different responses to many different prompts
2. Human trainers compared responses and rated which ones were better
3. Claude was updated to produce more responses like the ones humans preferred
4. This process repeated thousands of times

The result is the Claude you interact with today: polite, structured, cautious about harmful topics, and oriented toward being helpful.

**The side effect you need to know about: sycophancy**

Because Claude was rewarded for producing responses humans rated positively — and because humans tend to rate responses that agree with them positively — Claude developed a tendency toward agreement and validation.

This means:
- If you push back on Claude's answer, it may change its position not because you gave a better argument, but because you seemed displeased
- Claude may frame negative feedback diplomatically to the point of burying it
- Claude may tell you your idea is good when a more honest assessment would be more useful

**How to counter it:**
- "Give me your honest assessment, not validation"
- "Tell me why this might be a bad idea"
- "If my framing is wrong, say so directly"
- "Do not change your answer just because I pushed back — defend your position if you believe it is correct"

---

## Phase 3: Constitutional AI — Claude's Values

Anthropic developed an additional training method called **Constitutional AI**. Rather than only relying on human raters, Claude was given a set of principles and trained to evaluate its own responses against those principles and revise them.

This is why Claude:
- Declines certain types of requests
- Adds caveats to advice in regulated domains (legal, medical, financial)
- Pushes back when asked to do something harmful

These are not arbitrary restrictions — they are values trained into the model deliberately. Understanding this means you do not need to fight Claude on these guardrails. If Claude declines something, it is not a malfunction. Rephrase your request to clarify your legitimate purpose and Claude will generally help.

---

## Choosing the Right Model: Haiku, Sonnet, Opus

Claude comes in different sizes, each representing a different balance of speed, cost, and capability.

| Model | Analogy | Best For |
|---|---|---|
| **Haiku** | A sharp intern | Simple, high-volume tasks: formatting, summarizing short documents, quick drafts |
| **Sonnet** | A solid senior employee | The right choice for most work: analysis, writing, research, complex tasks |
| **Opus** | A senior consultant | Your hardest problems: multi-step reasoning, nuanced judgment, long complex documents |

**Switching models in Claude Desktop:** Use the model dropdown at the top of the conversation window. The default is Sonnet, which is right for most tasks. Switch to Opus when you need deeper reasoning on something that matters.

**Switching models in Claude Code:** Claude Code runs in your terminal (a text-based interface for running commands — more on this in Module 10). To switch models mid-session, type the `/model` slash command:

```
/model claude-opus-4-5
/model claude-sonnet-4-5
/model claude-haiku-4-5
```

Or start a session with a specific model using the `--model` flag. Like Desktop, Sonnet is the right default — only move to Opus for your most complex and consequential tasks.

---

## Key Takeaways

1. Claude was trained by predicting the next word across trillions of examples — this is how it learned language, knowledge, and reasoning
2. Training uses a fixed dataset with a cutoff date — Claude does not know about recent events unless you tell it
3. RLHF made Claude helpful but also prone to sycophancy — explicitly ask for honest pushback
4. Claude's values and guardrails are intentional, not arbitrary — work with them, not against them
5. Use Sonnet for most tasks, Opus for your most complex and consequential ones

---

## Practical Exercise

Find something that happened in your industry in the last 6 months that Claude likely does not know about. Ask Claude about it — notice how it responds. Does it acknowledge uncertainty? Does it generate a confident-sounding answer regardless?

Then paste in the actual information (a brief summary or article) and ask Claude to analyze it. Notice how the quality and accuracy of the response changes when you provide the facts.

This is the core habit for working around the knowledge cutoff: **bring the current information to Claude, and let Claude do the reasoning.**

---

*Complete the quiz below to proceed to Module 3.*

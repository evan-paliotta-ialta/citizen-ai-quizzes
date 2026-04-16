# Module 3: Tokens — The Currency of AI

**Track**: Foundation
**Estimated reading time**: 7 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Explain what a token is in plain language
- Understand why token limits affect conversation quality
- Avoid common mistakes caused by misunderstanding tokenization
- Apply token-awareness to improve your prompting efficiency

---

## What Nobody Tells You

Most people who use Claude every day have no idea what a token is. This creates invisible problems: conversations that degrade mysteriously, tasks that produce strange results, and confusion about why Claude sometimes struggles with things that seem trivially simple.

Tokens are the unit Claude operates in. Understanding them takes five minutes and pays off immediately.

---

## What Is a Token?

Claude does not read words. It reads **tokens**.

A token is a chunk of text — roughly three-quarters of a word on average. Some common examples:

- The word "cat" = 1 token
- The word "running" = 1 token
- The word "unbelievably" = 3 tokens
- A typical sentence = 15–20 tokens
- A standard page of text ≈ 750 tokens
- This entire module ≈ 1,200 tokens

Tokens are not words, and they are not characters. They are variable-length chunks that Claude's architecture uses to process text efficiently. You do not need to count tokens — but you do need to understand that everything has a token cost.

---

## Why Tokens Matter: The Context Window

Every Claude model has a **context window** — a maximum number of tokens it can hold at once. Think of it as working memory. Everything in an active conversation — your messages, Claude's responses, uploaded documents, and system instructions — all consume this working memory.

When you approach the limit:
- Claude may start to lose track of things mentioned earlier in the conversation
- Summaries may become less precise
- Instructions from the beginning of a long conversation may carry less weight

**The practical implication**: long conversations and large documents are not free. Be intentional about what you put in the context window.

---

## Why Claude Struggles With Simple Tasks

Here is something that surprises most people: Claude is excellent at analyzing complex documents and poor at counting the letters in a word.

The reason is tokenization.

When you ask Claude to count the letters in "strawberry," Claude does not see 10 individual characters. It sees roughly 3 tokens. The internal representation does not preserve individual characters the way a human reading letter-by-letter would.

Tasks that seem simple but rely on character-level operations are genuinely harder for Claude:
- Counting letters in a word
- Reversing a string character by character
- Precise arithmetic with large numbers
- Checking exact spelling of unusual words

**The rule**: do not use Claude as a calculator or a spell-checker. Use a calculator for arithmetic and spell-check for spelling. Use Claude for what it is actually good at: reasoning, drafting, analyzing, synthesizing.

---

## Token Efficiency in Practice

Being token-aware makes you a better user. Here are the practical habits:

**Be concise in your prompts**
You do not need to write three paragraphs of preamble before asking a question. Claude does not need to be warmed up. Get to the point — shorter prompts leave more room for Claude's response and cost less.

**Upload only what is relevant**
If you are asking a question about section 3 of a 50-page contract, paste section 3 — not the whole document. The more document you paste, the more context window you consume, and the less attention Claude can allocate to your actual question.

**Start fresh conversations for new tasks**
A conversation you have been using all day for one project accumulates tokens. When you start a genuinely new task, open a new conversation rather than continuing. This gives Claude a clean context and prevents earlier conversation from bleeding into unrelated work.

**Watch for degradation in long conversations**
If Claude starts giving answers that seem to ignore something you established earlier in the conversation, it is often a sign the context window is getting full. Start a new conversation and paste in only the relevant context.

---

## Key Takeaways

1. Claude operates in tokens — roughly 3/4 of a word each
2. Everything in a conversation consumes the context window: your messages, Claude's responses, uploaded documents
3. When the context window fills up, earlier information carries less weight
4. Character-level tasks (counting letters, exact arithmetic) are genuinely hard for Claude — use dedicated tools instead
5. Good token hygiene: concise prompts, relevant documents only, fresh conversations for new tasks

---

## Practical Exercise

Open a conversation in Claude Desktop (or start a Claude Code session) and have a long back-and-forth on a complex topic. After 15–20 exchanges, ask: *"Summarize the key points we've discussed so far and what decisions we've made."*

Notice how complete and accurate that summary is. This is a useful diagnostic — if Claude is losing track of earlier details, it is a sign to start a fresh conversation with a concise brief rather than continuing to build on a full context window.

---

*Complete the quiz below to proceed to Module 4.*

/**
 * rebuild_quizzes_graded.js
 *
 * 1. Generates polished, self-contained HTML quiz files for all 16 modules.
 *    Each file has full JavaScript grading: radio buttons, Check Answers, pass/fail, retake.
 * 2. Uploads each file to the SharePoint SiteAssets library.
 * 3. Updates each quiz page with a clean "Take Quiz" button linking to the file.
 *
 * Run: node rebuild_quizzes_graded.js
 */

const { chromium } = require('./playwright/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const AUTH_PATH = path.join(__dirname, 'playwright/auth/auth.json');
const SITE_URL = 'https://ialta.sharepoint.com/sites/CitizenAI';
const ASSETS_FOLDER = '/sites/CitizenAI/Shared Documents';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// ─── Quiz content ─────────────────────────────────────────────────────────────
// All questions written fresh — no parsing from SharePoint.

const MODULES = [
  {
    id: 34, moduleNum: 1, passingScore: 3,
    title: "Quiz — Module 1: What Claude Is (and Isn't)",
    nextUrl: `${SITE_URL}/SitePages/Module-2--How-the-Model-Was-Built.aspx`,
    questions: [
      {
        num: 1,
        text: "Which of the following best describes what Claude actually is?",
        choices: {
          A: "A search engine that retrieves and summarizes live web pages in real time",
          B: "A large language model trained to understand and generate text",
          C: "A database of facts that returns pre-stored, verified answers",
          D: "A human expert available on demand via a chat interface"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "You ask Claude about a news story that broke this morning. What should you expect?",
        choices: {
          A: "An accurate, real-time answer drawn from current news sources",
          B: "Claude will refuse to answer because it lacks internet access",
          C: "A response based on training data with a knowledge cutoff — it likely won't know today's events",
          D: "Claude will search its conversation history to find relevant information"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "Claude tells you it 'remembers' a conversation you had with it last month. What is most likely true?",
        choices: {
          A: "Claude has a long-term memory system that automatically stores all past conversations",
          B: "Someone pasted a summary of that prior conversation into the current session's context",
          C: "Claude recognised your writing style and reconstructed the earlier conversation",
          D: "Claude retrieved your account history from Anthropic's servers"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "Which of these is a fundamental characteristic of Claude's outputs that every user should understand?",
        choices: {
          A: "All Claude responses are fact-checked by Anthropic before being returned",
          B: "Claude can only generate responses in English",
          C: "Claude's outputs are probabilistic and may occasionally contain confident-sounding errors",
          D: "Claude cannot produce text longer than 500 words in a single response"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 17, moduleNum: 2, passingScore: 3,
    title: "Quiz — Module 2: How the Model Was Built",
    nextUrl: `${SITE_URL}/SitePages/Module-3--Tokens-—-The-Currency-of-AI.aspx`,
    questions: [
      {
        num: 1,
        text: "What is the primary source of Claude's knowledge?",
        choices: {
          A: "Live internet access that runs during every conversation",
          B: "A proprietary encyclopedia maintained by Anthropic subject-matter experts",
          C: "Training on large volumes of text data up to a knowledge cutoff date",
          D: "A structured database updated daily with new facts"
        },
        correct: 'C'
      },
      {
        num: 2,
        text: "What is Constitutional AI — the training approach Anthropic uses for Claude?",
        choices: {
          A: "A government-mandated compliance standard for AI systems in regulated industries",
          B: "A training method that uses a set of guiding principles to shape Claude's behaviour at scale",
          C: "A legal framework governing how Claude can be deployed in contracts and agreements",
          D: "A programming language used to write the underlying model code"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "In the context of Claude's training, what does RLHF (Reinforcement Learning from Human Feedback) mean?",
        choices: {
          A: "Claude updates its own weights in real time based on ratings you give during a conversation",
          B: "Robots complete tasks and Claude observes their performance to learn",
          C: "Human reviewers rate Claude's responses to signal which outputs are preferred, shaping future behaviour",
          D: "Claude is rewarded financially by Anthropic for every correct answer it produces"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "Why might Claude give a slightly different answer if you ask the same question twice in separate conversations?",
        choices: {
          A: "Claude deliberately varies answers to prevent users from simply memorising them",
          B: "Language model outputs are probabilistic — there is inherent variability in each generation",
          C: "Different data centres process different queries, and each centre has its own training",
          D: "Claude tracks prior conversations and intentionally avoids repeating itself"
        },
        correct: 'B'
      }
    ]
  },
  {
    id: 18, moduleNum: 3, passingScore: 3,
    title: "Quiz — Module 3: Tokens — The Currency of AI",
    nextUrl: `${SITE_URL}/SitePages/Module-4--The-Context-Window.aspx`,
    questions: [
      {
        num: 1,
        text: "What is a token in the context of a large language model like Claude?",
        choices: {
          A: "A security credential used to authenticate your session with the Claude API",
          B: "A unit of text — roughly a word or a word fragment — that the model processes",
          C: "A unit of currency that determines what you pay per message",
          D: "A special punctuation mark that signals the end of a Claude response"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "Roughly how many tokens would a 1,000-word document contain?",
        choices: {
          A: "Around 100 tokens",
          B: "Around 500 tokens",
          C: "Around 1,300 tokens",
          D: "Around 10,000 tokens"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "Why does understanding token count matter when working with Claude day-to-day?",
        choices: {
          A: "Token count determines how long Claude waits before generating a response",
          B: "Reducing token count improves Claude's accuracy on all tasks",
          C: "Claude's context window is measured in tokens, so very large inputs can hit limits or get truncated",
          D: "Only technical users interacting with the API need to care about tokens"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "Which of these inputs would consume the most tokens in a Claude conversation?",
        choices: {
          A: "A two-sentence follow-up question asking for clarification",
          B: "A single-word command such as 'Continue'",
          C: "A yes/no question",
          D: "A 20-page report you paste directly into the conversation"
        },
        correct: 'D'
      }
    ]
  },
  {
    id: 19, moduleNum: 4, passingScore: 3,
    title: "Quiz — Module 4: The Context Window",
    nextUrl: `${SITE_URL}/SitePages/Module-5--Why-Specificity-is-Everything.aspx`,
    questions: [
      {
        num: 1,
        text: "What is the context window in a large language model?",
        choices: {
          A: "The maximum image resolution Claude can analyse in a single request",
          B: "The total amount of text — both input and output — Claude can process in one session",
          C: "The length of time Claude retains your preferences between sessions",
          D: "The number of browser tabs Claude can access simultaneously via MCP"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "You have a long, productive conversation with Claude about a project on Monday. On Tuesday you open a new conversation. What happens?",
        choices: {
          A: "Claude automatically recalls the previous conversation from your account profile",
          B: "Claude summarises and stores Monday's conversation for future reference",
          C: "The prior conversation is gone — Claude starts the new session with no memory of it",
          D: "Claude emails you a summary of the previous conversation before the new session begins"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "What happens if a conversation grows longer than Claude's context window limit?",
        choices: {
          A: "Claude stops responding and asks you to start a new conversation",
          B: "Claude automatically compresses and summarises older exchanges to free space",
          C: "Older parts of the conversation may be dropped, affecting Claude's ability to reference them",
          D: "Claude seamlessly switches to a model with a larger context window"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "What is the most effective strategy for maintaining continuity on a multi-session project?",
        choices: {
          A: "Use only bullet points throughout the conversation to minimise token usage",
          B: "Begin each new session with a brief summary of key decisions and context from prior sessions",
          C: "Ask Claude to delete older messages from the conversation to free up context space",
          D: "Write shorter sentences so more of the conversation fits within the context window"
        },
        correct: 'B'
      }
    ]
  },
  {
    id: 20, moduleNum: 5, passingScore: 3,
    title: "Quiz — Module 5: Why Specificity is Everything",
    nextUrl: `${SITE_URL}/SitePages/Module-6--Anatomy-of-a-Good-Prompt.aspx`,
    questions: [
      {
        num: 1,
        text: "You send Claude the prompt: 'Help me with my email.' What is the most likely outcome?",
        choices: {
          A: "Claude writes a perfect email because it infers your intent from context",
          B: "Claude asks a series of clarifying questions before writing anything",
          C: "Claude produces a generic email template that may or may not fit your actual need",
          D: "Claude declines the request because it is too vague to act on"
        },
        correct: 'C'
      },
      {
        num: 2,
        text: "You ask Claude to analyse a complex strategic question and the response feels shallow and generic. What is the most likely cause?",
        choices: {
          A: "Claude is not capable of performing genuine strategic analysis",
          B: "The prompt lacked specific context, constraints, or framing to guide a deep response",
          C: "Claude deliberately simplifies complex topics to avoid making factual errors",
          D: "The conversation had grown too long and Claude ran out of context window space"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "Claude provides a specific statistic you plan to include in a client report. What should you do?",
        choices: {
          A: "Use it as written — Claude only cites statistics it has verified during training",
          B: "Independently verify the statistic before including it in any client-facing document",
          C: "Ask Claude to confirm the statistic once more in a follow-up message",
          D: "Use it only if Claude cited a named source in the same response"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "Which of the following prompts is most likely to produce a high-quality, immediately usable result?",
        choices: {
          A: "Write something about our Q3 results",
          B: "Summarise Q3",
          C: "Write a 3-paragraph executive summary of our Q3 results for the board. Highlight revenue growth, client retention, and one key risk. Tone: confident but candid. Audience: non-technical.",
          D: "Be specific about Q3 and make it good"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 21, moduleNum: 6, passingScore: 3,
    title: "Quiz — Module 6: Anatomy of a Good Prompt",
    nextUrl: `${SITE_URL}/SitePages/Module-7--Iteration,-Examples,-and-Getting-to-Great.aspx`,
    questions: [
      {
        num: 1,
        text: "Which component of a well-constructed prompt tells Claude what role or expertise to adopt?",
        choices: {
          A: "The task instruction — the specific action you want Claude to perform",
          B: "The persona or role framing — e.g. 'You are a senior financial analyst'",
          C: "The output format specification — e.g. 'respond in bullet points'",
          D: "The constraint list — e.g. 'keep it under 200 words'"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "You need Claude to draft a concise client-facing memo. Which prompt addition would most improve the output?",
        choices: {
          A: "Adding the word 'professional' to the prompt",
          B: "Specifying 'use formal English'",
          C: "Including the audience, purpose, structure, and tone: e.g. 'CFO audience, 3-paragraph memo, clear ask in the final paragraph, confident tone'",
          D: "Asking Claude to 'write a good memo'"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "What is the main purpose of including an example output in your prompt?",
        choices: {
          A: "To save Claude from having to think about appropriate formatting",
          B: "To demonstrate the exact style, tone, length, or structure you expect in the response",
          C: "To increase the prompt's token count so Claude treats the request as higher priority",
          D: "To prove your expertise to Claude so it adjusts its reading level accordingly"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "Which element is most often missing from prompts that produce poor or off-target results?",
        choices: {
          A: "A question mark at the end of the prompt",
          B: "A specific word count requirement",
          C: "Context about the intended audience, purpose, or constraints of the task",
          D: "A polite phrase such as 'please' or 'thank you'"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 22, moduleNum: 7, passingScore: 3,
    title: "Quiz — Module 7: Iteration, Examples, and Getting to Great",
    nextUrl: `${SITE_URL}/SitePages/Module-8--Tips,-Tricks,-and-Power-User-Habits.aspx`,
    questions: [
      {
        num: 1,
        text: "Claude gives you a mediocre first response. What is the most effective next step?",
        choices: {
          A: "Open a new conversation and submit the exact same prompt again",
          B: "Tell Claude the response was bad and ask it to 'try harder'",
          C: "Refine your prompt with specific feedback about what was missing, off, or needs changing",
          D: "Accept the output and manually edit it — Claude rarely improves on feedback"
        },
        correct: 'C'
      },
      {
        num: 2,
        text: "What is few-shot prompting?",
        choices: {
          A: "Providing Claude with only a small amount of context to conserve tokens",
          B: "Providing one or more examples of the desired input-output pattern before your actual request",
          C: "Using Claude only for quick, low-stakes tasks where mistakes don't matter",
          D: "Sending multiple short messages instead of one long, structured prompt"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "You ask Claude to rewrite a paragraph and it changes the intended meaning. The most effective follow-up is:",
        choices: {
          A: "'That's wrong, do it again'",
          B: "'Rewrite the paragraph, keeping the original meaning exactly — improve only clarity and sentence flow'",
          C: "'Do better'",
          D: "Opening a new conversation and pasting the paragraph with no other changes"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "When is task chaining — breaking work into sequential Claude requests — most valuable?",
        choices: {
          A: "When you want Claude to appear to have done more work on a project",
          B: "When a complex task has distinct stages that each benefit from focused, targeted prompting",
          C: "When you want to maximise how many tokens you use in a session",
          D: "Only when Claude fails to complete a task in a single response"
        },
        correct: 'B'
      }
    ]
  },
  {
    id: 23, moduleNum: 8, passingScore: 4,
    title: "Quiz — Module 8: Tips, Tricks, and Power User Habits",
    nextUrl: `${SITE_URL}/SitePages/Module-9--The-Operating-Framework.aspx`,
    questions: [
      {
        num: 1,
        text: "What is a system prompt in Claude's operating model?",
        choices: {
          A: "A technical command used by IT to configure Claude's underlying server behaviour",
          B: "Standing instructions set at the start of a session that shape Claude's behaviour throughout",
          C: "A special phrase that bypasses Claude's safety guidelines for advanced users",
          D: "A template automatically generated by Claude for repetitive task types"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "You frequently ask Claude to format its output as structured JSON. What is the most efficient way to ensure this every time?",
        choices: {
          A: "Append 'Please use JSON format' to the end of every prompt you send",
          B: "Give feedback each session until Claude learns your preference over time",
          C: "Include a formatting instruction in a reusable project prompt or system prompt so it applies automatically",
          D: "Use the API exclusively, which always returns responses in JSON by default"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "What habit most distinguishes power users of Claude from casual users?",
        choices: {
          A: "Writing longer prompts for every request regardless of complexity",
          B: "Requiring Claude to use formal language at all times",
          C: "Treating Claude as a thinking partner — iterating, building, and refining rather than accepting the first output",
          D: "Always starting a fresh conversation for each individual task"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "What does it mean to 'ground' Claude in your task before asking it to act?",
        choices: {
          A: "Preventing Claude from accessing any external tools or data sources during the session",
          B: "Providing Claude with the relevant documents, data, or context it needs before asking it to perform the task",
          C: "Instructing Claude to stick exclusively to verified factual statements",
          D: "Limiting Claude to a single topic per conversation session"
        },
        correct: 'B'
      },
      {
        num: 5,
        text: "Why is asking Claude to 'think step by step' or 'show your reasoning' often useful for complex tasks?",
        choices: {
          A: "It forces Claude to use more tokens, which correlates with more accurate responses",
          B: "It gives Claude explicit permission to use more of its available context window",
          C: "It helps Claude work through problems more carefully and makes errors easier to identify before you act",
          D: "It prevents Claude from drawing on its training data and forces original thinking"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 24, moduleNum: 9, passingScore: 3,
    title: "Quiz — Module 9: The Operating Framework",
    nextUrl: `${SITE_URL}/SitePages/Module-10--Claude-Desktop-Projects.aspx`,
    questions: [
      {
        num: 1,
        text: "In the Driving Zones framework, what is the primary factor that determines which zone a task falls into?",
        choices: {
          A: "The complexity and estimated time required to complete the task",
          B: "The seniority of the employee initiating the task",
          C: "The classification of the data being used or processed in the task",
          D: "Whether Claude is being used on a mobile device or a desktop"
        },
        correct: 'C'
      },
      {
        num: 2,
        text: "Which of these tasks is clearly Zone 3 (Highway) and requires manager review before proceeding?",
        choices: {
          A: "Asking Claude to summarise a publicly available industry report",
          B: "Using Claude to draft a personal learning plan based on public course descriptions",
          C: "Using Claude with the Playwright MCP server to automate actions on a client-facing live system",
          D: "Asking Claude to improve the grammar of a personal email draft"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "A colleague wants to run Zone 2 work through Claude.ai in their personal browser rather than Claude Desktop. What is the problem?",
        choices: {
          A: "Claude.ai has a significantly smaller context window than Claude Desktop",
          B: "Claude.ai does not support document or file uploads",
          C: "Claude.ai does not have the program's managed settings, MCP allowlist controls, or safety hooks",
          D: "Claude.ai produces lower-quality outputs than Claude Desktop for internal tasks"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "What should you do if you are genuinely unsure which zone your task falls into?",
        choices: {
          A: "Default to Zone 1 to avoid creating unnecessary process overhead",
          B: "Ask a colleague who uses Claude more frequently for their informal opinion",
          C: "Apply the next zone up — use the stricter governance level until you can confirm",
          D: "Proceed without a classification and document your reasoning afterwards"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 25, moduleNum: 10, passingScore: 3,
    title: "Quiz — Module 10: Claude Desktop Projects",
    nextUrl: `${SITE_URL}/SitePages/Module-11--Documents,-Images,-and-Multimodal-Input.aspx`,
    questions: [
      {
        num: 1,
        text: "What is the key advantage of using Claude's Projects feature over a standard conversation?",
        choices: {
          A: "Projects give you access to a faster, more capable version of Claude",
          B: "Projects provide a persistent set of instructions and context that automatically applies across multiple conversations",
          C: "Projects allow multiple team members to chat with Claude in the same session simultaneously",
          D: "Projects unlock premium features that are otherwise unavailable in standard conversations"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "You are building a recurring research workflow in Claude. Where should you store your standing instructions — persona, output format, constraints?",
        choices: {
          A: "Paste them at the beginning of every new conversation manually",
          B: "In the project's system prompt or custom instructions, so they apply automatically to every conversation in that project",
          C: "In a separate document that you attach to each conversation as a file",
          D: "In the conversation title field so Claude can reference them as a heading"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "What happens to context when you start a new conversation within an existing Claude Project?",
        choices: {
          A: "All previous conversations in the project are fully visible to Claude in the new session",
          B: "The project instructions and custom context persist, but the conversation context window starts fresh",
          C: "Claude automatically summarises all prior project conversations and prepends them to the new session",
          D: "Nothing is preserved — Projects and standard conversations behave identically"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "Which type of use case is the Projects feature best suited for?",
        choices: {
          A: "A one-off question you will ask once and never return to",
          B: "Sharing real-time context between two colleagues during the same Claude conversation",
          C: "Tasks that require Claude to access live data from the internet on demand",
          D: "A recurring work stream where Claude benefits from knowing your role, preferences, and ongoing context"
        },
        correct: 'D'
      }
    ]
  },
  {
    id: 26, moduleNum: 11, passingScore: 3,
    title: "Quiz — Module 11: Documents, Images, and Multimodal Input",
    nextUrl: `${SITE_URL}/SitePages/Module-12--Claude-for-Your-Team.aspx`,
    questions: [
      {
        num: 1,
        text: "You upload a 40-page PDF to Claude and ask a question about content on page 32. What is most important to understand?",
        choices: {
          A: "Claude can only read the first 10 pages of any uploaded document",
          B: "Claude reads the entire document and loads it into its context window — very large files may approach context limits",
          C: "Claude scans the document for keywords rather than reading it sequentially",
          D: "Claude converts the PDF to images before reading, which adds significant processing time"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "Which of these is a valid and practical use of Claude's image analysis capability?",
        choices: {
          A: "Asking Claude to edit an image's colours and save the modified version to your desktop",
          B: "Uploading a screenshot of a data dashboard and asking Claude to identify patterns and anomalies",
          C: "Using Claude to record a video of your screen and describe its contents",
          D: "Asking Claude to automatically capture a photo of your desktop on demand"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "What data classification consideration must you apply before uploading any document to Claude?",
        choices: {
          A: "Claude automatically classifies the data sensitivity of uploaded documents before processing them",
          B: "The data classification of the document determines which Driving Zone applies to the task",
          C: "All uploaded documents default to Zone 1 regardless of their actual content",
          D: "Only documents larger than 10MB require a formal zone classification"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "You paste a client contract into Claude and ask it to identify key obligations. Which Driving Zone does this task fall into?",
        choices: {
          A: "Zone 1, because you are only asking Claude to read and summarise text",
          B: "Zone 2, because the contract is an internal business document",
          C: "Zone 3, because the contract contains confidential client information",
          D: "No-Drive Zone, because client contracts must never be processed using AI tools"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 27, moduleNum: 12, passingScore: 3,
    title: "Quiz — Module 12: Claude for Your Team",
    nextUrl: `${SITE_URL}/SitePages/Module-13--Safety-and-Responsible-Use.aspx`,
    questions: [
      {
        num: 1,
        text: "What does the Claude Teams plan provide that an individual or personal plan does not?",
        choices: {
          A: "Access to a fundamentally different, more powerful version of Claude",
          B: "Organisation-level controls, a commitment to zero data retention for training, and centralised billing",
          C: "Unlimited messages with no context window constraints",
          D: "Automatic native integration with all Microsoft 365 applications"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "Which is a critical data privacy benefit of using Claude Teams for company work?",
        choices: {
          A: "Team members can share conversation histories with each other in real time",
          B: "Anthropic does not use your organisation's conversations to train its future models",
          C: "Claude Teams includes a built-in secure email client for sending outputs directly to stakeholders",
          D: "All team members share a single large pooled context window across all their conversations"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "An employee wants to use their personal free Claude.ai account for company work because it appears to have the same features. What is the key risk?",
        choices: {
          A: "Personal accounts produce noticeably lower-quality responses than Teams accounts",
          B: "Personal accounts are restricted to 10 messages per day and cannot handle long documents",
          C: "Personal accounts may allow Anthropic to use conversation data for training and lack the company's organisational controls",
          D: "Personal accounts do not support file uploads or image analysis"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "Before sharing a Claude-generated output with an external client, what should you always do?",
        choices: {
          A: "Ask Claude to verify the accuracy of its own output in a follow-up message",
          B: "Review and independently verify the content — Claude can produce confident but incorrect information",
          C: "Run the output through a second AI system to cross-check the facts",
          D: "Submit the output to IT Security for approval before sending"
        },
        correct: 'B'
      }
    ]
  },
  {
    id: 28, moduleNum: 13, passingScore: 4,
    title: "Quiz — Module 13: Safety and Responsible Use",
    nextUrl: `${SITE_URL}/SitePages/Module-14--MCP,-Agents,-and-RAG.aspx`,
    questions: [
      {
        num: 1,
        text: "What is prompt injection, and why is it a risk for AI users?",
        choices: {
          A: "A technique for writing more effective prompts by embedding hidden performance-boosting instructions",
          B: "An attack pattern where malicious text in external content attempts to override Claude's operating instructions",
          C: "A method of injecting company-specific data directly into Claude's underlying training data",
          D: "A way to bypass Claude's token limit by embedding compressed instructions in a prompt"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "You use the Playwright MCP server to have Claude automate browser tasks across multiple websites. What specific risk is elevated?",
        choices: {
          A: "Claude may accidentally close browser tabs that are needed for other work",
          B: "Content on websites visited may contain hidden text specifically designed to inject malicious instructions into Claude's behaviour",
          C: "Playwright uses significantly more tokens per action than all other MCP servers",
          D: "Claude may automatically download and execute files without requesting your permission"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "Which of these scenarios represents a No-Drive Zone violation?",
        choices: {
          A: "Using Claude Desktop to summarise a publicly available industry research report",
          B: "Using your personal Claude.ai browser session to process internal company data instead of Claude Desktop",
          C: "Asking Claude to help draft a follow-up email based on your own meeting notes",
          D: "Using Claude Desktop with the pre-approved MCP servers to research a presentation topic"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "An AI model gives a confident, well-structured answer that turns out to be factually incorrect. What is this phenomenon called?",
        choices: {
          A: "A context overflow error caused by too much information in the prompt",
          B: "A temperature error caused by the model's randomness settings",
          C: "Hallucination — when an AI generates plausible-sounding but factually incorrect information",
          D: "A training data gap that can be fixed by retraining the model"
        },
        correct: 'C'
      },
      {
        num: 5,
        text: "If you suspect Claude has generated output that contains confidential information it should not have produced, what is the correct first action?",
        choices: {
          A: "Delete the conversation immediately and do not mention it to anyone",
          B: "Stop, preserve the conversation without deleting anything, and report it to IT Security the same business day",
          C: "Ask Claude to remove the sensitive content from its memory and regenerate the response",
          D: "Forward the output to your manager so they can decide whether it constitutes a real incident"
        },
        correct: 'B'
      }
    ]
  },
  {
    id: 29, moduleNum: 14, passingScore: 4,
    title: "Quiz — Module 14: MCP, Agents, and RAG",
    nextUrl: `${SITE_URL}/SitePages/Module-15--GitHub-—-The-Collaboration-Layer.aspx`,
    questions: [
      {
        num: 1,
        text: "What does MCP (Model Context Protocol) enable in the context of Claude?",
        choices: {
          A: "A method for compressing long conversations so more content fits in the context window",
          B: "A standardised way to connect Claude to external tools, data sources, and live services",
          C: "A security protocol for encrypting all Claude conversations end-to-end",
          D: "A framework that allows multiple AI models to communicate and collaborate with each other"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "In an agentic workflow, Claude takes a series of autonomous actions to complete a complex task. What is the most important safety consideration?",
        choices: {
          A: "Ensuring Claude uses the fastest available MCP server to minimise total processing time",
          B: "Restricting Claude to tasks that can be completed in fewer than ten sequential steps",
          C: "Maintaining meaningful human oversight at key decision points, especially before irreversible actions",
          D: "Scheduling all agentic tasks to run only during standard business hours"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "What is RAG (Retrieval-Augmented Generation)?",
        choices: {
          A: "A permanent fine-tuning technique that trains Claude on your organisation's internal documents",
          B: "A method where relevant documents are retrieved and added to Claude's context window before it generates a response",
          C: "A feature that allows Claude to automatically regenerate its response if the first output is unsatisfactory",
          D: "A security control that prevents Claude from accessing certain categories of sensitive data"
        },
        correct: 'B'
      },
      {
        num: 4,
        text: "Which MCP server automatically elevates any task to Zone 3 governance, regardless of the data involved?",
        choices: {
          A: "A calculator MCP server that performs arithmetic operations",
          B: "A file-reading MCP server that accesses local documents on your machine",
          C: "A weather API MCP server that retrieves public forecast data",
          D: "The Playwright MCP server for automating browser-based actions"
        },
        correct: 'D'
      },
      {
        num: 5,
        text: "What is the primary risk of giving Claude broad autonomous tool access without clearly defined constraints?",
        choices: {
          A: "Claude will complete tasks too quickly and miss important nuances along the way",
          B: "Claude may take actions that are difficult or impossible to reverse without receiving explicit human approval first",
          C: "Claude will ask for confirmation at every step, making the workflow impractically slow",
          D: "The connected MCP servers will consume excessive API tokens, increasing operating costs"
        },
        correct: 'B'
      }
    ]
  },
  {
    id: 30, moduleNum: 15, passingScore: 3,
    title: "Quiz — Module 15: GitHub — The Collaboration Layer",
    nextUrl: `${SITE_URL}/SitePages/Module-16--Databases-and-Data-Storage.aspx`,
    questions: [
      {
        num: 1,
        text: "Why is GitHub used as the log of record for all Citizen AI Engineer work — including Zone 1 learning tasks?",
        choices: {
          A: "GitHub automatically evaluates and scores the quality of AI-assisted code submissions",
          B: "GitHub provides a versioned, transparent audit trail of all citizen activity that Highlander can track and attribute to OKRs",
          C: "GitHub is a contractual requirement from Anthropic as a condition of the Claude Teams licence",
          D: "GitHub is the only tool that integrates natively with Claude Desktop via an approved MCP server"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "What is the purpose of the METADATA.yaml file in a citizen AI repo?",
        choices: {
          A: "It contains Claude's system prompt instructions for each project in the repo",
          B: "It links the project to a specific OKR so Highlander can attribute the work's value to programme outcomes",
          C: "It stores API keys and credentials needed to connect to approved MCP servers",
          D: "It defines and enforces which Driving Zone the project operates in"
        },
        correct: 'B'
      },
      {
        num: 3,
        text: "What naming convention should citizen AI repos follow?",
        choices: {
          A: "Any descriptive name chosen freely by the citizen creating the repo",
          B: "The employee's name followed by a brief project description",
          C: "`citizen-<team>-<project>` — for example, `citizen-finance-invoice-automation`",
          D: "The OKR code followed by the project title in full"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "How frequently should citizens push commits to their GitHub repos when actively working on a project?",
        choices: {
          A: "Only when the project has been fully completed and validated",
          B: "Only when Claude Code explicitly generates a final, production-ready output",
          C: "At minimum weekly — frequent commits ensure Highlander captures all programme activity for OKR attribution",
          D: "Daily without exception, even if no meaningful progress has been made that day"
        },
        correct: 'C'
      }
    ]
  },
  {
    id: 31, moduleNum: 16, passingScore: 3,
    title: "Quiz — Module 16: Databases and Data Storage",
    nextUrl: null,
    questions: [
      {
        num: 1,
        text: "What is the most important consideration before connecting Claude to a company database via an MCP server?",
        choices: {
          A: "Ensuring Claude has the fastest possible read speed for the database technology in use",
          B: "Confirming the data classification of the database content and applying the corresponding Driving Zone governance",
          C: "Asking IT to create a dedicated read-only database user for Claude before connecting",
          D: "Verifying that the database uses SQL rather than a NoSQL schema"
        },
        correct: 'B'
      },
      {
        num: 2,
        text: "Why is read-only database access generally preferred over read-write access when connecting Claude via MCP?",
        choices: {
          A: "Read-only connections are significantly faster than read-write connections for Claude's queries",
          B: "Claude cannot correctly process or generate valid write operations for most database schemas",
          C: "Limiting Claude to read access prevents it from accidentally modifying or deleting business-critical data",
          D: "Read-only connections automatically satisfy Zone 3 governance requirements without additional approval"
        },
        correct: 'C'
      },
      {
        num: 3,
        text: "You want to use Claude to analyse patterns in your company's CRM data. What is the correct first step?",
        choices: {
          A: "Export all CRM records to a CSV file and paste the full dataset into a Claude conversation",
          B: "Connect Claude directly to the CRM using a community-maintained MCP server you found online",
          C: "Determine the data classification of the CRM data and identify the required zone and approvals before proceeding",
          D: "Ask your manager whether Claude is 'allowed' to access CRM data and proceed based on their reply"
        },
        correct: 'C'
      },
      {
        num: 4,
        text: "What risk does poorly labelled or unstructured data create when used with Claude?",
        choices: {
          A: "Claude will refuse to process data that is not formatted to a recognised standard",
          B: "Claude may misclassify the data's sensitivity level and inadvertently apply an incorrect governance framework",
          C: "Claude may produce outputs built on false assumptions about what the data actually represents",
          D: "Claude may automatically share the data with other authenticated team members in your organisation"
        },
        correct: 'C'
      }
    ]
  }
];

// ─── Generate self-contained quiz HTML ────────────────────────────────────────

function generateQuizHTML(mod) {
  const answerMap = {};
  mod.questions.forEach(q => { answerMap[q.num] = q.correct; });

  const questionsHtml = mod.questions.map(q => {
    const choicesHtml = Object.entries(q.choices)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, text]) => `
        <div class="choice">
          <input type="radio" name="q${q.num}" id="q${q.num}${letter.toLowerCase()}" value="${letter}">
          <label for="q${q.num}${letter.toLowerCase()}"><strong>${letter})</strong> ${text}</label>
        </div>`).join('');

    return `
      <div class="question">
        <div class="q-num">Question ${q.num}</div>
        <div class="q-text">${q.text}</div>
        ${choicesHtml}
      </div>
      <div class="divider"></div>`;
  }).join('');

  const answersJson = JSON.stringify(answerMap);

  // SP completion form URL — Module pre-filled, Source redirects to next module after Save
  const moduleTitle = mod.title.replace(/^Quiz\s+\u2014\s+Module\s+\d+:\s+/, '');
  const moduleChoiceValue = encodeURIComponent(`Module ${mod.moduleNum} \u2014 ${moduleTitle}`);
  const sourceUrl = mod.nextUrl || `https://ialta.sharepoint.com/sites/CitizenAI`;
  const SP_FORM_URL = `https://ialta.sharepoint.com/sites/CitizenAI/Lists/Quiz%20Completions/NewForm.aspx?ModuleCompleted=${moduleChoiceValue}&Source=${encodeURIComponent(sourceUrl)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${mod.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
    background: #fff;
    color: #1a1a2e;
    padding: 28px 32px 40px;
    line-height: 1.55;
    font-size: 15px;
  }
  .quiz-header { margin-bottom: 24px; }
  .quiz-header h1 { font-size: 20px; font-weight: 700; color: #000D2D; margin-bottom: 6px; }
  .quiz-meta { font-size: 13px; color: #555; margin-bottom: 4px; }
  .quiz-intro {
    background: #eef2ff;
    border-left: 4px solid #0042E0;
    padding: 12px 16px;
    font-size: 14px;
    margin: 16px 0 24px;
    border-radius: 0 4px 4px 0;
    color: #222;
  }
  .divider { border: none; border-top: 1px solid #eaeaea; margin: 0 0 22px; }
  .question { margin-bottom: 16px; }
  .q-num { font-weight: 700; font-size: 14px; color: #000D2D; margin-bottom: 6px; }
  .q-text { margin-bottom: 12px; font-size: 15px; color: #1a1a2e; }
  .choice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid #dde3f0;
    border-radius: 4px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .choice:hover { background: #f0f4ff; border-color: #b0bef5; }
  .choice input[type="radio"] { margin-top: 3px; accent-color: #0042E0; flex-shrink: 0; }
  .choice label { cursor: pointer; font-size: 14px; line-height: 1.45; }
  .choice label strong { color: #0042E0; margin-right: 2px; }
  .action-row { margin: 28px 0 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .btn-check {
    background: #0042E0;
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    padding: 12px 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-check:hover { background: #0036c2; }
  .btn-retake {
    background: #fff;
    color: #0042E0;
    font-weight: 600;
    font-size: 14px;
    padding: 10px 22px;
    border: 1.5px solid #0042E0;
    border-radius: 4px;
    cursor: pointer;
    display: none;
    transition: background 0.15s;
  }
  .btn-retake:hover { background: #eef2ff; }
  .result {
    display: none;
    padding: 20px 24px;
    border-radius: 4px;
    margin-top: 4px;
  }
  .result.pass { background: #d4f4e2; border: 1.5px solid #1a9e5c; color: #0a4d29; }
  .result.fail { background: #fde8e8; border: 1.5px solid #d63031; color: #7b0d0d; }
  .result-title { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
  .result-detail { font-size: 14px; margin-bottom: 0; }
  .confirm-section {
    display: none;
    margin-top: 20px;
  }
  .btn-save {
    display: inline-block;
    background: #0042E0;
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    padding: 11px 26px;
    border-radius: 4px;
    text-decoration: none;
    transition: background 0.15s;
  }
  .btn-save:hover { background: #0036c2; }
</style>
</head>
<body>

<div class="quiz-header">
  <h1>${mod.title}</h1>
  <p class="quiz-meta">
    <strong>Passing score:</strong> ${mod.passingScore}/${mod.questions.length} &nbsp;|&nbsp;
    <strong>Attempts:</strong> Unlimited &nbsp;|&nbsp;
    <strong>Format:</strong> Multiple choice
  </p>
</div>

<div class="quiz-intro">
  Select the best answer for each question, then click <strong>Check My Answers</strong>.
  Your score appears instantly. Need to review? Click <strong>Retake</strong> to try again — no limit on attempts.
</div>

<div class="divider"></div>

${questionsHtml}

<div class="action-row">
  <button class="btn-check" id="btn-check" onclick="checkAnswers()">Check My Answers</button>
  <button class="btn-retake" id="btn-retake" onclick="retake()">Retake Quiz</button>
</div>

<div class="result" id="result"></div>

<div class="confirm-section" id="confirm-section">
  <a class="btn-save" id="btn-save" href="${SP_FORM_URL}">Log Completion &amp; Continue &rarr;</a>
</div>

<script>
var ANSWERS = ${answersJson};
var PASSING = ${mod.passingScore};
var TOTAL = ${mod.questions.length};

function checkAnswers() {
  var score = 0;
  for (var q in ANSWERS) {
    var sel = document.querySelector('input[name="q' + q + '"]:checked');
    if (!sel) {
      alert('Please answer all ' + TOTAL + ' questions before checking your score.');
      return;
    }
    if (sel.value === ANSWERS[q]) score++;
  }
  var passed = score >= PASSING;
  var box = document.getElementById('result');
  box.className = 'result ' + (passed ? 'pass' : 'fail');
  box.style.display = 'block';
  if (passed) {
    box.innerHTML = '<div class="result-title">&#10003; Passed &mdash; ' + score + '/' + TOTAL + ' correct</div>'
      + '<p class="result-detail">Well done. Enter your name on the next screen to log your completion, then you\\'ll be taken to the next module.</p>';
    document.getElementById('btn-check').style.display = 'none';
    document.getElementById('confirm-section').style.display = 'block';
  } else {
    box.innerHTML = '<div class="result-title">&#10007; Not passed &mdash; ' + score + '/' + TOTAL + ' correct (need ' + PASSING + ')</div>'
      + '<p class="result-detail">Review the module content and try again &mdash; there is no penalty for retaking.</p>';
    document.getElementById('btn-retake').style.display = 'inline-block';
    document.getElementById('btn-check').style.display = 'none';
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function retake() {
  document.querySelectorAll('input[type="radio"]').forEach(function(r) { r.checked = false; });
  var box = document.getElementById('result');
  box.style.display = 'none';
  box.className = 'result';
  document.getElementById('confirm-section').style.display = 'none';
  document.getElementById('btn-retake').style.display = 'none';
  document.getElementById('btn-check').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

</body>
</html>`;
}

// ─── Upload HTML file to SharePoint SiteAssets ────────────────────────────────

async function uploadToSiteAssets(page, filename, content) {
  return page.evaluate(async ({ siteUrl, folder, filename, content }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);

    const res = await fetch(
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folder)}')/files/add(url='${filename}',overwrite=true)`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'Content-Type': 'application/octet-stream',
        },
        body: bytes,
      }
    );
    if (!res.ok) return { ok: false, status: res.status };
    const d = await res.json();
    return { ok: true, url: d.d.ServerRelativeUrl };
  }, { siteUrl: SITE_URL, folder: ASSETS_FOLDER, filename, content });
}

// ─── Build SharePoint quiz page HTML (intro + link to the graded quiz) ────────

function buildSpPageHTML(mod, quizFileUrl) {
  // quizFileUrl is a server-relative path like /sites/CitizenAI/Shared Documents/quiz-module-1.html
  const fullUrl = `https://ialta.sharepoint.com${quizFileUrl}`;
  const nextLink = mod.nextUrl
    ? `<p style="margin-top:20px;"><a href="${mod.nextUrl}" style="color:#0042E0;">→ Continue to the next module after you pass</a></p>`
    : `<p style="margin-top:20px;font-style:italic;color:#555;">You've completed all module quizzes.</p>`;

  return `
<h1>${mod.title}</h1>
<p>
  <strong>Passing score:</strong> ${mod.passingScore}/${mod.questions.length} &nbsp;|&nbsp;
  <strong>Attempts:</strong> Unlimited &nbsp;|&nbsp;
  <strong>Format:</strong> Multiple choice (auto-graded)
</p>
<hr>
<p style="background:#eef2ff;border-left:4px solid #0042E0;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0;">
  The quiz is auto-graded and shows your score immediately. If you don't pass, click <strong>Retake</strong> — there is no limit on attempts.
</p>

<div style="margin:28px 0;padding:28px 24px;background:#000D2D;text-align:center;border-radius:4px;">
  <p style="color:#aac4ff;margin-bottom:14px;font-size:14px;">Opens in the same tab. Use your browser Back button to return here.</p>
  <a href="${fullUrl}" style="display:inline-block;background:#0042E0;color:white;font-weight:700;font-size:19px;padding:14px 36px;border-radius:4px;text-decoration:none;">
    Take Quiz ${mod.moduleNum} &rarr;
  </a>
  <p style="color:#aac4ff;margin-top:10px;font-size:13px;">Need ${mod.passingScore} or more correct to pass.</p>
</div>

${nextLink}
`;
}

// ─── Save SharePoint page ──────────────────────────────────────────────────────

async function saveSpPage(page, pageId, html) {
  return page.evaluate(async ({ siteUrl, pageId, html }) => {
    const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose' },
    });
    const digest = (await digestRes.json()).d.GetContextWebInformation.FormDigestValue;
    const canvas = [{
      position: { zoneIndex: 1, sectionIndex: 1, sectionFactor: 12, layoutIndex: 1 },
      controlType: 4, id: `quiz-content-${pageId}`, innerHTML: html, editorType: 'CKEditor',
    }];
    await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    const s = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*',
      },
      body: JSON.stringify({ __metadata: { type: 'SP.Publishing.SitePage' }, CanvasContent1: JSON.stringify(canvas) }),
    });
    if (!s.ok) return `save_failed_${s.status}`;
    const p = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
      method: 'POST', headers: { Accept: 'application/json;odata=verbose', 'X-RequestDigest': digest },
    });
    return p.ok ? 'published' : `publish_error_${p.status}`;
  }, { siteUrl: SITE_URL, pageId, html });
}

// ─── Ensure SiteAssets folder exists ──────────────────────────────────────────

async function ensureSiteAssetsFolder(page) {
  return page.evaluate(async ({ siteUrl, folder }) => {
    const res = await fetch(`${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folder)}')`, {
      headers: { Accept: 'application/json;odata=verbose' },
    });
    return res.ok ? 'exists' : `status_${res.status}`;
  }, { siteUrl: SITE_URL, folder: ASSETS_FOLDER });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_PATH });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  log('SharePoint authenticated');

  const folderStatus = await ensureSiteAssetsFolder(page);
  log(`SiteAssets folder: ${folderStatus}`);

  let ok = 0, fail = 0;

  for (const mod of MODULES) {
    log(`\n── Module ${mod.moduleNum}: ${mod.title}`);

    // 1. Generate HTML
    const html = generateQuizHTML(mod);
    const filename = `quiz-module-${mod.moduleNum}.html`;

    // 2. Upload to SiteAssets
    const upload = await uploadToSiteAssets(page, filename, html);
    if (!upload.ok) {
      log(`  ✗ Upload failed (HTTP ${upload.status})`);
      fail++;
      continue;
    }
    log(`  ✓ Uploaded: ${upload.url}`);

    // 3. Update SharePoint quiz page
    const spHtml = buildSpPageHTML(mod, upload.url);
    const result = await saveSpPage(page, mod.id, spHtml);
    log(`  SP page ${mod.id}: ${result}`);

    if (result === 'published') ok++;
    else fail++;

    await new Promise(r => setTimeout(r, 400));
  }

  log(`\n═══ DONE: ${ok} published, ${fail} failed ═══`);
  await browser.close();
})();

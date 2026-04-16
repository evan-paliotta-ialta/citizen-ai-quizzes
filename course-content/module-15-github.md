# Module 15: GitHub — The Collaboration Layer

**Track**: Citizen Developer
**Estimated reading time**: 13 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Navigate a GitHub repository to find, read, and use what is there
- Explain commits, branches, pull requests, and pushes in plain language
- Understand why code lives in GitHub while databases do not
- Use GitHub to find public AI frameworks, skill files, and prompt libraries

---

## Why Non-Technical People Need to Know GitHub

A few years ago, GitHub was a developer-only tool. That is no longer true.

Today, virtually every AI framework, prompt library, MCP server, agent configuration, and skill file lives on GitHub. The public AI developer community is extraordinarily open — people share their best tools, prompts, and configurations publicly.

If you cannot navigate GitHub, you cannot access any of it. You are limited to what is described in articles and blog posts rather than the actual, usable files behind them.

This module does not make you a developer. It makes you a citizen developer — someone who can find, read, use, and eventually contribute to the tools that professional developers build in the open.

---

## What Is GitHub?

GitHub is the world's largest platform for storing, sharing, and collaborating on code and technical projects. At its core, it is a cloud-based file storage and version control system.

The "version control" part is what makes it different from SharePoint or Google Drive. GitHub does not just store files — it tracks every single change ever made to every file, who made it, when, and why. You can go back to any point in a project's history, compare any two versions, and understand exactly how a project evolved.

---

## The Core Concepts

**Repository (Repo)**

A repository is a folder for a project, stored on GitHub, that tracks all its files and their complete history.

Think of it as a project folder with a complete audit trail. Every AI tool you will want to use has a repository as its home: `github.com/anthropics/anthropic-cookbook`, for example, is the repository for Anthropic's official collection of Claude usage examples.

Repositories can be:
- **Public**: anyone can see and download the files
- **Private**: only invited collaborators can access them

Most of the AI resources you will want are in public repositories.

---

**Clone**

Cloning is downloading a complete copy of a repository to your computer. Once cloned, you have all the files locally and can run, modify, or read them.

*"I cloned that repo"* = *"I downloaded a local copy of that project."*

---

**Fork**

Forking creates your own copy of someone else's repository on your GitHub account. You can then modify your fork without affecting the original.

Used when you want to customize a public tool — you fork it, adapt it for your needs, and your version lives separately from the original.

---

**Commit**

A commit is a saved snapshot of changes, with a message explaining what changed and why.

Think of it as hitting Save — but every save is permanent, labeled, and reversible. A commit message looks like: *"Add email outreach prompt template for CS team"* or *"Fix hallucination in objection handling module."*

Good commit messages are short, specific, and written in the present tense: *"Add X"*, *"Fix Y"*, *"Update Z."*

Every commit is part of the permanent, traceable history. You can always roll back to any previous commit if something goes wrong.

---

**Branch**

A branch is a parallel version of a repository where you can make changes without affecting the main version.

The main branch (usually called `main` or `master`) is the stable, production version. When someone wants to make changes — add a feature, fix a bug, update a document — they create a new branch, do their work there, and then merge it back when it is ready.

Analogy: a branch is like a personal draft copy of a document. You edit your copy without changing the shared version. When you are done, you propose merging your changes in.

---

**Push**

Pushing uploads your local commits to GitHub. Until you push, your changes only exist on your computer.

*"I pushed my changes"* = *"I synced my local work to the cloud."*

---

**Pull Request (PR)**

A Pull Request is a formal proposal to merge changes from one branch into another (usually into `main`).

A PR includes:
- A title and description of what changed and why
- The actual file changes (additions, modifications, deletions)
- A space for teammates to review, comment, and approve

A PR is reviewed before it is merged. This is how teams collaborate on shared work without stepping on each other. Nobody merges their own work without review on a professional team.

In plain terms: a PR is like submitting a document for review and approval before it gets published to the shared drive.

---

**Pull**

Pulling downloads the latest changes from GitHub to your local copy. If teammates have pushed new work since you last synced, a pull brings your local copy up to date.

*"I pulled the latest"* = *"I synced my local copy with whatever has been pushed."*

---

**Merge**

Merging combines the changes from one branch into another. After a PR is approved, the branch is merged into `main` and the changes become part of the main codebase.

---

**Issues**

Issues are GitHub's built-in task tracker. Each issue has a title, description, and can be assigned to a person and a milestone. Used to report bugs, request features, or discuss changes.

Non-developers use Issues too. If you are using a public tool and find a problem or want to request something, opening an Issue is how you communicate with the maintainers.

---

**README**

The README is the front page of every repository — a document (usually in Markdown format) that explains what the project is, what it does, how to install/use it, and how to contribute.

**Always read the README before using anything you find on GitHub.** It will tell you what the tool does, what you need to run it, and any important caveats.

---

**.gitignore**

A `.gitignore` file tells Git which files to never track or commit. Typically excludes: passwords, API keys, large data files, generated files.

This is a security mechanism. You never want to accidentally commit credentials to a public repository — if you do, those credentials should be treated as compromised immediately.

---

## What Lives in GitHub vs. What Does Not

| Goes in GitHub | Does NOT go in GitHub |
|---|---|
| Code, scripts, automation files | Databases |
| Prompt libraries and templates | Large data files (CSV, exports) |
| Configuration files | API keys, passwords, credentials |
| Documentation and READMEs | PII or confidential business data |
| AI skill files and agent configs | Binary media files (videos, etc.) |
| MCP server configurations | Production data of any kind |
| Course content like this | Backup files not needed by the project |

**Why databases don't go in GitHub**: GitHub is optimized for text files and tracks every change in every file. A database can be gigabytes large and changes constantly — it would overwhelm GitHub and expose sensitive data. Databases belong in dedicated database systems or cloud object storage like AWS S3 (covered in Module 16).

---

## What Is a Terminal?

Many GitHub operations — and Claude Code itself — are run from a **terminal**. If you have never used one, here is what it is.

A terminal (also called a command prompt, shell, or CLI — command-line interface) is a text-based interface to your computer. Instead of clicking icons and buttons, you type commands and press Enter. The computer executes them and prints the result.

**On a Mac**: open Spotlight (⌘ Space) and search for "Terminal." Click to open it.
**On Windows**: press Win + X and choose "Windows Terminal" or "PowerShell."

You will see a blinking cursor next to a line that looks something like:
```
evan@laptop:~ $
```

That is called a **prompt**. It is telling you where you are (the current folder) and that it is ready for a command. Common things you type here:
- `cd Documents` — move into the Documents folder ("change directory")
- `ls` (Mac) or `dir` (Windows) — list files in the current folder
- `claude` — start Claude Code (once it is installed)
- `git clone [url]` — download a GitHub repository to your computer

The terminal feels unfamiliar at first but you only need a handful of commands to be productive with GitHub and Claude Code. Every command here is explained when you need it.

---

## The Standard Collaboration Workflow

Most GitHub operations happen through the terminal. When working on a project with others:

1. **Clone** the repository to your computer: `git clone [repository URL]` — downloads a local copy
2. **Create a branch** for your change: `git checkout -b my-branch-name`
3. Make your changes to the files (using any editor, or Claude Code)
4. **Stage and commit**: `git add .` then `git commit -m "describe what you changed"`
5. **Push** your branch to GitHub: `git push origin my-branch-name`
6. Open a **Pull Request** on github.com — describe what you changed and why
7. Wait for review — teammates comment, approve, or request changes
8. After approval, **merge** the PR into main
9. **Delete** the branch — it has done its job

Don't worry about memorising these commands. Claude Code knows all of them. You can describe what you want to do in plain English and Claude Code will write and run the right git commands for you.

---

## Finding and Using Public AI Resources on GitHub

This is where GitHub becomes immediately useful for you today.

**How to find what you need:**
- Go to github.com and search for relevant terms: `claude prompt library`, `claude skill files`, `mcp server hubspot`, `BMAD method`
- Look at the stars count (⭐) — more stars = more people found it useful
- Read the README before deciding to use anything
- Check when it was last updated — an abandoned repo from 2022 may not work with current tools

**What you can do without writing any code:**
- **Read prompt files**: most prompt libraries are plain text or Markdown files — readable in any browser
- **Download individual files**: click the file, then the Download button — no cloning required
- **Fork a repo** to your own account to save and customize a copy
- **Open Issues** to ask questions or report problems
- **Star repos** to bookmark them

**Notable resources for this program:**
- `anthropics/anthropic-cookbook` — official Anthropic examples for using Claude
- `anthropics/courses` — official Anthropic course materials
- Search for `claude-skills` or `claude-prompts` for community-built prompt libraries
- Search for `mcp-server-[tool name]` for MCP server implementations for specific tools

---

## Key Takeaways

1. GitHub is where virtually all AI tools, frameworks, and prompt libraries live publicly — learning to navigate it unlocks an enormous resource
2. Core concepts: repository (project folder), commit (saved snapshot), branch (parallel version), pull request (review and merge proposal), push/pull (sync local and cloud)
3. Read the README first on any repository you want to use
4. Code lives in GitHub; databases and sensitive data do not
5. You can use GitHub effectively today without writing a single line of code

---

## Practical Exercise

1. Go to github.com and search for `anthropics/anthropic-cookbook`
2. Read the README
3. Browse the folders and find one example (a prompt, a pattern, a recipe) that seems relevant to your work
4. Note: what does it do, and how might you adapt it for your role?

You do not need to download or run anything. The goal is to navigate the repository, understand the README, and find something useful. If you get stuck, note specifically where and we will help in the course channel.

---

*Complete the quiz below to proceed to Module 16.*

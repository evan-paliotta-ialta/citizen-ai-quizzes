# Module 11: Documents, Images, and Multimodal Input

**Track**: Claude Desktop
**Estimated reading time**: 7 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Upload and work with documents effectively in Claude Desktop
- Use Claude's image and visual understanding capabilities
- Know the limitations of each file type
- Apply document analysis to real tasks in your role

---

## Beyond Text: Claude Is Multimodal

Claude is not a text-only tool. It can read, analyze, and reason about multiple types of input:

- **Text**: messages, pasted content, documents
- **PDFs**: reports, contracts, research papers, presentations exported to PDF
- **Images**: screenshots, charts, photos, diagrams, whiteboard photos
- **Spreadsheet data**: uploaded Excel files (.xlsx), CSV files, pasted tables
- **Code**: any programming language

This makes Claude significantly more powerful for real work. Instead of manually summarizing a 40-page report before asking Claude questions about it, you upload the report and ask directly.

---

## Working With Documents

**How to upload in Claude Desktop**: Use the attachment icon in the conversation bar, or drag and drop a file directly into the conversation window.

**What Claude can do with a document:**
- Summarize the key points
- Answer specific questions about the content
- Extract specific information (dates, names, figures, clauses)
- Compare two documents and identify differences
- Rewrite sections in a different tone or for a different audience
- Identify inconsistencies or gaps
- Draft a response or follow-up based on the document's content

**Best practices:**

*Tell Claude what you want from the document.* Do not just upload a file and say "what do you think?" Claude will default to a generic summary. Instead: "I am uploading our Q1 investor report. Please extract all forward-looking statements and flag any that might be difficult to defend if performance does not meet targets."

*Upload only what is relevant.* A 50-page document where your question is about page 3 wastes context window space. Paste the relevant section instead when you can.

*For large documents, ask targeted questions.* "What does this contract say about termination rights?" will get you a better answer than "summarize this contract" because it focuses Claude's attention on the specific section that matters.

---

## Working With PDFs

PDFs are fully supported. Claude can read text-based PDFs accurately. Some caveats:

- **Scanned PDFs** (photos of documents) may produce lower-quality results — Claude is reading the image, not the underlying text
- **Complex layouts** with multiple columns, tables within tables, or heavily designed pages may lose some formatting
- **Very large PDFs** (100+ pages) should be used selectively — upload the section you need, not the whole document, to conserve context window space

---

## Working With Images

This is one of Claude's most underused capabilities.

**What you can do:**
- Paste or upload a screenshot and ask "what does this show?"
- Upload a chart or graph: "summarize the trend in this chart" or "what is the key insight from this data?"
- Photo of a whiteboard after a meeting: "extract the action items from this whiteboard photo"
- Screenshot of an error message: "what does this error mean and how do I fix it?"
- Design mockup or slide: "what is unclear or confusing about this layout?"
- Competitor's marketing material: "analyze the messaging approach in this ad"

**The practical habit**: when you encounter something visual that you want to think about — a chart, a competitor's website, a document with complex formatting — screenshot it and ask Claude about it rather than trying to describe it in words.

---

## Working With Spreadsheet Data

Claude Desktop can read Excel files (.xlsx) and CSV files directly — just attach them like any other file. You can also paste data from a spreadsheet if you only need to share a specific range.

**What Claude can do with your spreadsheet:**
- Analyze and interpret the data — spot trends, outliers, and patterns
- Answer specific questions: *"Which deals are most at risk based on the days since last activity?"*
- Identify what's driving variance: *"Which categories are driving the most variance from budget?"*
- Suggest how to visualize or present the data: *"What chart type would best communicate this trend to a non-financial audience?"*
- Draft summaries or narratives based on the numbers
- Suggest formulas or restructured layouts (as text you copy back in)

**What Claude cannot do:**
- Edit the spreadsheet file directly or save changes back to it
- Run live Excel formulas on your data
- Connect to a live workbook (it reads a snapshot of the file at upload time)

**Two ways to work with spreadsheet data:**

*Option 1 — Upload the file*: Drag your .xlsx or .csv file into the conversation. Best when you need Claude to see the full picture or analyze multiple columns at once.

*Option 2 — Paste a range*: Copy and paste the specific rows and columns you care about. Best when you have a large workbook and only one section is relevant — it focuses Claude and saves context window space.

*"I've attached our Q1 pipeline data. Which deals are most at risk based on the days since last activity column?"*
*"Here is a pasted table of our budget vs. actuals. Tell me which categories are driving the most variance and why that might be."*
*"Look at this data and suggest what visualization would best communicate the trend to a non-financial audience."*

---

## Artifacts

When Claude produces something self-contained — a document, a table, a piece of structured content — it will sometimes display it in a separate panel on the right side of the conversation called an **Artifact**.

An Artifact is not a new response. It is Claude isolating a deliverable from the conversation so it is easy to review, copy, and use without having to fish it out of a long reply.

**Common things that appear as Artifacts:**
- Drafted documents (emails, reports, policy text, job descriptions)
- Tables and structured data
- Formatted templates
- HTML or other formatted content

**What you can do with an Artifact:**
- **Copy** — one click to copy the full content to your clipboard
- **Continue editing in the conversation** — ask Claude to revise it and the Artifact updates in place
- **Reference it** — Claude keeps the Artifact in context for the rest of the conversation, so you can ask follow-up questions about it without re-pasting

**When does Claude create an Artifact vs. reply inline?**
Claude uses judgment — it tends to use Artifacts for longer, more structured outputs where isolating the content makes it easier to use. You can also ask explicitly: *"Put this in an Artifact"* or *"Give me the final version as an Artifact."*

Artifacts are a Claude Desktop and Claude.ai feature. They make it easier to go from Claude's output straight to your work — less copying, less reformatting, less noise in the conversation thread.

---

## Key Takeaways

1. Claude is multimodal — it works with text, PDFs, images, uploaded Excel files, and more
2. Always tell Claude specifically what you want from a document — do not rely on it to guess
3. Upload only the relevant portion of large documents to preserve context window space
4. Screenshots are a powerful, underused input — paste any visual you want to think about
5. Excel and CSV files can be uploaded directly — Claude reads and analyzes them. The limitation is it cannot edit the file back; use it for analysis and insight, then act on the findings yourself
6. Artifacts appear when Claude produces a self-contained deliverable — use them to copy output cleanly and keep iterating in the same conversation

---

## Practical Exercise

Choose one of the following to try this week:

**Option A**: Upload a document you work with regularly (a report, a contract, a brief) and ask Claude to extract the five most important points and flag anything that might require follow-up action.

**Option B**: Take a screenshot of a chart or dashboard from a tool you use daily. Ask Claude: "What is the key insight from this data, and what action would you recommend based on it?"

**Option C**: Upload an Excel or CSV file from your actual work and ask Claude a specific analytical question — *"What are the top 3 things this data is telling me?"* or *"What's driving the biggest variance here?"*

Note whether Claude's output was immediately useful or required follow-up. If it required follow-up, identify what additional context would have made the first response better.

---

*Complete the quiz below to proceed to Module 12.*

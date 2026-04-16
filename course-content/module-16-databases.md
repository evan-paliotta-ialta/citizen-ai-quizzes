# Module 16: Databases and Data Storage — Where Information Lives

**Track**: Citizen Developer
**Estimated reading time**: 10 minutes
**Quiz**: Required to proceed

---

## Learning Objectives

By the end of this module you will be able to:
- Distinguish between a database and a file storage system
- Identify the main types of databases and when each is appropriate
- Explain what AWS S3 is and why it is not a database
- Describe how Claude interacts with data in each type of system

---

## Why This Matters

Every application you use every day is backed by a database. HubSpot, Salesforce, your email, your CRM, your product — the data you interact with lives somewhere structured and organized. Understanding where different types of data live is foundational to building effective AI workflows.

It also helps you avoid common misconceptions. One of the most frequent errors non-technical people make is assuming everything is a database, or conversely, that databases and file storage are interchangeable. They are not.

---

## The Core Distinction: Databases vs. File Storage

A **database** is a structured system for storing, organizing, and querying data. Think: organized by rows and columns (or equivalent structures), searchable, relational, transactional. You can ask a database: *"Give me all contacts where status = Active and last activity > 30 days ago"* and it will answer precisely.

**File storage** is for storing files as files — documents, PDFs, images, videos, exports. You retrieve them by name or path. You cannot query the contents of a PDF in file storage the way you can query records in a database.

If a spreadsheet is a notebook, a database is a filing room with a comprehensive index. File storage is a hard drive.

---

## Types of Databases

**Relational Databases (SQL)**

The most common type. Data lives in tables with defined columns, and tables relate to each other.

- A `contacts` table, a `deals` table, a `companies` table — they connect via shared IDs
- You query them using SQL: *"SELECT all deals WHERE stage = 'Proposal' AND value > 50000"*
- Examples: PostgreSQL, MySQL, Microsoft SQL Server
- Used by: HubSpot, Salesforce, virtually every SaaS product you use
- Best for: structured business data with defined relationships — contacts, transactions, pipeline data, logs

**NoSQL Databases (Document Stores)**

Store data as flexible documents (like JSON) rather than rigid rows and columns. Better when data structure varies or changes frequently.

- A user profile document might have different fields for different users — no problem in NoSQL
- Examples: MongoDB, DynamoDB (AWS)
- Best for: user-generated content, product catalogs, flexible schemas, event data

**Vector Databases**

The newest category, purpose-built for AI. They store **embeddings** — mathematical representations of meaning — and allow you to search by semantic similarity rather than exact keywords.

- "Find me all documents similar in meaning to this one" — that is a vector database query
- Examples: Pinecone, Weaviate, pgvector (an extension for PostgreSQL)
- Best for: AI-powered search, RAG systems, finding content by concept rather than keyword
- This is what makes RAG (Module 14) work under the hood — the source documents are stored as embeddings in a vector database

**Data Warehouses**

Databases optimized for large-scale analytics and reporting — not for live transactions, but for analyzing historical data at scale.

- Examples: Snowflake, Google BigQuery, AWS Redshift
- Best for: company-wide reporting, business intelligence dashboards, historical trend analysis
- The data warehouse is what feeds executive dashboards and analytical reports

**Time-Series Databases**

Optimized for data indexed by time — metrics, monitoring, IoT sensor readings.

- Examples: InfluxDB, TimescaleDB
- Best for: system performance monitoring, financial tick data, anything where the timestamp is the primary organizing dimension

---

## AWS S3 — Object Storage (Not a Database)

**Amazon S3 (Simple Storage Service)** is one of the most widely used cloud services in the world — and one of the most commonly confused with a database.

S3 is not a database. It is a virtually unlimited, durable, cheap cloud hard drive. You store files (objects) in containers (buckets). You retrieve them by name or path. You cannot query the contents.

**What goes in S3:**
- Documents, PDFs, images, videos
- Database backups and exports
- Large CSV or data files too big for a database
- Raw data before it is processed into a database
- Anything an application needs to store and retrieve as a file

**Why it matters for AI:**
- Most AI pipelines store their raw source documents in S3 — the PDFs, reports, and documents that a RAG system draws from
- When you build a knowledge base for Claude, the source files typically live in S3 and get processed into a vector database for search
- S3 is cheap, reliable, and scales infinitely — it is the default answer to "where do we store this file?"

**The key distinction:**
- S3 stores files. Databases store structured, queryable data.
- A database record might say "client contract uploaded" and include an S3 link. The actual PDF lives in S3. The metadata and reference lives in the database.

---

## Key Database Vocabulary

| Term | Plain English |
|---|---|
| Schema | The blueprint — what tables exist and what columns each has |
| Query | A question you ask the database: *"give me all X where Y"* |
| Index | A shortcut that makes certain queries run faster |
| Primary Key | The unique ID for each record — never repeats |
| Foreign Key | A field that links one table to another (e.g., deal_id in the contacts table linking to the deals table) |
| Migration | A change to the database structure (adding a column, renaming a table) |
| CRUD | Create, Read, Update, Delete — the four fundamental operations on any data |
| API | A way for applications (including Claude via MCP) to interact with a database without direct access |

---

## How Claude Interacts With Data

Claude cannot access databases directly. It interacts with data in three ways:

**1. You paste or upload it**
You export a report as CSV, copy the table, paste it into Claude. Claude reads the pasted content and analyzes it. Simple, manual, no infrastructure required.

**2. MCP server connection**
An MCP server acts as the bridge between Claude and a live database or application. Claude sends a query through the MCP server, the server retrieves the data, and Claude receives the result. This is how Claude can "read your HubSpot deals" — it is talking to HubSpot's database through an MCP server.

**3. RAG system**
A RAG pipeline retrieves relevant documents from a vector database and adds them to Claude's context before answering. Claude never touches the database directly — the pipeline retrieves and delivers.

**What Claude can do with data once it has it:**
- Analyze patterns and trends
- Answer specific questions
- Write SQL queries (which a developer or tool then runs)
- Suggest actions based on what the data shows
- Generate reports, summaries, and narratives from raw data

---

## Key Takeaways

1. Databases store structured, queryable data. File storage (like S3) stores files.
2. Main database types: relational/SQL (most business data), NoSQL (flexible documents), vector (AI search), data warehouse (analytics), time-series (metrics)
3. AWS S3 is cloud file storage — it holds the raw documents that AI pipelines process, but it is not a database
4. Claude connects to databases via MCP servers or through data pasted/uploaded by the user
5. Understanding where your data lives helps you design better AI workflows

---

## Practical Exercise

Think about the data sources you use regularly in your work. For each, identify whether it is:
- A database (structured, queryable — e.g., HubSpot, Salesforce, your product's database)
- File storage (files retrieved by name — e.g., SharePoint, Google Drive, S3)
- A data warehouse (analytical, historical — e.g., Snowflake, Redshift)

Then identify one data source where a Claude connection (via MCP or pasted export) would save you meaningful time. What would you want Claude to do with that data?

---

*Complete the quiz below to proceed to the Final Exam.*

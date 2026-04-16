# Technical Guardrails Research: Claude Code Enterprise Governance

**Date:** 2026-03-02

---

## 1. MCP Server Security & Governance

### Key Risks

**Tool Poisoning Attacks (TPA):** Malicious instructions embedded in MCP tool descriptions. CyberArk expanded this to "Full-Schema Poisoning" - the entire tool schema is an attack surface. An agent doesn't need to *use* a tool to be infected - it only needs to *read* the schema.

**Rug Pull Attacks:** Tool behavior silently altered after initial approval. Clean version served during onboarding, malicious version delivered later without triggering new approval.

**Cross-Server Attacks:** When multiple MCP servers connect to the same client, a malicious server can exfiltrate data from trusted servers, hijack credentials, or override other servers' instructions.

### Enterprise MCP Controls in Claude Code

**`managed-mcp.json`** deployed to system directories:
- Linux/WSL: `/etc/claude-code/managed-mcp.json`
- macOS: System-level path
- Windows: `C:\ProgramData\ClaudeCode\managed-mcp.json`

**Key behaviors:**
- Denylist is absolute - blocks servers across ALL scopes including enterprise
- Allowlist restricts user/project - enterprise servers bypass allowlist
- **Empty allowlist triggers lockdown mode** - blocks all non-enterprise servers
- Invalid JSON also triggers lockdown as fail-safe
- When `managed-mcp.json` contains `mcpServers`, users cannot add ANY servers
- Enterprise-managed MCP servers cannot be disabled by users

**Recommendation:** Use deny-by-default with explicit allowlist of vetted servers only.

---

## 2. Claude Code Hooks for Audit Logging

### Trail of Bits Reference (claude-code-config)

**PreToolUse Blocking Hooks:**
1. **Block `rm -rf`** - Suggests `trash` instead
2. **Block push to main/master** - Requires feature branches

**PostToolUse Audit Hooks:**
3. **`log-gam.sh`** - Classifies commands as read/write, logs mutations with timestamp, action, command, exit status
4. **Bash command logger** - Appends every command to timestamped log file

### Hook Types
- **Command hooks** - Shell commands at lifecycle events
- **Prompt hooks** - LLM-based semantic evaluation
- **Agent hooks** - Deep codebase analysis via subagents
- **HTTP hooks** - POST to external endpoints (centralized audit service)

### Enterprise Hook Configuration
- `allowManagedHooksOnly` blocks user/project/plugin hooks
- Hooks snapshot at session start (changes don't hot-apply)
- Policy settings changes cannot be blocked by hooks

### Critical Caveat
"Hooks are not a security boundary - a prompt injection can work around them. Guardrails, not walls." - Trail of Bits

---

## 3. CLAUDE.md Governance Patterns

### Best Practices
- Keep under ~13KB (150-200 instructions max for reliable following)
- Treat as guardrails, not a manual
- Always provide alternatives, not just prohibitions ("Instead of X, use Y because Z")
- Don't use it as a linter - use deterministic tools for that

### Enterprise Governance Rules to Include
1. "All code changes must reference a Jira ticket number in commit messages"
2. "Never commit files containing API keys, tokens, or credentials"
3. "Do not add new dependencies without documenting rationale"
4. "All changes to /infrastructure/ or /security/ require explicit user confirmation"
5. "Every new function must have a corresponding test"
6. "Wrap new features behind feature flags"

### Layered Defense Model
- **CLAUDE.md** = "should-do" (soft guardrails, can be forgotten under context pressure)
- **Hooks** = "must-do" (fire every time, but not a hard security boundary)
- **Sandbox** = OS-level enforcement (cannot be bypassed by agent)
- **Deterministic tools** = linters, formatters, CI checks (fully reliable)

---

## 4. Claude Code Sandbox

### How It Works

**macOS (Seatbelt):**
- Apple's native sandbox framework
- Auto-generates `.sb` profile from `permissions.deny` rules
- Works out of the box, no installation needed
- Note: `sandbox-exec` marked deprecated by Apple (still works)

**Linux (bubblewrap/bwrap):**
- Linux namespaces and bind mounts
- Requires bubblewrap package installation
- Network requests routed via Unix domain sockets

### Dual Isolation
- **Filesystem:** Read allowed everywhere (can deny specific paths), write denied everywhere (must explicitly allow)
- **Network:** All access denied by default, controlled through proxy, approved domains only

### What Sandbox Prevents
- Reading/writing files outside allowed directories
- Network access to unapproved domains
- Applies to ALL subprocess commands (kubectl, terraform, npm, etc.)

### What Sandbox Does NOT Prevent
- Prompt injection attacks
- Logic-level attacks (writing malicious code to allowed files)
- Social engineering to lift restrictions

### Critical Gap
**Permission deny rules in settings.json only apply to Claude's built-in tools.** Without sandbox, `cat ~/.ssh/id_rsa` via Bash bypasses deny rules entirely. Multiple bugs reported where deny rules silently ignored. **Sandbox is the only reliable enforcement layer.**

Performance: <15ms latency per command. Reduces permission prompts by 84%.

---

## 5. Jira MCP Server (Atlassian Rovo)

### Setup
```
claude mcp add --transport sse atlassian https://mcp.atlassian.com/v1/sse
```

### 46+ Tools Available
- **Jira:** Search (JQL), create/update/transition issues, add comments/worklogs
- **Confluence:** Search (CQL), create/update pages, manage comments
- **Compass:** Service components, relationships, metadata
- **JSM:** Ops alerts, schedules, teams (API token auth only)
- **Cross-product:** Rovo natural language search, direct retrieval via ARIs

### "Ticket Before Work" Enforcement Pattern

**Pattern 1 - CLAUDE.md Rule:**
```
Before starting any coding work, you MUST:
1. Search Jira for an existing ticket using searchJiraIssuesUsingJql
2. If no ticket exists, create one
3. Include the ticket key in all commit messages
4. Never proceed without an associated Jira ticket
```

**Pattern 2 - PreToolUse Hook:**
Hook on `Edit` or `Bash(git commit*)` checks for Jira ticket reference, blocks commits without one.

**Pattern 3 - SessionStart Hook:**
Queries Jira for user's current sprint, injects context about assigned tickets.

### Limitations
- Respects existing Atlassian Cloud permissions
- OAuth tokens are session-based (re-auth may be needed multiple times/day)
- Admins can control which MCP clients connect and view usage logs

---

## Sources

- [Trail of Bits claude-code-config](https://github.com/trailofbits/claude-code-config)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Sandboxing Docs](https://code.claude.com/docs/en/sandboxing)
- [Anthropic Engineering: Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [managed-settings.json Guide](https://managed-settings.com/)
- [MCP Security - Invariant Labs](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [Full-Schema Poisoning - CyberArk](https://www.cyberark.com/resources/threat-research-blog/poison-everywhere-no-output-from-your-mcp-server-is-safe)
- [MCP Security Risks - Prompt Security](https://prompt.security/blog/top-10-mcp-security-risks)
- [Atlassian Rovo MCP Server](https://www.atlassian.com/platform/remote-mcp-server)
- [Rovo MCP Supported Tools](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/)
- [Codacy - Security Guardrails](https://blog.codacy.com/equipping-claude-code-with-deterministic-security-guardrails)
- [Enterprise Skill Governance - Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)

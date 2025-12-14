# 🤖 AgentMesh

> **AI-Powered Repository Intelligence & Automation Platform**
> 
> Orchestrate autonomous coding agents, intelligent workflows, and code quality evaluation through a unified MCP server.

[![Cline CLI](https://img.shields.io/badge/Cline-CLI-purple)](https://github.com/cline/cline)
[![Kestra](https://img.shields.io/badge/Kestra-AI_Agent-blue)](https://kestra.io)
[![Oumi](https://img.shields.io/badge/Oumi-LLM_Judge-orange)](https://github.com/oumi-ai/oumi)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 What is AgentMesh?

AgentMesh is a **Model Context Protocol (MCP) server** that brings together the best AI development tools into one powerful platform:

- 🤖 **Cline CLI Integration** - Autonomous coding, code review, security audits, and test generation
- 🔄 **Kestra AI Workflows** - 4-phase intelligent analysis with GitHub data summarization
- 🧠 **Oumi LLM-as-a-Judge** - Code quality evaluation with custom judge configurations

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/N-45div/Agentmesh.git
cd agentmesh
pnpm install

# Start MCP server
pnpm dev

# Start Kestra (in another terminal)
cd kestra && docker-compose up -d
```

MCP Server: `http://localhost:3001/mcp`
Kestra UI: `http://localhost:8080`

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP CLIENTS                              │
│         (Claude Desktop, Windsurf, Custom Apps)                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ MCP Protocol
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTMESH MCP SERVER                         │
│                    (http://localhost:3001/mcp)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Cline CLI   │  │ Kestra Intel │  │  Oumi Judge  │          │
│  │   Tools      │  │    Tool      │  │    Tool      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘          │
└─────────┼─────────────────┼─────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌──────────────────────────────────────────┐
│    CLINE CLI     │  │           KESTRA SERVER                  │
│  (Autonomous     │  │        (http://localhost:8080)           │
│   Coding Agent)  │  ├──────────────────────────────────────────┤
│                  │  │  Phase 1: Data Collection (GitHub API)   │
│  • code_task     │  │  Phase 2: Security & Health Analysis     │
│  • review_code   │  │  Phase 3: AI-Powered Insights            │
│  • security_audit│  │  Phase 4: AgentMesh Integration          │
│  • generate_tests│  └──────────────────────────────────────────┘
│  • fix_issues    │
└──────────────────┘
```

## 🔄 Kestra AI Integration

AgentMesh includes an advanced **4-phase GitHub repository analysis** workflow powered by Kestra:

### The Flow

```
MCP Tool Call → Kestra Webhook → 4-Phase Analysis → Results
```

### Phase Breakdown

| Phase | What It Does |
|-------|--------------|
| **Phase 1: Data Collection** | Fetches repo metadata, commits, issues, PRs, contributors, languages |
| **Phase 2: Security Analysis** | Scans for security issues, bugs, stale PRs |
| **Phase 3: AI Insights** | Generates health scores and priority decision matrix |
| **Phase 4: AgentMesh Integration** | Routes actions to Cline CLI for automated fixes |

### Trigger via MCP

```bash
# Trigger Kestra analysis for any GitHub repo
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "kestra_code_intel",
      "arguments": {
        "action": "analyze-repo",
        "repoUrl": "https://github.com/owner/repo"
      }
    }
  }'
```

### Start Kestra

```bash
cd kestra
docker-compose up -d
# Open http://localhost:8080
# Import kestra/flows/github-analysis.yaml
```

## 🛠️ Available MCP Tools

| Tool | Description |
|------|-------------|
| `cline_status` | Check Cline CLI installation |
| `code_task` | Execute coding tasks with Cline |
| `review_code` | AI-powered code review |
| `security_audit` | Security vulnerability scan |
| `generate_tests` | Generate unit/integration tests |
| `fix_issues` | Auto-fix code issues |
| `refactor` | Refactor for better quality |
| `kestra_code_intel` | Trigger Kestra GitHub analysis |

## 🧠 Oumi LLM-as-a-Judge

Contributed custom judge configs to the Oumi open-source project for code quality evaluation.

**PR**: [Oumi LLM as a judge for Code quality](https://github.com/oumi-ai/oumi/pull/2087)

| Config | Purpose |
|--------|---------|
| `maintainability.yaml` | Code maintainability and readability |
| `security.yaml` | Security vulnerabilities and best practices |
| `performance.yaml` | Performance characteristics |

## 📝 CLI Review Script

```bash
# Code review
./scripts/review.sh review src/lib/cline.ts

# Security audit
./scripts/review.sh audit .

# Generate tests
./scripts/review.sh tests src/tools/security-audit.ts
```

Reviews saved to `./reviews/` as markdown files.

## 🔧 Configuration

```bash
# Environment variables
KESTRA_URL=http://localhost:8080
CLINE_PATH=/path/to/cline  # Optional
```

## 📄 License

MIT License

## 🙏 Acknowledgments

- [Cline](https://github.com/cline/cline) - Autonomous coding agent
- [Kestra](https://kestra.io) - Workflow orchestration
- [Oumi](https://github.com/oumi-ai/oumi) - LLM-as-a-Judge framework
- [XMCP](https://xmcp.dev) - MCP framework

---

Built with ❤️ for the AI Agents Hackathon

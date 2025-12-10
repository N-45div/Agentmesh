# 🤖 AgentMesh

> **AI Agents Assemble Hackathon Submission**
> 
> An MCP server that exposes Cline CLI capabilities as tools, enabling any MCP-compatible AI assistant to leverage autonomous coding agents.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/agentmesh)
[![CodeRabbit](https://img.shields.io/badge/CodeRabbit-Enabled-orange)](https://coderabbit.ai)

## 🎯 What is AgentMesh?

AgentMesh bridges the gap between AI assistants and autonomous coding agents. It wraps the powerful [Cline CLI](https://github.com/cline/cline) in an MCP (Model Context Protocol) server, allowing any MCP-compatible client to:

- Execute coding tasks autonomously
- Review and refactor code
- Generate tests and documentation
- Perform security audits
- Deploy to Vercel
- Orchestrate multi-step workflows

## 🏆 Hackathon Prizes Targeted

| Prize | Sponsor | How AgentMesh Qualifies |
|-------|---------|------------------------|
| **Infinity Build Award** ($5,000) | Cline | Core integration with Cline CLI |
| **Wakanda Data Award** ($4,000) | Kestra | AI Agent summarizes GitHub data → triggers Cline |
| **Stormbreaker Deployment** ($2,000) | Vercel | Live deployment + Vercel tools |
| **Captain Code Award** ($1,000) | CodeRabbit | PR review integration |

**Total Potential: $12,000** 🎯

## 🛠️ Available Tools

### Core Cline Tools
| Tool | Description |
|------|-------------|
| `cline_status` | Check Cline CLI installation status |
| `code_task` | Execute any coding task with Cline |
| `review_code` | AI-powered code review |
| `fix_issues` | Automatically fix code issues |
| `generate_tests` | Generate unit/integration tests |
| `security_audit` | Perform security vulnerability scan |
| `explain_code` | Get AI explanations of code |
| `refactor` | Refactor code for better quality |
| `generate_docs` | Generate documentation |
| `git_assist` | AI-assisted Git operations |

### Deployment & CI/CD
| Tool | Description |
|------|-------------|
| `vercel_deploy` | Deploy to Vercel (preview/production) |
| `coderabbit_review` | Trigger CodeRabbit PR reviews |
| `scaffold_project` | Scaffold new projects with AI |

### Workflow Orchestration
| Tool | Description |
|------|-------------|
| `agent_workflow` | Multi-step AI agent pipelines |
| `kestra_code_intel` | Kestra AI Agent for code intelligence |

## 🧠 Kestra AI Integration

AgentMesh features a powerful **Kestra Code Intelligence Pipeline** that:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   GitHub     │───▶│   Kestra     │───▶│  AI Agent    │───▶│    Cline     │
│   Data       │    │  Workflow    │    │  Summarize   │    │   Execute    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
     │                    │                    │                    │
     │                    │                    │                    │
  Issues, PRs         Orchestrate          "3 bugs,            Auto-fix
  Commits, CI         Data Flow            1 security          & Deploy
                                           issue"
```

### How It Works

1. **Data Collection**: Kestra fetches issues, PRs, and commits from GitHub
2. **AI Summarization**: Kestra's AI Agent analyzes and summarizes the data
3. **Decision Making**: AI decides what actions to take based on priorities
4. **Execution**: Triggers Cline via AgentMesh to execute fixes automatically

### Quick Start with Kestra

```bash
# Start Kestra
docker run -p 8080:8080 kestra/kestra:latest server local

# Import the workflow
# Copy kestra/agentmesh-code-intel.yml to Kestra UI
```

See [`kestra/agentmesh-code-intel.yml`](./kestra/agentmesh-code-intel.yml) for the complete workflow.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Cline CLI](https://github.com/cline/cline) installed and configured
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agentmesh.git
cd agentmesh

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The MCP server will be running at `http://127.0.0.1:3001/mcp`

### Test the Server

```bash
# List available tools
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Check Cline status
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cline_status","arguments":{}}}'
```

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Custom Cline CLI path
CLINE_PATH=/path/to/cline

# For CodeRabbit integration
GITHUB_TOKEN=your-github-token

# For Kestra integration
KESTRA_URL=http://localhost:8080
```

## 📖 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MCP Client     │────▶│   AgentMesh     │────▶│   Cline CLI     │
│  (Claude, etc)  │     │   (XMCP Server) │     │   (AI Agent)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  External Services  │
                    │  - Vercel           │
                    │  - CodeRabbit       │
                    │  - Kestra           │
                    └─────────────────────┘
```

## 🎬 Demo

[Watch the demo video](https://youtube.com/your-demo-link)

## 📝 Example Use Cases

### 1. Code Review Pipeline
```
User: "Review the authentication module for security issues"
AgentMesh → Cline CLI → Security audit + Code review → Actionable feedback
```

### 2. Feature Development
```
User: "Add user authentication with JWT"
AgentMesh → agent_workflow (full-feature) → Plan → Code → Test → Review
```

### 3. Deploy to Production
```
User: "Deploy the latest changes to production"
AgentMesh → vercel_deploy (production) → Live URL
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Cline](https://github.com/cline/cline) - The autonomous coding agent
- [XMCP](https://xmcp.dev) - The MCP framework
- [Vercel](https://vercel.com) - Deployment platform
- [CodeRabbit](https://coderabbit.ai) - AI code reviews
- [Kestra](https://kestra.io) - Workflow orchestration

---

Built with ❤️ for the **AI Agents Assemble Hackathon** (Dec 8-14, 2025)

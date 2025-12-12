# 🤖 AgentMesh

> **Unified AI Agent Orchestration Platform**
> 
> Connect any MCP-compatible AI assistant to autonomous coding agents, workflow orchestration, and intelligent code evaluation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/N-45div/Agentmesh)
[![Oumi](https://img.shields.io/badge/Oumi-LLM--as--Judge-purple)](https://oumi.ai)
[![Kestra](https://img.shields.io/badge/Kestra-Workflow-blue)](https://kestra.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 What is AgentMesh?

AgentMesh is a **Model Context Protocol (MCP) server** that unifies multiple AI capabilities into a single, powerful platform:

- 🤖 **Autonomous Coding** - Execute complex coding tasks via Cline CLI
- 🔄 **Workflow Orchestration** - Intelligent pipelines with Kestra AI
- 🎯 **Quality Evaluation** - LLM-as-a-Judge scoring with Oumi
- 🚀 **One-Click Deployment** - Deploy anywhere with Vercel integration

## 📐 System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        Claude[Claude Desktop]
        CustomApp[Custom AI Apps]
        Desktop[AgentMesh Desktop]
    end

    subgraph "Application Layer"
        subgraph "Desktop App - Tauri"
            Dashboard[Dashboard UI]
            ToolExplorer[Tool Explorer]
            LogViewer[Log Viewer]
        end

        subgraph "MCP Server - XMCP"
            MCPHandler[MCP Protocol Handler<br/>/mcp endpoint]
            ToolRegistry[Tool Registry<br/>15+ tools]
            
            subgraph "Service Layer"
                ClineService[Cline Service]
                WorkflowService[Workflow Service]
                EvalService[Evaluation Service]
            end
            
            RequestRouter[Request Router]
            ErrorHandler[Error Handler]
        end
    end

    subgraph "Integration Layer"
        subgraph "Cline CLI"
            CodeTask[code_task<br/>Code Generation]
            ReviewCode[review_code<br/>Code Review]
            GenTests[generate_tests<br/>Test Generation]
            SecAudit[security_audit<br/>Security Scan]
            GitAssist[git_assist<br/>Git Operations]
        end

        subgraph "Kestra AI"
            DataFetcher[Data Fetcher<br/>GitHub API]
            AISummarizer[AI Summarizer<br/>GPT-4]
            DecisionEngine[Decision Engine]
        end

        subgraph "Oumi Judge"
            ContentAnalyzer[Content Analyzer]
            QualityScorer[Quality Scorer<br/>5 Criteria]
            ReportGen[Report Generator]
        end

        VercelDeploy[Vercel Deploy<br/>Preview/Production]
    end

    subgraph "External Services"
        GitHubAPI[GitHub API<br/>Issues, PRs, Commits]
        VercelAPI[Vercel API]
        OpenAIAPI[OpenAI API<br/>GPT-4]
        KestraServer[Kestra Server<br/>Workflow Engine]
    end

    %% User interactions
    Claude -->|MCP Protocol| MCPHandler
    CustomApp -->|MCP Protocol| MCPHandler
    Desktop -->|HTTP| MCPHandler

    %% Desktop App connections
    Dashboard --> ToolRegistry
    ToolExplorer --> ToolRegistry
    LogViewer --> ErrorHandler

    %% MCP Server routing
    MCPHandler --> ToolRegistry
    ToolRegistry --> RequestRouter
    RequestRouter --> ClineService
    RequestRouter --> WorkflowService
    RequestRouter --> EvalService

    %% Service to Integration
    ClineService --> CodeTask
    ClineService --> ReviewCode
    ClineService --> GenTests
    ClineService --> SecAudit
    ClineService --> GitAssist
    WorkflowService --> DataFetcher
    WorkflowService --> DecisionEngine
    EvalService --> ContentAnalyzer

    %% Kestra flow
    DataFetcher --> AISummarizer
    AISummarizer --> DecisionEngine
    DecisionEngine --> ClineService

    %% Oumi flow
    ContentAnalyzer --> QualityScorer
    QualityScorer --> ReportGen

    %% External connections
    DataFetcher --> GitHubAPI
    AISummarizer --> OpenAIAPI
    VercelDeploy --> VercelAPI
    WorkflowService --> KestraServer
    ContentAnalyzer --> OpenAIAPI

    %% Styling
    style Claude fill:#fff,stroke:#000,color:#000
    style CustomApp fill:#fff,stroke:#000,color:#000
    style Desktop fill:#fff,stroke:#000,color:#000
    style Dashboard fill:#fff,stroke:#000,color:#000
    style ToolExplorer fill:#fff,stroke:#000,color:#000
    style LogViewer fill:#fff,stroke:#000,color:#000
    style MCPHandler fill:#fff,stroke:#000,color:#000
    style ToolRegistry fill:#fff,stroke:#000,color:#000
    style ClineService fill:#fff,stroke:#000,color:#000
    style WorkflowService fill:#fff,stroke:#000,color:#000
    style EvalService fill:#fff,stroke:#000,color:#000
    style RequestRouter fill:#fff,stroke:#000,color:#000
    style ErrorHandler fill:#fff,stroke:#000,color:#000
    style CodeTask fill:#fff,stroke:#000,color:#000
    style ReviewCode fill:#fff,stroke:#000,color:#000
    style GenTests fill:#fff,stroke:#000,color:#000
    style SecAudit fill:#fff,stroke:#000,color:#000
    style GitAssist fill:#fff,stroke:#000,color:#000
    style DataFetcher fill:#fff,stroke:#000,color:#000
    style AISummarizer fill:#fff,stroke:#000,color:#000
    style DecisionEngine fill:#fff,stroke:#000,color:#000
    style ContentAnalyzer fill:#fff,stroke:#000,color:#000
    style QualityScorer fill:#fff,stroke:#000,color:#000
    style ReportGen fill:#fff,stroke:#000,color:#000
    style VercelDeploy fill:#fff,stroke:#000,color:#000
    style GitHubAPI fill:#fff,stroke:#000,color:#000
    style VercelAPI fill:#fff,stroke:#000,color:#000
    style OpenAIAPI fill:#fff,stroke:#000,color:#000
    style KestraServer fill:#fff,stroke:#000,color:#000
```

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
| `oumi_judge` | LLM-as-a-Judge for rating outputs |
| `scaffold_project` | Scaffold new projects with AI |

### Workflow Orchestration
| Tool | Description |
|------|-------------|
| `agent_workflow` | Multi-step AI agent pipelines |
| `kestra_code_intel` | Kestra AI Agent for code intelligence |

## 🧠 Kestra AI Integration

AgentMesh integrates with **Kestra** for intelligent workflow orchestration and AI-powered data summarization.

```mermaid
sequenceDiagram
    participant GH as GitHub
    participant K as Kestra
    participant AI as AI Agent
    participant AM as AgentMesh
    participant C as Cline CLI
    
    GH->>K: Webhook (PR/Push)
    K->>GH: Fetch Issues, PRs, Commits
    GH-->>K: Repository Data
    K->>AI: Summarize & Analyze
    AI-->>K: Priority Actions
    K->>AM: Execute Decision
    AM->>C: Run Task
    C-->>AM: Result
    AM-->>K: Completion Status
```

### How It Works

1. **Data Collection** - Kestra fetches issues, PRs, and commits from GitHub
2. **AI Summarization** - Kestra's AI Agent analyzes and summarizes the data
3. **Decision Making** - AI decides what actions to take based on priorities
4. **Execution** - Triggers Cline via AgentMesh to execute fixes automatically

### Quick Start with Kestra

```bash
# Start Kestra
docker run -p 8080:8080 kestra/kestra:latest server local

# Import the workflow
# Copy kestra/agentmesh-code-intel.yml to Kestra UI
```

See [`kestra/agentmesh-code-intel.yml`](./kestra/agentmesh-code-intel.yml) for the complete workflow.

## 🎯 Oumi LLM-as-a-Judge Integration

AgentMesh uses **Oumi's LLM-as-a-Judge** to evaluate and score all tool outputs:

```mermaid
sequenceDiagram
    participant U as User
    participant AM as AgentMesh
    participant C as Cline CLI
    participant O as Oumi Judge
    
    U->>AM: Request (code_task)
    AM->>C: Execute Task
    C-->>AM: Generated Code
    AM->>O: Evaluate Output
    O->>O: Score Quality, Security, Performance
    O-->>AM: Evaluation Report (8/10)
    AM-->>U: Code + Quality Score
```

### Evaluation Criteria

| Criteria | What It Checks |
|----------|----------------|
| **code-quality** | Structure, readability, best practices |
| **security** | Vulnerabilities, input validation |
| **performance** | Efficiency, complexity |
| **correctness** | Logic accuracy, error handling |
| **maintainability** | Documentation, modularity |

### Usage Example

```bash
# Evaluate Cline output
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "oumi_judge",
      "arguments": {
        "action": "evaluate",
        "content": "function add(a, b) { return a + b; }",
        "criteria": "all"
      }
    }
  }'
```

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

# For Oumi Judge integration
OPENAI_API_KEY=your-openai-key  # For Oumi judge model

# For Kestra integration
KESTRA_URL=http://localhost:8080
```

## 📖 Deployment Options

AgentMesh provides **three ways** to use the MCP server:

| Option | Best For | How It Works |
|--------|----------|--------------|
| 🖥️ **Desktop App** | Daily development | Native GUI with built-in MCP server |
| 🔄 **CI/CD Pipeline** | Automated workflows | GitHub Actions + Kestra on every push/PR |
| 🌐 **Local Server** | Custom integrations | Connect any MCP client (Claude, etc.) |

## 🖥️ Desktop App

The AgentMesh Desktop app provides a native GUI for running the MCP server locally with full Cline CLI support.

### Features
- **Start/Stop MCP Server** with one click
- **Execute tools** with visual feedback
- **Real-time logs** display
- **Cline CLI status** indicator

### Build Desktop App

```bash
cd desktop
pnpm install
pnpm tauri:dev    # Development
pnpm tauri:build  # Production build
```

Requires [Rust](https://rustup.rs/) and [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites).

## 🔄 GitHub Action

AgentMesh includes a GitHub Action that automatically analyzes your repository on every push/PR:

```yaml
# .github/workflows/code-intelligence.yml
# Triggers automatically on push/PR to main
```

### What it does:
1. **Fetches** open issues, PRs, and recent commits
2. **Analyzes** repository health with AI
3. **Triggers Kestra** workflow for automated fixes (if configured)
4. **Posts summary** as PR comment

## 🎬 Demo

[Watch the demo video](https://youtube.com/your-demo-link)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Cline](https://github.com/cline/cline) - The autonomous coding agent
- [XMCP](https://xmcp.dev) - The MCP framework
- [Vercel](https://vercel.com) - Deployment platform
- [Oumi](https://oumi.ai) - LLM-as-a-Judge evaluation framework
- [Kestra](https://kestra.io) - Workflow orchestration

---

Built with ❤️ using [XMCP](https://xmcp.dev), [Cline](https://github.com/cline/cline), [Kestra](https://kestra.io), and [Oumi](https://oumi.ai)

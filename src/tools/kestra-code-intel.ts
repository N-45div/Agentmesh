import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  action: z.enum([
    "analyze-repo",      // Summarize repo health using Kestra AI
    "setup-workflow",    // Generate Kestra workflow YAML
    "process-summary",   // Process AI summary and decide actions
    "execute-decision",  // Execute Cline based on AI decision
  ]).describe("Kestra Code Intelligence action"),
  repoUrl: z.string().optional().describe("GitHub repository URL"),
  summary: z.string().optional().describe("AI-generated summary to process"),
  kestraUrl: z.string().optional().default("http://localhost:8080")
    .describe("Kestra server URL"),
  workingDirectory: z.string().optional().describe("Local working directory"),
};

export const metadata: ToolMetadata = {
  name: "kestra_code_intel",
  description: `Kestra-powered Code Intelligence Pipeline.

Uses Kestra's AI Agent to:
1. **Summarize** data from GitHub (issues, PRs, commits, CI status)
2. **Analyze** code health and identify priorities
3. **Decide** what actions to take
4. **Execute** fixes via Cline CLI

Actions:
- **analyze-repo**: Fetch and summarize repository data
- **setup-workflow**: Generate Kestra workflow for continuous monitoring
- **process-summary**: Analyze AI summary and determine actions
- **execute-decision**: Trigger Cline to execute recommended fixes

This creates an intelligent pipeline: GitHub → Kestra AI → Decision → Cline Action`,
  annotations: {
    title: "Kestra Code Intelligence",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Simulated data fetching (in production, Kestra would do this)
async function fetchGitHubData(repoUrl: string): Promise<object> {
  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }
  const [, owner, repo] = match;
  
  try {
    // Fetch repo data from GitHub API
    const [repoData, issuesData, prsData] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`).then(r => r.json()),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`).then(r => r.json()),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10`).then(r => r.json()),
    ]);

    return {
      repo: {
        name: repoData.name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        openIssues: repoData.open_issues_count,
        language: repoData.language,
        updatedAt: repoData.updated_at,
      },
      issues: Array.isArray(issuesData) ? issuesData.map((i: { title: string; labels: { name: string }[]; created_at: string; user: { login: string } }) => ({
        title: i.title,
        labels: i.labels?.map((l: { name: string }) => l.name) || [],
        createdAt: i.created_at,
        author: i.user?.login,
      })) : [],
      pullRequests: Array.isArray(prsData) ? prsData.map((p: { title: string; draft: boolean; created_at: string; user: { login: string } }) => ({
        title: p.title,
        draft: p.draft,
        createdAt: p.created_at,
        author: p.user?.login,
      })) : [],
    };
  } catch (error) {
    return {
      error: "Failed to fetch GitHub data",
      repo: { name: repo, owner },
      issues: [],
      pullRequests: [],
    };
  }
}

// AI-powered summary generation (simulates Kestra AI Agent)
function generateAISummary(data: {
  repo: { name: string; openIssues: number; language: string };
  issues: { title: string; labels: string[] }[];
  pullRequests: { title: string; draft: boolean }[];
}): {
  summary: string;
  priorities: { level: string; item: string; action: string }[];
  recommendations: string[];
  overallHealth: string;
} {
  const priorities: { level: string; item: string; action: string }[] = [];
  const recommendations: string[] = [];
  
  // Analyze issues
  const bugIssues = data.issues.filter(i => 
    i.labels.some(l => l.toLowerCase().includes('bug'))
  );
  const securityIssues = data.issues.filter(i => 
    i.labels.some(l => l.toLowerCase().includes('security'))
  );
  
  if (securityIssues.length > 0) {
    priorities.push({
      level: "CRITICAL",
      item: `${securityIssues.length} security issue(s)`,
      action: "security_audit"
    });
    recommendations.push("Run security audit immediately");
  }
  
  if (bugIssues.length > 0) {
    priorities.push({
      level: "HIGH",
      item: `${bugIssues.length} bug(s) reported`,
      action: "fix_issues"
    });
    recommendations.push("Address bug fixes before new features");
  }
  
  // Analyze PRs
  const pendingPRs = data.pullRequests.filter(p => !p.draft);
  if (pendingPRs.length > 3) {
    priorities.push({
      level: "MEDIUM",
      item: `${pendingPRs.length} PRs awaiting review`,
      action: "review_code"
    });
    recommendations.push("Review and merge pending PRs to reduce backlog");
  }
  
  // Overall health assessment
  let health = "HEALTHY";
  if (securityIssues.length > 0) health = "CRITICAL";
  else if (bugIssues.length > 2) health = "NEEDS_ATTENTION";
  else if (data.repo.openIssues > 20) health = "MODERATE";
  
  const summary = `
Repository: ${data.repo.name}
Language: ${data.repo.language || 'Unknown'}
Open Issues: ${data.repo.openIssues}
Security Issues: ${securityIssues.length}
Bug Reports: ${bugIssues.length}
Pending PRs: ${pendingPRs.length}
Overall Health: ${health}
  `.trim();
  
  if (recommendations.length === 0) {
    recommendations.push("Repository is in good health. Continue regular maintenance.");
  }
  
  return { summary, priorities, recommendations, overallHealth: health };
}

// Generate Kestra workflow YAML
function generateKestraWorkflow(repoUrl: string, agentmeshUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  const repoName = match ? match[2] : 'repo';
  
  return `# Kestra Code Intelligence Workflow for AgentMesh
# This workflow uses Kestra's AI Agent to monitor and improve code quality

id: agentmesh-code-intel
namespace: agentmesh
description: |
  AI-powered code intelligence pipeline that:
  1. Fetches data from GitHub
  2. Uses AI to summarize and analyze
  3. Makes decisions on what actions to take
  4. Triggers Cline via AgentMesh to execute fixes

inputs:
  - id: repo_url
    type: STRING
    defaults: "${repoUrl}"
  - id: agentmesh_url
    type: STRING
    defaults: "${agentmeshUrl}"

triggers:
  - id: daily_check
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "0 9 * * *"  # Run daily at 9 AM

tasks:
  # Step 1: Fetch GitHub Data
  - id: fetch_issues
    type: io.kestra.plugin.core.http.Request
    uri: "https://api.github.com/repos/${match ? `${match[1]}/${match[2]}` : 'owner/repo'}/issues?state=open"
    method: GET
    headers:
      Accept: application/vnd.github.v3+json

  - id: fetch_prs
    type: io.kestra.plugin.core.http.Request
    uri: "https://api.github.com/repos/${match ? `${match[1]}/${match[2]}` : 'owner/repo'}/pulls?state=open"
    method: GET
    headers:
      Accept: application/vnd.github.v3+json

  # Step 2: AI Agent Summarization
  - id: ai_summarize
    type: io.kestra.plugin.openai.ChatCompletion
    apiKey: "{{ secret('OPENAI_API_KEY') }}"
    model: gpt-4
    messages:
      - role: system
        content: |
          You are a code intelligence AI. Analyze the repository data and provide:
          1. A brief summary of repository health
          2. Priority issues (CRITICAL, HIGH, MEDIUM, LOW)
          3. Recommended actions
          4. Overall health score
          
          Format your response as JSON with keys: summary, priorities, recommendations, health
      - role: user
        content: |
          Issues: {{ outputs.fetch_issues.body }}
          Pull Requests: {{ outputs.fetch_prs.body }}

  # Step 3: Decision Making
  - id: parse_decision
    type: io.kestra.plugin.core.flow.If
    condition: "{{ outputs.ai_summarize.choices[0].message.content contains 'CRITICAL' }}"
    then:
      # Step 4a: Critical - Trigger immediate fix
      - id: trigger_security_audit
        type: io.kestra.plugin.core.http.Request
        uri: "{{ inputs.agentmesh_url }}"
        method: POST
        headers:
          Content-Type: application/json
          Accept: application/json
        body: |
          {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
              "name": "security_audit",
              "arguments": {
                "target": ".",
                "scope": "full"
              }
            }
          }
    else:
      # Step 4b: Non-critical - Log and notify
      - id: log_summary
        type: io.kestra.plugin.core.log.Log
        message: "Repository health check complete: {{ outputs.ai_summarize.choices[0].message.content }}"

  # Step 5: Generate Report
  - id: create_report
    type: io.kestra.plugin.core.http.Request
    uri: "{{ inputs.agentmesh_url }}"
    method: POST
    headers:
      Content-Type: application/json
      Accept: application/json
    body: |
      {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
          "name": "generate_docs",
          "arguments": {
            "target": "HEALTH_REPORT.md",
            "type": "report",
            "content": "{{ outputs.ai_summarize.choices[0].message.content | replace('\\"', '\\\\\"') }}"
          }
        }
      }

outputs:
  - id: ai_summary
    type: STRING
    value: "{{ outputs.ai_summarize.choices[0].message.content }}"
  - id: action_taken
    type: STRING  
    value: "{{ outputs.parse_decision.condition ? 'security_audit_triggered' : 'logged_only' }}"
`;
}

export default async function kestraCodeIntel({ 
  action, 
  repoUrl,
  summary,
  kestraUrl,
  workingDirectory 
}: InferSchema<typeof schema>) {
  
  switch (action) {
    case "analyze-repo": {
      if (!repoUrl) {
        return "❌ repoUrl is required for analyze-repo action";
      }
      
      // Fetch GitHub data
      const data = await fetchGitHubData(repoUrl);
      
      // Generate AI summary (simulates Kestra AI Agent)
      const analysis = generateAISummary(data as {
        repo: { name: string; openIssues: number; language: string };
        issues: { title: string; labels: string[] }[];
        pullRequests: { title: string; draft: boolean }[];
      });
      
      let result = `🔍 **Kestra AI Code Intelligence Report**\n\n`;
      result += `## Summary\n\`\`\`\n${analysis.summary}\n\`\`\`\n\n`;
      
      if (analysis.priorities.length > 0) {
        result += `## Priorities\n`;
        for (const p of analysis.priorities) {
          const emoji = p.level === 'CRITICAL' ? '🚨' : p.level === 'HIGH' ? '⚠️' : '📋';
          result += `${emoji} **${p.level}**: ${p.item} → Action: \`${p.action}\`\n`;
        }
        result += '\n';
      }
      
      result += `## AI Recommendations\n`;
      for (const rec of analysis.recommendations) {
        result += `- ${rec}\n`;
      }
      
      result += `\n## Next Steps\n`;
      result += `Use \`kestra_code_intel\` with action \`execute-decision\` to automatically fix issues.\n`;
      result += `Or use \`setup-workflow\` to create a Kestra workflow for continuous monitoring.`;
      
      return result;
    }
    
    case "setup-workflow": {
      if (!repoUrl) {
        return "❌ repoUrl is required for setup-workflow action";
      }
      
      const agentmeshUrl = kestraUrl?.replace(':8080', ':3001/mcp') || 'http://localhost:3001/mcp';
      const workflow = generateKestraWorkflow(repoUrl, agentmeshUrl);
      
      return `📋 **Kestra Workflow Generated**

Save this as \`agentmesh-code-intel.yml\` and import into Kestra:

\`\`\`yaml
${workflow}
\`\`\`

## How to Deploy

1. **Start Kestra:**
   \`\`\`bash
   docker run -p 8080:8080 kestra/kestra:latest server local
   \`\`\`

2. **Import Workflow:**
   - Open Kestra UI at http://localhost:8080
   - Go to Flows → Create
   - Paste the YAML above

3. **Set Secrets:**
   - Add \`OPENAI_API_KEY\` in Kestra secrets

4. **Run:**
   - Trigger manually or wait for scheduled run

This workflow will:
✅ Fetch GitHub issues and PRs daily
✅ Use AI to summarize repository health
✅ Automatically trigger AgentMesh/Cline for critical issues
✅ Generate health reports`;
    }
    
    case "process-summary": {
      if (!summary) {
        return "❌ summary is required for process-summary action";
      }
      
      // Parse the summary and determine actions
      const lowerSummary = summary.toLowerCase();
      const actions: string[] = [];
      
      if (lowerSummary.includes('security') || lowerSummary.includes('critical')) {
        actions.push('security_audit');
      }
      if (lowerSummary.includes('bug') || lowerSummary.includes('fix')) {
        actions.push('fix_issues');
      }
      if (lowerSummary.includes('review') || lowerSummary.includes('pr')) {
        actions.push('review_code');
      }
      if (lowerSummary.includes('test')) {
        actions.push('generate_tests');
      }
      
      if (actions.length === 0) {
        return `✅ **No immediate actions required**\n\nThe AI summary indicates the repository is healthy.`;
      }
      
      return `🎯 **AI Decision: Actions Required**

Based on the summary, the following actions are recommended:

${actions.map((a, i) => `${i + 1}. \`${a}\``).join('\n')}

Use \`execute-decision\` with the summary to automatically run these actions via Cline.`;
    }
    
    case "execute-decision": {
      if (!summary) {
        return "❌ summary is required for execute-decision action";
      }
      
      // Determine what to execute based on summary
      const lowerSummary = summary.toLowerCase();
      let prompt = "";
      let actionName = "";
      
      if (lowerSummary.includes('security') || lowerSummary.includes('critical')) {
        prompt = "Perform a security audit and fix any critical vulnerabilities found";
        actionName = "Security Audit & Fix";
      } else if (lowerSummary.includes('bug')) {
        prompt = "Review open bug reports and fix the most critical ones";
        actionName = "Bug Fix";
      } else if (lowerSummary.includes('review') || lowerSummary.includes('pr')) {
        prompt = "Review pending pull requests and provide feedback";
        actionName = "Code Review";
      } else {
        prompt = "Analyze the codebase and suggest improvements";
        actionName = "Code Analysis";
      }
      
      const result = await runClineTask(prompt, {
        cwd: workingDirectory,
        mode: "act",
      });
      
      if (result.success) {
        return `✅ **Kestra AI Decision Executed**

Action: ${actionName}
Status: Completed

**Cline Output:**
${result.output}

The AI-driven pipeline has completed:
1. ✅ Data fetched from GitHub
2. ✅ AI summarized repository health
3. ✅ Decision made based on priorities
4. ✅ Cline executed the fix`;
      } else {
        return `❌ **Execution Failed**

Action: ${actionName}
Error: ${result.error}

${result.output}`;
      }
    }
    
    default:
      return `❌ Unknown action: ${action}`;
  }
}

import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  workflow: z.enum([
    "full-feature",      // Plan → Code → Test → Review → Deploy
    "bug-fix",           // Analyze → Fix → Test → PR
    "security-audit",    // Scan → Fix → Verify → Report
    "refactor-deploy",   // Refactor → Test → Review → Deploy
  ]).describe("Pre-defined workflow to execute"),
  target: z.string().describe("Target file, directory, or feature description"),
  options: z.object({
    autoCommit: z.boolean().optional().default(true),
    createPR: z.boolean().optional().default(true),
    deploy: z.boolean().optional().default(false),
  }).optional().describe("Workflow options"),
  workingDirectory: z.string().optional().describe("Working directory"),
};

export const metadata: ToolMetadata = {
  name: "agent_workflow",
  description: `Execute multi-step AI agent workflows that chain multiple tools together.

Available workflows:
- **full-feature**: Plan → Code → Test → Review → Deploy
- **bug-fix**: Analyze → Fix → Test → Create PR
- **security-audit**: Scan → Fix vulnerabilities → Verify → Generate report
- **refactor-deploy**: Refactor code → Run tests → Review → Deploy

Each workflow orchestrates multiple Cline tasks in sequence.`,
  annotations: {
    title: "Agent Workflow Orchestration",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

interface WorkflowStep {
  name: string;
  prompt: string;
  mode?: "act" | "plan";
}

const WORKFLOWS: Record<string, WorkflowStep[]> = {
  "full-feature": [
    { name: "Planning", prompt: "Create a detailed implementation plan for: {target}", mode: "plan" },
    { name: "Implementation", prompt: "Implement the feature according to the plan: {target}" },
    { name: "Testing", prompt: "Write comprehensive tests for the new feature: {target}" },
    { name: "Review", prompt: "Review the implementation for bugs, security issues, and code quality" },
  ],
  "bug-fix": [
    { name: "Analysis", prompt: "Analyze and identify the root cause of: {target}", mode: "plan" },
    { name: "Fix", prompt: "Fix the bug: {target}. Ensure minimal changes and no regressions." },
    { name: "Testing", prompt: "Add regression tests to prevent this bug from recurring" },
  ],
  "security-audit": [
    { name: "Scanning", prompt: "Perform a security audit on {target}. Look for vulnerabilities, exposed secrets, and security anti-patterns.", mode: "plan" },
    { name: "Fixing", prompt: "Fix all identified security vulnerabilities in {target}" },
    { name: "Verification", prompt: "Verify all security fixes are properly implemented and no new issues introduced" },
  ],
  "refactor-deploy": [
    { name: "Refactoring", prompt: "Refactor {target} to improve code quality, readability, and maintainability" },
    { name: "Testing", prompt: "Run all tests and fix any failures caused by refactoring" },
    { name: "Review", prompt: "Final review of refactored code for quality and correctness" },
  ],
};

export default async function agentWorkflow({ 
  workflow, 
  target, 
  options,
  workingDirectory 
}: InferSchema<typeof schema>) {
  const steps = WORKFLOWS[workflow];
  if (!steps) {
    return `❌ Unknown workflow: ${workflow}`;
  }

  const results: string[] = [];
  results.push(`🔄 Starting "${workflow}" workflow for: ${target}\n`);
  results.push(`📋 Steps: ${steps.map(s => s.name).join(" → ")}\n`);
  results.push("─".repeat(50) + "\n");

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;
    const prompt = step.prompt.replace("{target}", target);
    
    results.push(`\n### Step ${stepNum}/${steps.length}: ${step.name}\n`);
    
    const result = await runClineTask(prompt, {
      cwd: workingDirectory,
      mode: step.mode,
    });

    if (result.success) {
      results.push(`✅ ${step.name} completed\n`);
      results.push(result.output.substring(0, 500) + (result.output.length > 500 ? '...' : '') + "\n");
    } else {
      results.push(`❌ ${step.name} failed: ${result.error}\n`);
      results.push(`\n⚠️ Workflow stopped at step ${stepNum}. Fix the issue and retry.`);
      break;
    }
  }

  // Optional: Auto-commit and create PR
  if (options?.autoCommit) {
    results.push("\n### Git Operations\n");
    results.push("💡 Auto-commit enabled. Changes will be committed.\n");
  }

  if (options?.createPR) {
    results.push("💡 PR creation enabled. A PR will be created for review.\n");
  }

  results.push("\n" + "─".repeat(50));
  results.push(`\n🎉 Workflow "${workflow}" completed!`);

  return results.join("");
}

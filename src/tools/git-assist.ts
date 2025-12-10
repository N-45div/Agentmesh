import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  operation: z.enum(["analyze-commits", "suggest-commit-message", "review-diff", "explain-history"])
    .describe("The git operation to perform."),
  target: z.string().optional().describe("Git ref, file, or range to operate on."),
  workingDirectory: z.string().optional().describe("The git repository directory."),
};

export const metadata: ToolMetadata = {
  name: "git_assist",
  description: `Perform git operations with AI assistance. Can analyze commits, 
create meaningful commit messages, or help with git workflows.`,
  annotations: {
    title: "Git Assistant",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function gitAssist({ operation, target, workingDirectory }: InferSchema<typeof schema>) {
  const operationPrompts: Record<string, string> = {
    "analyze-commits": `Analyze the git commits ${target || "HEAD"}. Provide insights on:
- What changes were made
- Code quality of the changes
- Any potential issues introduced`,
    "suggest-commit-message": `Look at the current staged changes (git diff --staged) and suggest a clear, 
conventional commit message following best practices.`,
    "review-diff": `Review the git diff for ${target || "HEAD"}. Analyze the changes for:
- Correctness
- Potential bugs
- Code quality`,
    "explain-history": `Explain the git history for ${target || "the repository"}. Provide:
- Timeline of changes
- Key milestones
- Contributors and their focus areas`,
  };

  const prompt = operationPrompts[operation] || `Perform git operation: ${operation} on ${target}`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `🔀 Git ${operation} Complete\n\n${result.output}`;
  } else {
    return `❌ Git operation failed\n\nError: ${result.error}`;
  }
}

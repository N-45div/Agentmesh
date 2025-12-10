import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().optional().default(".").describe("File or directory to fix. Use '.' for current directory."),
  issueTypes: z.array(z.enum(["lint", "types", "security", "deprecated"])).optional()
    .describe("Types of issues to fix: 'lint', 'types', 'security', 'deprecated'"),
  dryRun: z.boolean().optional().default(false).describe("If true, only report what would be fixed without making changes."),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "fix_issues",
  description: `Automatically fix code issues like linting errors, type errors, 
security vulnerabilities, or deprecated code.`,
  annotations: {
    title: "Auto-Fix Issues",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

export default async function fixIssues({ target, issueTypes, dryRun, workingDirectory }: InferSchema<typeof schema>) {
  const types = issueTypes || ["lint", "types"];
  
  const issueDescriptions = types.map((type) => {
    switch (type) {
      case "lint": return "linting issues (ESLint, Prettier, etc.)";
      case "types": return "TypeScript type errors";
      case "security": return "security vulnerabilities";
      case "deprecated": return "deprecated APIs and dependencies";
      default: return type;
    }
  });

  const prompt = `${dryRun ? "Analyze" : "Fix"} the following issues in ${target || "."}:
${issueDescriptions.map((d) => `- ${d}`).join("\n")}

${dryRun ? "DO NOT make changes. Only report what would be fixed." : "Fix the issues directly in the files."}

For each issue:
1. Identify the problem
2. Explain the fix
3. ${dryRun ? "Show what the fix would be" : "Apply the fix"}`;

  const result = await runClineTask(prompt, { 
    cwd: workingDirectory,
    yolo: !dryRun,
  });

  if (result.success) {
    return `🔧 ${dryRun ? "Analysis" : "Fix"} Complete\n\n${result.output}`;
  } else {
    return `❌ ${dryRun ? "Analysis" : "Fix"} failed\n\nError: ${result.error}`;
  }
}

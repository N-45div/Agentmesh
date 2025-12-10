import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  prompt: z.string().describe("The coding task to perform. Be specific about what you want Cline to do."),
  workingDirectory: z.string().optional().describe("The directory to work in. Defaults to current directory."),
  mode: z.enum(["act", "plan"]).optional().describe("Mode: 'act' executes immediately, 'plan' creates a plan first."),
};

export const metadata: ToolMetadata = {
  name: "code_task",
  description: `Execute a coding task using Cline AI agent. Cline can read files, write code, 
execute commands, and more. Use this for any software development task like:
- Writing new code or features
- Fixing bugs
- Refactoring code
- Adding tests
- Code review and analysis`,
  annotations: {
    title: "Execute Coding Task",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

export default async function codeTask({ prompt, workingDirectory, mode }: InferSchema<typeof schema>) {
  const result = await runClineTask(prompt, {
    cwd: workingDirectory,
    mode: mode as "act" | "plan" | undefined,
  });

  if (result.success) {
    return `✅ Task completed successfully!\n\n${result.output}`;
  } else {
    return `❌ Task failed\n\nError: ${result.error}\n\nPartial output:\n${result.output}`;
  }
}

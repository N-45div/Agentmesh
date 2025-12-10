import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().describe("File or directory to refactor."),
  goals: z.array(z.string()).optional()
    .describe("Refactoring goals: 'readability', 'performance', 'modularity', 'dry'"),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "refactor",
  description: `Refactor code to improve quality, readability, or performance 
while maintaining functionality.`,
  annotations: {
    title: "Refactor Code",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

export default async function refactor({ target, goals, workingDirectory }: InferSchema<typeof schema>) {
  const refactorGoals = goals || ["readability", "maintainability"];

  const prompt = `Refactor the code in ${target}.

Goals:
${refactorGoals.map((g) => `- Improve ${g}`).join("\n")}

Guidelines:
- Maintain existing functionality
- Add comments explaining significant changes
- Follow language-specific best practices
- Consider SOLID principles where applicable
- Ensure tests still pass after refactoring`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `♻️ Refactoring Complete\n\nGoals: ${refactorGoals.join(", ")}\n\n${result.output}`;
  } else {
    return `❌ Refactoring failed\n\nError: ${result.error}`;
  }
}

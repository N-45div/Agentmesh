import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().describe("File or code snippet to explain."),
  detail: z.enum(["brief", "detailed", "comprehensive"]).optional().default("detailed")
    .describe("Level of detail in the explanation."),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "explain_code",
  description: `Get a detailed explanation of code. Useful for understanding 
complex code, documenting functionality, or onboarding.`,
  annotations: {
    title: "Explain Code",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function explainCode({ target, detail, workingDirectory }: InferSchema<typeof schema>) {
  const detailInstructions: Record<string, string> = {
    brief: "Provide a brief, high-level summary.",
    detailed: "Provide a detailed explanation with key concepts.",
    comprehensive: "Provide a comprehensive explanation including implementation details, design patterns, and potential improvements.",
  };

  const prompt = `Explain the code in ${target}.

${detailInstructions[detail || "detailed"]}

Include:
- Purpose and functionality
- Key components and their roles
- Data flow
- Important algorithms or patterns used
- Dependencies and integrations`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `📖 Code Explanation (${detail})\n\n${result.output}`;
  } else {
    return `❌ Explanation failed\n\nError: ${result.error}`;
  }
}

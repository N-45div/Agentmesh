import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().describe("File or directory to document."),
  docType: z.enum(["inline", "readme", "api", "all"]).optional().default("inline")
    .describe("Type of documentation to generate."),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "generate_docs",
  description: `Generate documentation for code including JSDoc/docstrings, 
README files, and API documentation.`,
  annotations: {
    title: "Generate Documentation",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function generateDocs({ target, docType, workingDirectory }: InferSchema<typeof schema>) {
  const docInstructions: Record<string, string> = {
    inline: "Add JSDoc/docstrings to all functions, classes, and methods.",
    readme: "Create or update a comprehensive README.md file.",
    api: "Generate API documentation with endpoints, parameters, and examples.",
    all: "Generate all types of documentation: inline comments, README, and API docs.",
  };

  const prompt = `Generate documentation for ${target}.

Task: ${docInstructions[docType || "inline"]}

Requirements:
- Clear and concise descriptions
- Include parameter types and return values
- Add usage examples where helpful
- Follow documentation best practices for the language`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `📚 Documentation Generated (${docType})\n\n${result.output}`;
  } else {
    return `❌ Documentation generation failed\n\nError: ${result.error}`;
  }
}

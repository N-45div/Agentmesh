import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().optional().default(".").describe("File, directory, or git ref to review. Use '.' for current directory."),
  focusAreas: z.array(z.string()).optional().describe("Areas to focus on: 'security', 'performance', 'bugs', 'style'"),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "review_code",
  description: `Review code for bugs, security issues, and quality problems. 
Returns detailed analysis with suggestions for improvement.`,
  annotations: {
    title: "AI Code Review",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function reviewCode({ target, focusAreas, workingDirectory }: InferSchema<typeof schema>) {
  let prompt = `Review the code in ${target || "."}. Analyze for:
- Potential bugs and logic errors
- Security vulnerabilities
- Code quality and maintainability issues
- Performance concerns`;

  if (focusAreas && focusAreas.length > 0) {
    prompt += `\n\nFocus especially on: ${focusAreas.join(", ")}`;
  }

  prompt += `\n\nProvide a structured report with:
1. Summary of findings
2. Critical issues (if any)
3. Recommendations
4. Overall assessment`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `📝 Code Review Complete\n\n${result.output}`;
  } else {
    return `❌ Review failed\n\nError: ${result.error}`;
  }
}

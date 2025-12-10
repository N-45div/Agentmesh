import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().describe("File or directory to generate tests for."),
  framework: z.enum(["jest", "vitest", "mocha", "pytest", "go"]).optional().default("vitest")
    .describe("Testing framework to use."),
  testType: z.enum(["unit", "integration", "e2e"]).optional().default("unit")
    .describe("Type of tests to generate."),
  coverage: z.number().optional().default(80).describe("Target code coverage percentage."),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "generate_tests",
  description: `Generate comprehensive tests for code. Supports multiple testing frameworks 
and can create unit, integration, or e2e tests.`,
  annotations: {
    title: "Generate Tests",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function generateTests({ target, framework, testType, coverage, workingDirectory }: InferSchema<typeof schema>) {
  const prompt = `Generate comprehensive ${testType || "unit"} tests for ${target}.

Requirements:
- Use ${framework || "vitest"} as the testing framework
- Target ${coverage || 80}% code coverage
- Include edge cases and error scenarios
- Add descriptive test names
- Mock external dependencies appropriately
- Follow testing best practices

For each file:
1. Analyze the code to understand its functionality
2. Identify all functions/methods that need testing
3. Generate test cases covering:
   - Happy path scenarios
   - Edge cases
   - Error handling
   - Boundary conditions
4. Create the test file(s) with proper imports and setup`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `🧪 Tests Generated (${framework}, ${testType})\n\n${result.output}`;
  } else {
    return `❌ Test generation failed\n\nError: ${result.error}`;
  }
}

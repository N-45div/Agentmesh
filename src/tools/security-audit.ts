import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  target: z.string().optional().default(".").describe("Directory to audit. Use '.' for current directory."),
  scanTypes: z.array(z.enum(["code", "dependencies", "secrets", "licenses"])).optional()
    .describe("Types of scans: 'code', 'dependencies', 'secrets', 'licenses'"),
  workingDirectory: z.string().optional().describe("The directory to work in."),
};

export const metadata: ToolMetadata = {
  name: "security_audit",
  description: `Perform a security audit on the codebase. Scans for vulnerabilities, 
exposed secrets, dependency issues, and provides a risk assessment.`,
  annotations: {
    title: "Security Audit",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function securityAudit({ target, scanTypes, workingDirectory }: InferSchema<typeof schema>) {
  const types = scanTypes || ["code", "dependencies", "secrets"];
  
  const scanDescriptions = types.map((type) => {
    switch (type) {
      case "code": return "security vulnerabilities in code (SQL injection, XSS, CSRF, etc.)";
      case "dependencies": return "dependency vulnerabilities";
      case "secrets": return "exposed secrets, API keys, passwords, tokens";
      case "licenses": return "dependency license compliance";
      default: return type;
    }
  });

  const prompt = `Perform a security audit of ${target || "."}.

Scan for:
${scanDescriptions.map((d) => `- ${d}`).join("\n")}

For each issue found, provide:
1. Severity: Critical / High / Medium / Low
2. Location: File and line number
3. Description: What the issue is
4. Impact: Potential consequences
5. Recommendation: How to fix it

At the end, provide:
- Executive summary
- Risk score (1-10)
- Priority action items`;

  const result = await runClineTask(prompt, { cwd: workingDirectory });

  if (result.success) {
    return `🔒 Security Audit Complete\n\nScanned: ${types.join(", ")}\n\n${result.output}`;
  } else {
    return `❌ Security audit failed\n\nError: ${result.error}`;
  }
}

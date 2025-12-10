import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { execa } from "execa";

export const schema = {
  action: z.enum(["deploy", "status", "logs", "promote", "rollback"])
    .describe("Vercel deployment action"),
  environment: z.enum(["preview", "production"]).optional().default("preview")
    .describe("Deployment environment"),
  projectPath: z.string().optional().describe("Path to the project to deploy"),
};

export const metadata: ToolMetadata = {
  name: "vercel_deploy",
  description: `Deploy and manage applications on Vercel.
- Deploy to preview or production
- Check deployment status
- View deployment logs
- Promote preview to production
- Rollback to previous deployment`,
  annotations: {
    title: "Vercel Deployment",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function vercelDeploy({ 
  action, 
  environment,
  projectPath 
}: InferSchema<typeof schema>) {
  const cwd = projectPath || process.cwd();

  try {
    switch (action) {
      case "deploy": {
        const args = ["deploy"];
        if (environment === "production") {
          args.push("--prod");
        }
        
        console.log(`[AgentMesh] Deploying to Vercel (${environment})...`);
        const { stdout } = await execa("vercel", args, { cwd });
        
        // Extract deployment URL
        const urlMatch = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
        const deployUrl = urlMatch ? urlMatch[0] : "URL not found";
        
        return `🚀 Deployment Complete!\n\nEnvironment: ${environment}\nURL: ${deployUrl}\n\nFull output:\n${stdout}`;
      }
      
      case "status": {
        const { stdout } = await execa("vercel", ["ls", "--json"], { cwd });
        const deployments = JSON.parse(stdout);
        
        if (!deployments.length) {
          return "📋 No deployments found for this project.";
        }
        
        const recent = deployments.slice(0, 5);
        const statusList = recent.map((d: { url: string; state: string; created: number }) => 
          `- ${d.url} (${d.state}) - ${new Date(d.created).toLocaleString()}`
        ).join('\n');
        
        return `📋 Recent Deployments:\n\n${statusList}`;
      }
      
      case "logs": {
        const { stdout } = await execa("vercel", ["logs", "--json"], { cwd });
        return `📜 Deployment Logs:\n\n${stdout.substring(0, 2000)}${stdout.length > 2000 ? '\n...(truncated)' : ''}`;
      }
      
      case "promote": {
        const { stdout } = await execa("vercel", ["promote"], { cwd });
        return `⬆️ Promoted to Production!\n\n${stdout}`;
      }
      
      case "rollback": {
        const { stdout } = await execa("vercel", ["rollback"], { cwd });
        return `⏪ Rollback Complete!\n\n${stdout}`;
      }
      
      default:
        return `❌ Unknown action: ${action}`;
    }
  } catch (error) {
    const err = error as Error;
    return `❌ Vercel action failed\n\nError: ${err.message}\n\n💡 Make sure:\n- Vercel CLI is installed: npm i -g vercel\n- You're logged in: vercel login\n- Project is linked: vercel link`;
  }
}

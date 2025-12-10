import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { execa } from "execa";

export const schema = {
  action: z.enum(["create-pr", "review-diff", "get-suggestions"])
    .describe("CodeRabbit action to perform"),
  branch: z.string().optional().describe("Branch name for PR creation"),
  title: z.string().optional().describe("PR title"),
  body: z.string().optional().describe("PR description"),
  workingDirectory: z.string().optional().describe("Git repository directory"),
};

export const metadata: ToolMetadata = {
  name: "coderabbit_review",
  description: `Integrate with CodeRabbit for AI-powered code reviews.
- Create PRs that trigger automatic CodeRabbit reviews
- Get AI suggestions for code improvements
- Analyze diffs before committing`,
  annotations: {
    title: "CodeRabbit Review",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function coderabbitReview({ 
  action, 
  branch, 
  title, 
  body,
  workingDirectory 
}: InferSchema<typeof schema>) {
  const cwd = workingDirectory || process.cwd();

  try {
    switch (action) {
      case "create-pr": {
        if (!branch || !title) {
          return "❌ Branch and title are required for PR creation";
        }
        
        // Push branch and create PR using GitHub CLI
        await execa("git", ["push", "-u", "origin", branch], { cwd });
        const { stdout } = await execa("gh", [
          "pr", "create",
          "--title", title,
          "--body", body || "Created by AgentMesh - CodeRabbit will review automatically",
          "--head", branch
        ], { cwd });
        
        return `✅ PR Created! CodeRabbit will automatically review.\n\n${stdout}\n\n💡 CodeRabbit will post review comments within minutes.`;
      }
      
      case "review-diff": {
        // Get current diff
        const { stdout: diff } = await execa("git", ["diff", "--staged"], { cwd });
        
        if (!diff) {
          return "📝 No staged changes to review. Stage files with `git add` first.";
        }
        
        return `📋 Staged Changes for Review:\n\n\`\`\`diff\n${diff.substring(0, 3000)}${diff.length > 3000 ? '\n...(truncated)' : ''}\n\`\`\`\n\n💡 Create a PR to trigger CodeRabbit's AI review.`;
      }
      
      case "get-suggestions": {
        // Check if there's an open PR
        const { stdout: prList } = await execa("gh", ["pr", "list", "--json", "number,title,url"], { cwd });
        const prs = JSON.parse(prList || "[]");
        
        if (prs.length === 0) {
          return "📝 No open PRs found. Create a PR to get CodeRabbit suggestions.";
        }
        
        // Get comments from the latest PR
        const latestPr = prs[0];
        const { stdout: comments } = await execa("gh", [
          "pr", "view", String(latestPr.number),
          "--json", "comments,reviews"
        ], { cwd });
        
        return `🐰 CodeRabbit Review Status\n\nPR: ${latestPr.title}\nURL: ${latestPr.url}\n\nReview Data:\n${comments}`;
      }
      
      default:
        return `❌ Unknown action: ${action}`;
    }
  } catch (error) {
    const err = error as Error;
    return `❌ CodeRabbit action failed\n\nError: ${err.message}\n\n💡 Make sure:\n- GitHub CLI (gh) is installed and authenticated\n- You're in a git repository\n- CodeRabbit is enabled on the repo`;
  }
}

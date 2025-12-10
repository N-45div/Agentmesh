import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { runClineTask } from "../lib/cline";

export const schema = {
  projectType: z.enum([
    "nextjs-app",
    "express-api", 
    "react-vite",
    "cli-tool",
    "mcp-server",
    "fullstack",
  ]).describe("Type of project to scaffold"),
  name: z.string().describe("Project name"),
  features: z.array(z.string()).optional()
    .describe("Additional features to include (e.g., 'auth', 'database', 'testing')"),
  workingDirectory: z.string().optional().describe("Parent directory for the new project"),
};

export const metadata: ToolMetadata = {
  name: "scaffold_project",
  description: `Scaffold a new project with AI-generated boilerplate.

Project types:
- **nextjs-app**: Next.js 14+ with App Router, TypeScript, Tailwind
- **express-api**: Express.js REST API with TypeScript
- **react-vite**: React + Vite + TypeScript + Tailwind
- **cli-tool**: Node.js CLI with Commander.js
- **mcp-server**: MCP server with XMCP framework
- **fullstack**: Next.js frontend + Express backend

Features can include: auth, database, testing, docker, ci-cd, etc.`,
  annotations: {
    title: "Scaffold Project",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

const PROJECT_TEMPLATES: Record<string, string> = {
  "nextjs-app": `Create a new Next.js 14+ project with:
- App Router
- TypeScript
- Tailwind CSS
- ESLint + Prettier
- Basic folder structure (app, components, lib)
- Example page and layout`,

  "express-api": `Create a new Express.js API project with:
- TypeScript
- Proper folder structure (routes, controllers, middleware)
- Error handling middleware
- Health check endpoint
- Environment configuration
- Basic CORS setup`,

  "react-vite": `Create a new React + Vite project with:
- TypeScript
- Tailwind CSS
- React Router
- Component folder structure
- Example components`,

  "cli-tool": `Create a new Node.js CLI tool with:
- TypeScript
- Commander.js for argument parsing
- Chalk for colored output
- Proper bin configuration
- Example commands`,

  "mcp-server": `Create a new MCP server project with:
- XMCP framework
- TypeScript
- Example tools, prompts, and resources
- HTTP transport configuration
- Ready for Vercel deployment`,

  "fullstack": `Create a fullstack project with:
- Next.js frontend with App Router
- Express.js backend API
- Shared types package
- Monorepo structure with pnpm workspaces
- Docker Compose for development`,
};

export default async function scaffoldProject({ 
  projectType, 
  name, 
  features,
  workingDirectory 
}: InferSchema<typeof schema>) {
  const template = PROJECT_TEMPLATES[projectType];
  if (!template) {
    return `❌ Unknown project type: ${projectType}`;
  }

  let prompt = `Create a new project called "${name}".

${template}`;

  if (features && features.length > 0) {
    prompt += `

Additional features to include:
${features.map(f => `- ${f}`).join('\n')}`;
  }

  prompt += `

Create all necessary files and folders. Make sure the project is immediately runnable.
Include a README.md with setup instructions.`;

  const result = await runClineTask(prompt, {
    cwd: workingDirectory,
  });

  if (result.success) {
    return `🎉 Project "${name}" scaffolded successfully!

Type: ${projectType}
${features?.length ? `Features: ${features.join(', ')}` : ''}

${result.output}

📋 Next steps:
1. cd ${name}
2. pnpm install (or npm install)
3. pnpm dev`;
  } else {
    return `❌ Failed to scaffold project

Error: ${result.error}

${result.output}`;
  }
}

import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { isClineInstalled, getClineVersion } from "../lib/cline";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "cline_status",
  description: `Check if Cline CLI is installed and get version information. 
Use this to verify AgentMesh can execute coding tasks.`,
  annotations: {
    title: "Check Cline Status",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function clineStatus(_args: InferSchema<typeof schema>) {
  const installed = await isClineInstalled();
  const version = installed ? await getClineVersion() : null;

  if (installed) {
    return `✅ Cline CLI v${version} is installed and ready!\n\nAgentMesh can now execute coding tasks.`;
  } else {
    return `❌ Cline CLI is not installed.\n\nTo install, run:\n  npm install -g cline\n\nThen authenticate:\n  cline auth`;
  }
}

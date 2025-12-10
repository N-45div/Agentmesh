/**
 * Cline CLI Wrapper for AgentMesh
 * Provides programmatic access to Cline's autonomous coding capabilities
 */

import { execa, type ExecaError } from "execa";

export interface ClineOptions {
  yolo?: boolean;
  mode?: "act" | "plan";
  cwd?: string;
}

export interface ClineResult {
  success: boolean;
  output: string;
  error?: string;
}

// Use full path to cline if nvm is used
const CLINE_PATH = process.env.CLINE_PATH || "cline";

/**
 * Check if Cline CLI is installed
 */
export async function isClineInstalled(): Promise<boolean> {
  try {
    await execa(CLINE_PATH, ["version"]);
    return true;
  } catch {
    // Try with full nvm path as fallback
    try {
      const nvmPath = `${process.env.HOME}/.nvm/versions/node/v23.11.0/bin/cline`;
      await execa(nvmPath, ["version"]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get Cline CLI version
 */
export async function getClineVersion(): Promise<string> {
  try {
    const { stdout } = await execa(CLINE_PATH, ["version"]);
    return stdout.trim();
  } catch {
    try {
      const nvmPath = `${process.env.HOME}/.nvm/versions/node/v23.11.0/bin/cline`;
      const { stdout } = await execa(nvmPath, ["version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }
}

/**
 * Get the cline executable path
 */
function getClinePath(): string {
  if (process.env.CLINE_PATH) return process.env.CLINE_PATH;
  
  // Try nvm path for common node versions
  const nvmPath = `${process.env.HOME}/.nvm/versions/node/v23.11.0/bin/cline`;
  return nvmPath;
}

/**
 * Run a task with Cline CLI
 */
export async function runClineTask(
  prompt: string,
  options: ClineOptions = {}
): Promise<ClineResult> {
  const clinePath = getClinePath();
  const args: string[] = [];

  // Add flags
  if (options.yolo !== false) args.push("-y"); // Default to yolo mode
  if (options.mode) args.push("-m", options.mode);
  args.push("--output-format", "json"); // JSON output for parsing
  args.push("--oneshot"); // Complete after single response (avoid rate limits)

  // Add prompt
  args.push(prompt);

  try {
    console.log(`[AgentMesh] Running: ${clinePath} ${args.join(" ")}`);
    
    const { stdout, stderr } = await execa(clinePath, args, {
      cwd: options.cwd || process.cwd(),
      timeout: 300000, // 5 minute timeout
      env: {
        ...process.env,
        // Force plain output for easier parsing
        CLINE_OUTPUT_FORMAT: "plain",
      },
    });

    console.log(`[AgentMesh] Cline completed. Output length: ${stdout?.length || 0}`);
    
    // Extract the actual response from Cline's JSON output
    let output = stdout || "Task completed (no output)";
    
    // Try to find the completion_result or plan_mode_respond in the output
    try {
      // Look for completion_result
      const completionMatch = stdout.match(/"say"\s*:\s*"completion_result"[^}]*"text"\s*:\s*"([^"]+)"/);
      if (completionMatch) {
        output = completionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else {
        // Look for plan_mode_respond with the actual response
        const planMatch = stdout.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (planMatch) {
          output = planMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        } else {
          // Try to find any meaningful text response
          const textMatches = stdout.match(/"say"\s*:\s*"text"[^}]*?"text"\s*:\s*"([^"]{50,})"/g);
          if (textMatches && textMatches.length > 0) {
            // Get the longest text response
            const texts = textMatches.map((m: string) => {
              const match = m.match(/"text"\s*:\s*"([^"]+)"/);
              return match ? match[1] : '';
            }).filter((t: string) => t.length > 50);
            if (texts.length > 0) {
              output = texts.sort((a: string, b: string) => b.length - a.length)[0]
                .replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
          }
        }
      }
    } catch {
      // Parsing failed, use raw output but try to clean it up
      output = stdout.substring(0, 2000) + (stdout.length > 2000 ? '...' : '');
    }
    
    return {
      success: true,
      output,
      error: stderr || undefined,
    };
  } catch (err) {
    const error = err as ExecaError;
    console.error(`[AgentMesh] Cline error:`, error.message);
    return {
      success: false,
      output: String(error.stdout ?? ""),
      error: String(error.stderr ?? error.message),
    };
  }
}

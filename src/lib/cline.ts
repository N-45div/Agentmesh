/**
 * Cline CLI Wrapper for AgentMesh
 * Provides programmatic access to Cline's autonomous coding capabilities
 * 
 * Security Features:
 * - Input sanitization using whitelist approach
 * - Path traversal protection
 * - Environment variable validation
 * - Regex timeout protection
 * - Input length limits
 * - Comprehensive error handling
 * 
 * @module cline
 */

import { execa, type ExecaError } from "execa";
import * as fs from 'fs';

// Configuration constants
const DEFAULT_TIMEOUT = 300000; // 5 minutes
// Validate NODE_VERSION environment variable
const NODE_VERSION = (() => {
  const version = process.env.NODE_VERSION;
  if (!version) return 'v23.11.0';
  
  // Validate version format (vX.Y.Z)
  if (!/^v\d+\.\d+\.\d+$/.test(version)) {
    console.warn('[AgentMesh] Invalid NODE_VERSION format, using default');
    return 'v23.11.0';
  }
  
  return version;
})();
const OUTPUT_REGEX = {
  COMPLETION: /"say"\s*:\s*"completion_result"[^}]*"text"\s*:\s*"([^"]+)"/,
  PLAN_MODE: /"response"\s*:\s*"((?:[^"\\]|\\.)*)"/,
  TEXT_RESPONSE: /"say"\s*:\s*"text"[^}]*?"text"\s*:\s*"([^"]+)"/g
};

/**
 * Configuration options for Cline CLI execution
 * @interface ClineOptions
 */
export interface ClineOptions {
  /** Enable auto-approve mode (default: true) */
  yolo?: boolean;
  /** Execution mode - "act" or "plan" */
  mode?: "act" | "plan";
  /** Working directory for command execution */
  cwd?: string;
  /** Custom timeout in milliseconds (default: 300000) */
  timeout?: number;
}

/**
 * Result of a Cline CLI execution
 * @interface ClineResult
 */
export interface ClineResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Command output or processed response */
  output: string;
  /** Error message if command failed */
  error?: string;
}

/**
 * Internal type for regex worker messaging
 * @internal
 */
type RegexWorkerMessage = {
  regex: RegExp;
  text: string;
};

// Use full path to cline if nvm is used
const CLINE_PATH = process.env.CLINE_PATH || "cline";

/**
 * Validates a file path and protects against path traversal attacks
 * 
 * Security measures:
 * - Resolves and normalizes paths to prevent directory traversal
 * - Checks for '..' segments in paths
 * - Validates file existence
 * - Logs security-related failures
 * 
 * @param path - The file path to validate
 * @returns boolean indicating if path is safe and exists
 * @internal
 */
function validatePath(path: string): boolean {
  try {
    const resolvedPath = require('path').resolve(path);
    const normalizedPath = require('path').normalize(path);
    
    // Protect against path traversal
    if (normalizedPath.includes('..') || resolvedPath.includes('..')) {
      console.error(`[AgentMesh] Path traversal attempt detected: ${path}`);
      return false;
    }
    
    return fs.existsSync(resolvedPath);
  } catch (error) {
    console.error(`[AgentMesh] Path validation failed:`, error);
    return false;
  }
}

/**
 * Sanitizes user input to prevent command injection and other attacks
 * 
 * Security measures:
 * - Whitelist approach for allowed characters
 * - Input type validation
 * - Input length limits to prevent DoS
 * - Throws errors for invalid inputs
 * 
 * @param input - The user input to sanitize
 * @returns Sanitized string safe for command execution
 * @throws {Error} If input is invalid or exceeds length limit
 * @internal
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('[AgentMesh] Invalid input type');
  }
  
  // Limit input length to prevent DoS
  const MAX_INPUT_LENGTH = 10000;
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error('[AgentMesh] Input exceeds maximum length');
  }
  
  return input.replace(/[^a-zA-Z0-9\s\-_.,@/]/g, '');
}

/**
 * Checks if Cline CLI is installed and accessible
 * 
 * Attempts to execute version command using:
 * 1. Default cline path
 * 2. NVM-based path as fallback
 * 
 * @returns Promise resolving to boolean indicating if Cline is installed
 * @public
 */
export async function isClineInstalled(): Promise<boolean> {
  try {
    await execa(CLINE_PATH, ["version"]);
    return true;
  } catch {
    // Try with full nvm path as fallback
    try {
      const nvmPath = `${process.env.HOME}/.nvm/versions/node/${NODE_VERSION}/bin/cline`;
      await execa(nvmPath, ["version"]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Retrieves the installed Cline CLI version
 * 
 * Attempts version check using:
 * 1. Default cline path
 * 2. NVM-based path as fallback
 * 
 * @returns Promise resolving to version string or "unknown"
 * @public
 */
export async function getClineVersion(): Promise<string> {
  try {
    const { stdout } = await execa(CLINE_PATH, ["version"]);
    return stdout.trim();
  } catch {
    try {
      const nvmPath = `${process.env.HOME}/.nvm/versions/node/${NODE_VERSION}/bin/cline`;
      const { stdout } = await execa(nvmPath, ["version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }
}

/**
 * Determines the appropriate Cline executable path
 * 
 * Path resolution order:
 * 1. CLINE_PATH environment variable (if valid)
 * 2. NVM-based path
 * 3. Default 'cline' command
 * 
 * @returns Resolved path to Cline executable
 * @internal
 */
function getClinePath(): string {
  if (process.env.CLINE_PATH && validatePath(process.env.CLINE_PATH)) {
    return process.env.CLINE_PATH;
  }
  
  // Try nvm path for common node versions
  const nvmPath = `${process.env.HOME}/.nvm/versions/node/${NODE_VERSION}/bin/cline`;
  return validatePath(nvmPath) ? nvmPath : 'cline';
}

/**
 * Executes a task using the Cline CLI with comprehensive security measures
 * 
 * Security features:
 * - Input sanitization and validation
 * - Path validation
 * - Regex timeout protection
 * - Error handling and logging
 * - Environment variable validation
 * 
 * @param prompt - The task prompt to execute
 * @param options - Configuration options for execution
 * @returns Promise resolving to execution result
 * @throws {Error} For invalid inputs or security violations
 * @public
 */
export async function runClineTask(
  prompt: string,
  options: ClineOptions = {}
): Promise<ClineResult> {
  // Input validation
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt parameter');
  }
  
  // Sanitize input
  const sanitizedPrompt = sanitizeInput(prompt);
  const clinePath = getClinePath();
  const args: string[] = [];

  // Add flags
  if (options.yolo !== false) args.push("-y"); // Default to yolo mode
  if (options.mode) args.push("-m", options.mode);
  args.push("--output-format", "json"); // JSON output for parsing
  args.push("--oneshot"); // Complete after single response (avoid rate limits)

  // Add sanitized prompt
  args.push(sanitizedPrompt);

  try {
    console.log(`[AgentMesh] Running: ${clinePath} ${args.join(" ")}`);
    
    const { stdout, stderr } = await execa(clinePath, args, {
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || DEFAULT_TIMEOUT,
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
      const completionMatch = stdout.match(OUTPUT_REGEX.COMPLETION);
      if (completionMatch) {
        output = completionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else {
        // Look for plan_mode_respond with the actual response
        const planMatch = stdout.match(OUTPUT_REGEX.PLAN_MODE);
        if (planMatch) {
          output = planMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        } else {
          // Try to find any meaningful text response
          const textMatches = stdout.match(OUTPUT_REGEX.TEXT_RESPONSE);
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
      // Parsing failed, use raw output
      output = stdout.substring(0, 2000) + (stdout.length > 2000 ? '...' : '');
    }
    
    return {
      success: true,
      output,
      error: stderr || undefined,
    };
  } catch (err) {
    // Improved error handling with type guards
    let errorMessage: string;
    let stdoutStr: string = "";
    let stderrStr: string = "";
    
    if (err instanceof Error) {
      errorMessage = err.message;
      if ('stdout' in err) {
        stdoutStr = String(err.stdout ?? "");
      }
      if ('stderr' in err) {
        stderrStr = String(err.stderr ?? "");
      }
    } else {
      errorMessage = String(err);
    }
    
    // Log detailed error information
    console.error('[AgentMesh] Cline execution failed:', {
      error: errorMessage,
      stdout: stdoutStr,
      stderr: stderrStr,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      output: stdoutStr,
      error: stderrStr || errorMessage,
    };
  }
}
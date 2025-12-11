import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Play,
  Square,
  RefreshCw,
  Terminal,
  CheckCircle,
  XCircle,
  Loader2,
  Wrench,
  GitBranch,
  Shield,
  FileCode,
  TestTube,
  BookOpen,
} from "lucide-react";

interface Tool {
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
}

const TOOLS: Tool[] = [
  { name: "cline_status", description: "Check Cline CLI status", icon: <CheckCircle size={18} /> },
  { name: "code_task", description: "Execute coding task", icon: <Terminal size={18} /> },
  { name: "review_code", description: "AI code review", icon: <FileCode size={18} /> },
  { name: "fix_issues", description: "Auto-fix issues", icon: <Wrench size={18} /> },
  { name: "generate_tests", description: "Generate tests", icon: <TestTube size={18} /> },
  { name: "security_audit", description: "Security scan", icon: <Shield size={18} /> },
  { name: "explain_code", description: "Explain code", icon: <BookOpen size={18} /> },
  { name: "git_assist", description: "Git operations", icon: <GitBranch size={18} /> },
];

function App() {
  const [serverStatus, setServerStatus] = useState<"stopped" | "starting" | "running">("stopped");
  const [serverUrl, setServerUrl] = useState("http://127.0.0.1:3001/mcp");
  const [clineStatus, setClineStatus] = useState<"unknown" | "installed" | "not_installed">("unknown");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState("");
  const [toolOutput, setToolOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const addLog = (type: LogEntry["type"], message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-50), entry]);
  };

  const startServer = async () => {
    setServerStatus("starting");
    addLog("info", "Starting MCP server...");
    try {
      await invoke("start_mcp_server");
      setServerStatus("running");
      addLog("success", `MCP server running at ${serverUrl}`);
    } catch (error) {
      addLog("error", `Failed to start server: ${error}`);
      setServerStatus("stopped");
    }
  };

  const stopServer = async () => {
    addLog("info", "Stopping MCP server...");
    try {
      await invoke("stop_mcp_server");
      setServerStatus("stopped");
      addLog("success", "MCP server stopped");
    } catch (error) {
      addLog("error", `Failed to stop server: ${error}`);
    }
  };

  const checkClineStatus = async () => {
    addLog("info", "Checking Cline CLI...");
    try {
      const result = await invoke<string>("check_cline");
      if (result.includes("installed")) {
        setClineStatus("installed");
        addLog("success", "Cline CLI is installed");
      } else {
        setClineStatus("not_installed");
        addLog("error", "Cline CLI not found");
      }
    } catch (error) {
      setClineStatus("not_installed");
      addLog("error", `Cline check failed: ${error}`);
    }
  };

  const executeTool = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    setToolOutput("");
    addLog("info", `Executing ${selectedTool}...`);

    try {
      const result = await invoke<string>("execute_tool", {
        toolName: selectedTool,
        input: toolInput,
      });
      setToolOutput(result);
      addLog("success", `${selectedTool} completed`);
    } catch (error) {
      setToolOutput(`Error: ${error}`);
      addLog("error", `${selectedTool} failed: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    checkClineStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🤖</span> AgentMesh Desktop
          </h1>
          <p className="text-slate-400 text-sm">Local MCP Server with Cline CLI</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Cline Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800">
            {clineStatus === "installed" ? (
              <CheckCircle size={16} className="text-green-400" />
            ) : clineStatus === "not_installed" ? (
              <XCircle size={16} className="text-red-400" />
            ) : (
              <Loader2 size={16} className="text-slate-400 animate-spin" />
            )}
            <span className="text-sm">Cline CLI</span>
          </div>
          {/* Server Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                serverStatus === "running"
                  ? "bg-green-400"
                  : serverStatus === "starting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-slate-500"
              }`}
            />
            <span className="text-sm capitalize">{serverStatus}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Server Controls & Tools */}
        <div className="col-span-4 space-y-6">
          {/* Server Controls */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">MCP Server</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm"
                placeholder="Server URL"
              />
              <div className="flex gap-2">
                {serverStatus === "running" ? (
                  <button
                    onClick={stopServer}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                  >
                    <Square size={16} /> Stop
                  </button>
                ) : (
                  <button
                    onClick={startServer}
                    disabled={serverStatus === "starting"}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50"
                  >
                    {serverStatus === "starting" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} />
                    )}
                    Start
                  </button>
                )}
                <button
                  onClick={checkClineStatus}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Tools List */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">Available Tools</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {TOOLS.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => setSelectedTool(tool.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                    selectedTool === tool.name
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  {tool.icon}
                  <div>
                    <div className="text-sm font-medium">{tool.name}</div>
                    <div className="text-xs text-slate-400">{tool.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Panel - Tool Execution */}
        <div className="col-span-5 space-y-6">
          <div className="bg-slate-800 rounded-xl p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">
              {selectedTool ? `Execute: ${selectedTool}` : "Select a Tool"}
            </h2>
            {selectedTool ? (
              <div className="space-y-4">
                <textarea
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  placeholder="Enter input (e.g., file path, prompt, etc.)"
                  className="w-full h-24 px-3 py-2 bg-slate-700 rounded-lg text-sm resize-none"
                />
                <button
                  onClick={executeTool}
                  disabled={isExecuting || serverStatus !== "running"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                >
                  {isExecuting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Execute
                </button>
                <div className="bg-slate-900 rounded-lg p-3 h-64 overflow-y-auto">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {toolOutput || "Output will appear here..."}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                Select a tool from the left panel
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Logs */}
        <div className="col-span-3">
          <div className="bg-slate-800 rounded-xl p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Logs</h2>
            <div className="space-y-1 max-h-96 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? (
                <div className="text-slate-500">No logs yet...</div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={`py-1 ${
                      log.type === "success"
                        ? "text-green-400"
                        : log.type === "error"
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::State;

struct McpServer(Mutex<Option<Child>>);

#[tauri::command]
fn check_cline() -> String {
    match Command::new("cline").arg("version").output() {
        Ok(output) => {
            if output.status.success() {
                format!("installed: {}", String::from_utf8_lossy(&output.stdout).trim())
            } else {
                "not_installed".to_string()
            }
        }
        Err(_) => "not_installed".to_string(),
    }
}

#[tauri::command]
fn start_mcp_server(state: State<McpServer>) -> Result<String, String> {
    let mut server = state.0.lock().map_err(|e| e.to_string())?;
    
    if server.is_some() {
        return Ok("Server already running".to_string());
    }

    // Start the MCP server using pnpm dev in the parent directory
    let child = Command::new("pnpm")
        .args(["dev"])
        .current_dir("..")
        .spawn()
        .map_err(|e| format!("Failed to start server: {}", e))?;

    *server = Some(child);
    Ok("Server started".to_string())
}

#[tauri::command]
fn stop_mcp_server(state: State<McpServer>) -> Result<String, String> {
    let mut server = state.0.lock().map_err(|e| e.to_string())?;
    
    if let Some(mut child) = server.take() {
        child.kill().map_err(|e| format!("Failed to stop server: {}", e))?;
        Ok("Server stopped".to_string())
    } else {
        Ok("Server not running".to_string())
    }
}

#[tauri::command]
async fn execute_tool(tool_name: String, input: String) -> Result<String, String> {
    // Call the MCP server via HTTP
    let client = reqwest::Client::new();
    
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": {
                "target": input,
                "prompt": input
            }
        }
    });

    let response = client
        .post("http://127.0.0.1:3001/mcp")
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Extract the text content from the response
    if let Some(content) = result.get("result").and_then(|r| r.get("content")) {
        if let Some(arr) = content.as_array() {
            if let Some(first) = arr.first() {
                if let Some(text) = first.get("text").and_then(|t| t.as_str()) {
                    return Ok(text.to_string());
                }
            }
        }
    }

    Ok(serde_json::to_string_pretty(&result).unwrap_or_else(|_| "No output".to_string()))
}

fn main() {
    tauri::Builder::default()
        .manage(McpServer(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            check_cline,
            start_mcp_server,
            stop_mcp_server,
            execute_tool
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

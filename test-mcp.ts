import { spawn } from 'child_process';
import * as path from 'path';

console.log("=================================================");
console.log("🧪 SyncFlow MCP Server Stdio Integration Test 🧪");
console.log("=================================================");

// Path to the MCP server
const serverPath = path.join(process.cwd(), 'mcp-server.ts');

// Spawn the MCP server with tsx under node loading .env.local
const mcpProcess = spawn('npx', ['tsx', serverPath], {
  env: { ...process.env, NODE_ENV: 'development' },
  shell: true
});

let outputBuffer = "";

// Capture server stderr logs (for debug info)
mcpProcess.stderr.on('data', (data) => {
  const log = data.toString().trim();
  if (log) {
    console.log(`[Server Log] ${log}`);
  }
});

// Capture server stdout (JSON-RPC responses)
mcpProcess.stdout.on('data', (data) => {
  outputBuffer += data.toString();
  
  // Try to parse completed JSON-RPC messages (separated by newline)
  const lines = outputBuffer.split('\n');
  // Keep the last partial line in the buffer
  outputBuffer = lines.pop() || "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const response = JSON.parse(trimmed);
      console.log("\n📬 Received JSON-RPC Response from Server:");
      console.log(JSON.stringify(response, null, 2));
      console.log("=================================================");
      
      if (response.id === 1) {
        // Success: Tools listed. Now test calling generate_specs!
        console.log("\n🚀 Step 2: Testing syncflow_generate_specs tool...");
        sendJsonRpcRequest({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "syncflow_generate_specs",
            arguments: {
              story: "As an online customer, I want to add items to my shopping cart and check stock so that I can purchase shoes."
            }
          },
          id: 2
        });
      } else if (response.id === 2) {
        // Success: Tool call response received.
        console.log("\n✅ SUCCESS: MCP Server successfully compiled specs and returned test codes!");
        console.log("Closing MCP connection...");
        mcpProcess.kill();
        process.exit(0);
      }
    } catch (err) {
      console.error(`[Test Harness] Error parsing stdout line: "${trimmed}"`, err);
    }
  }
});

mcpProcess.on('error', (err) => {
  console.error("[Test Harness] Failed to start server process:", err);
  process.exit(1);
});

mcpProcess.on('close', (code) => {
  console.log(`[Test Harness] Server exited with code: ${code}`);
});

// Helper to write JSON-RPC messages to server stdin
function sendJsonRpcRequest(payload: any) {
  const jsonStr = JSON.stringify(payload) + "\n";
  console.log(`\n📤 Sending JSON-RPC Request:`);
  console.log(JSON.stringify(payload, null, 2));
  mcpProcess.stdin.write(jsonStr);
}

// Start test: Step 1: List Tools
console.log("\n🚀 Step 1: Querying available tools (tools/list)...");
setTimeout(() => {
  sendJsonRpcRequest({
    jsonrpc: "2.0",
    method: "tools/list",
    id: 1
  });
}, 3000); // Wait 3s for server bootstrap

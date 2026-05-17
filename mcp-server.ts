import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

import { Octokit } from "@octokit/rest";

const execPromise = promisify(exec);

// ----------------------------------------------------
// Robust Environment Variables Loader (.env.local)
// ----------------------------------------------------
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
          }
        }
      });
      console.error("[SyncFlow MCP] Environment variables loaded from .env.local");
    } catch (err) {
      console.error("[SyncFlow MCP] Failed to parse .env.local:", err);
    }
  } else {
    console.error("[SyncFlow MCP] No .env.local file found at:", envPath);
  }
}

loadEnvLocal();

// Ensure standard Google API Key environment is configured
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.error("[SyncFlow MCP] WARNING: GOOGLE_GENERATIVE_AI_API_KEY is not defined.");
}

// Set up preferred model: using active gemini-2.5-flash
const PREFERRED_MODEL = 'gemini-2.5-flash';

// ----------------------------------------------------
// Robust JSON Parser & Extractor (Immune to LLM fluff/markdown wrapper)
// ----------------------------------------------------
function extractAndParseJson(text: string) {
  let cleanText = text.trim();
  
  // Strip starting ```json or ```
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '');
  // Strip ending ```
  cleanText = cleanText.replace(/\s*```$/, '');
  cleanText = cleanText.trim();

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    // Robust search: find the very first '{' and match brackets to find the correct outer closing '}'
    const firstBrace = cleanText.indexOf('{');
    if (firstBrace !== -1) {
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = firstBrace; i < cleanText.length; i++) {
        const char = cleanText[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const jsonCandidate = cleanText.substring(firstBrace, i + 1);
              try {
                return JSON.parse(jsonCandidate);
              } catch (innerErr) {
                // Ignore parsing errors inside candidates and continue matching outer braces
              }
            }
          }
        }
      }
    }
    throw err;
  }
}

// ----------------------------------------------------
// MCP Server Initialization
// ----------------------------------------------------
const server = new Server(
  {
    name: "SyncFlow QA Agent Server",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ----------------------------------------------------
// Define Available Tools
// ----------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "syncflow_generate_specs",
        description: "Analyze a user story or product requirement and compile Gherkin scenarios, automated test skeletons (TypeScript Playwright, Python pytest-playwright, Java Selenium), and manual TestRail cases.",
        inputSchema: {
          type: "object",
          properties: {
            story: {
              type: "string",
              description: "The User Story, epic, feature brief, or acceptance criteria description."
            }
          },
          required: ["story"]
        }
      },
      {
        name: "syncflow_run_and_debug",
        description: "Execute an automated test suite locally, capture failures, and utilize AI intelligence to automatically patch, heal, and fix failing locators, assertions, or wait states.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "The absolute or relative path to the local test file to run (e.g., tests/shopping-cart.spec.ts)."
            },
            runCommand: {
              type: "string",
              description: "Optional. Custom test execution command (e.g., 'npx playwright test' or 'pytest'). Defaults to 'npx playwright test'."
            },
            autoFix: {
              type: "boolean",
              description: "Optional. If true, SyncFlow will automatically overwrite the test file with the healed code fix. Defaults to false."
            }
          },
          required: ["filePath"]
        }
      },
      {
        name: "syncflow_diagnose_failure",
        description: "Analyze test automation failure outputs (stacktrace/errors) and propose root cause analysis + immediate code patches/fixes.",
        inputSchema: {
          type: "object",
          properties: {
            errorLogs: {
              type: "string",
              description: "The test run execution logs, terminal failures, or playwright crash stacktrace."
            },
            contextCode: {
              type: "string",
              description: "Optional. The original test file source code snippet containing the failing assertion or locator."
            }
          },
          required: ["errorLogs"]
        }
      },
      {
        name: "syncflow_export_to_github",
        description: "Autonomously create a new GitHub branch, commit test assets (Gherkin specs and automation code), and initialize a Pull Request for a given user story.",
        inputSchema: {
          type: "object",
          properties: {
            story: {
              type: "string",
              description: "The User Story or requirement description."
            },
            gherkin: {
              type: "string",
              description: "The full Gherkin feature text to commit."
            },
            code: {
              type: "string",
              description: "The automated test source code to commit."
            },
            language: {
              type: "string",
              description: "The programming language of the test code (TypeScript, Python, or Java)."
            }
          },
          required: ["story", "gherkin", "code", "language"]
        }
      }
    ]
  };
});

// ----------------------------------------------------
// Handle Tool Execution Requests
// ----------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "syncflow_generate_specs") {
      const { story } = args as { story: string };
      if (!story || story.trim().length < 15) {
        return {
          content: [{
            type: "text",
            text: "Error: Please provide a valid, descriptive requirement (minimum 15 characters)."
          }],
          isError: true
        };
      }

      console.error(`[SyncFlow MCP] Generating test specs using ${PREFERRED_MODEL} for story: "${story.substring(0, 40)}..."`);

      const prompt = `
        You are an elite QA Automation Architect and Lead SDET.
        Analyze the following User Story and convert it into a comprehensive acceptance test suite:
        1. Gherkin Acceptance Criteria: High-quality, industry-standard feature scenarios.
        2. Automation test skeletons for Playwright/Selenium in three languages:
           - TypeScript (Playwright with standard assertions)
           - Python (Playwright with pytest-playwright syntax)
           - Java (Selenium WebDriver with TestNG assertions)
        3. Manual Test Cases (TestRail format): Detailed step-by-step test cases containing:
           - Section Name / Title
           - Pre-conditions
           - Steps with Action and Expected Result

        User Story: "${story}"

        You MUST return a JSON object with exactly these keys:
        - "gherkin": (string) The full Gherkin feature text.
        - "playwright": (object) An object containing exactly three keys:
           - "TypeScript": (string) The Playwright TypeScript code.
           - "Python": (string) The Playwright Python code.
           - "Java": (string) The Selenium Java code.
        - "testrail": (string) The manual TestRail formatted test cases.

        CRITICAL JSON FORMATTING RULES:
        1. Do not wrap the JSON in markdown blocks like \`\`\`json. Just return the raw parseable JSON string.
        2. All keys and string values must use double quotes.
        3. IMPORTANT: Any nested double quotes inside code snippets must be properly escaped (e.g. use \\" for nested quotes inside the JSON string properties, or use single quotes ' inside the code snippets to completely avoid quote conflicts).
        4. Do not include trailing commas in arrays or objects.
      `;

      const { text } = await generateText({
        model: google(PREFERRED_MODEL),
        prompt: prompt,
      });
      
      const parsed = extractAndParseJson(text);
      const payloadText = JSON.stringify(parsed, null, 2);

      return {
        content: [{
          type: "text",
          text: payloadText
        }]
      };
    }

    if (name === "syncflow_run_and_debug") {
      const { filePath, runCommand = "npx playwright test", autoFix = false } = args as {
        filePath: string;
        runCommand?: string;
        autoFix?: boolean;
      };

      const resolvedPath = path.resolve(filePath);
      console.error(`[SyncFlow MCP] Executing local tests at: ${resolvedPath} with command: "${runCommand}"`);

      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [{
            type: "text",
            text: `Error: The test file does not exist at path: ${resolvedPath}`
          }],
          isError: true
        };
      }

      const originalCode = fs.readFileSync(resolvedPath, 'utf8');
      const fullCmd = `${runCommand} "${resolvedPath}"`;
      
      let testPassed = true;
      let consoleOutput = "";
      
      try {
        const { stdout, stderr } = await execPromise(fullCmd);
        consoleOutput = stdout + "\n" + stderr;
      } catch (execError: any) {
        testPassed = false;
        consoleOutput = (execError.stdout || "") + "\n" + (execError.stderr || "") + "\n" + (execError.message || "");
      }

      if (testPassed) {
        return {
          content: [{
            type: "text",
            text: `✅ Test run completed successfully!\n\n--- OUTPUT ---\n${consoleOutput}`
          }]
        };
      }

      // Test failed! Run Self-Healing AI diagnosis
      console.error("[SyncFlow MCP] Test suite failed. Spawning self-healing intelligence core...");
      
      const diagnosisPrompt = `
        You are a Staff QA Self-Healing Intelligence Agent.
        An automated test run has just failed. Analyze the logs and code to propose an automated fix.
        
        --- TEST FILE PATH ---
        ${filePath}
        
        --- ORIGINAL CODE ---
        ${originalCode}
        
        --- RUN EXECUTION OUTPUT ---
        ${consoleOutput}
        
        Provide:
        1. **Analysis & Root Cause**: Why did the test fail? (e.g., locator mismatch, element hidden, page timeout).
        2. **Healed Code**: The full updated, corrected code for the test file (with fixes applied like updated selectors, waiting mechanisms, or corrected assertions).
        
        You MUST return your response in JSON format so we can automatically parse and apply the patch.
        Format your response as a raw parseable JSON string with these EXACT keys:
        - "analysis": (string) Markdown description of root cause and fix explanation.
        - "healedCode": (string) The full, corrected test file source code containing the fix.
        
        Do not wrap the JSON in markdown blocks like \`\`\`json. Just return the raw parseable JSON string.
      `;

      const { text } = await generateText({
        model: google(PREFERRED_MODEL),
        prompt: diagnosisPrompt,
      });
      
      const diagnosisResult = extractAndParseJson(text);

      let fileWriteStatus = "Healed Code proposal ready (autoFix was set to false).";
      if (autoFix && diagnosisResult.healedCode) {
        try {
          fs.writeFileSync(resolvedPath, diagnosisResult.healedCode, 'utf8');
          fileWriteStatus = "🎉 HEALED! SyncFlow automatically overwrote the file with the healed code fix.";
        } catch (writeErr: any) {
          fileWriteStatus = `Error applying autoFix: ${writeErr.message}`;
        }
      }

      return {
        content: [{
          type: "text",
          text: `❌ Test run failed!\n\n--- ORIGINAL RUN OUTPUT ---\n${consoleOutput}\n\n=================================================\n🧠 AI SELF-HEALING DIAGNOSIS (${PREFERRED_MODEL})\n=================================================\n\n${diagnosisResult.analysis}\n\n--- FILE PATCH STATUS ---\n${fileWriteStatus}\n\n--- HEALED CODE PROPOSAL ---\n\`\`\`typescript\n${diagnosisResult.healedCode}\n\`\`\``
        }]
      };
    }

    if (name === "syncflow_diagnose_failure") {
      const { errorLogs, contextCode } = args as { errorLogs: string; contextCode?: string };
      console.error("[SyncFlow MCP] Diagnosing failure logs...");

      const prompt = `
        You are a Staff QA Failure Intelligence Agent.
        Analyze this automated test suite failure:
        
        --- FAILURE LOGS ---
        ${errorLogs}
        
        ${contextCode ? `--- CONTEXT CODE ---\n${contextCode}` : ""}
        
        Identify:
        1. **Root Cause**: What exactly failed (e.g., Flaky locator, page network timeout, modal blocking element click, incorrect assertion value).
        2. **Category**: One of ["Element Hidden", "Timeout", "Assertion Failure", "Network/API Issue", "Flaky Test"].
        3. **Suggested Code Fix**: Provide a code patch or correction for the automated test script.
        
        Return your analysis formatted clearly in Markdown.
      `;

      const { text } = await generateText({
        model: google(PREFERRED_MODEL),
        prompt: prompt,
      });
      const responseText = text;

      return {
        content: [{
          type: "text",
          text: responseText
        }]
      };
    }

    if (name === "syncflow_export_to_github") {
      const { story, gherkin, code, language } = args as {
        story: string;
        gherkin: string;
        code: string;
        language: string;
      };

      const token = process.env.GITHUB_TOKEN;
      const owner = process.env.GITHUB_OWNER || "pdabholegithub";
      const repo = process.env.GITHUB_REPO || "specs-ai";

      if (!token || token.includes("your_personal_access_token")) {
        return {
          content: [{
            type: "text",
            text: "Error: GITHUB_TOKEN is not configured in .env.local. Please add a valid Personal Access Token to use this tool."
          }],
          isError: true
        };
      }

      console.error(`[SyncFlow MCP] Exporting autonomous PR for: "${story.substring(0, 40)}..."`);

      try {
        const octokit = new Octokit({ auth: token });
        const timestamp = Date.now();
        const branchName = `syncflow/mcp-feature-${timestamp}`;
        const mainBranch = "main";

        // 1. Get main branch ref
        const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${mainBranch}` });
        const latestCommitSha = refData.object.sha;

        // 2. Create branch
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: latestCommitSha,
        });

        // 3. Commit files
        const fileExtension = language === "TypeScript" ? "spec.ts" : language === "Python" ? "py" : "java";
        const fileName = `tests/syncflow_mcp_${timestamp}.${fileExtension}`;
        const gherkinFileName = `tests/syncflow_mcp_${timestamp}.feature`;

        const files = [
          { path: fileName, content: code, msg: `feat(test): autonomous mcp test for ${story.substring(0, 30)}...` },
          { path: gherkinFileName, content: gherkin, msg: `feat(spec): autonomous mcp gherkin for ${story.substring(0, 30)}...` }
        ];

        for (const file of files) {
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: file.path,
            message: file.msg,
            content: Buffer.from(file.content).toString("base64"),
            branch: branchName,
          });
        }

        // 4. Create Draft PR (enforces Secure HITL Pattern)
        const { data: prData } = await octokit.pulls.create({
          owner,
          repo,
          title: `🤖 [SyncFlow MCP] Autonomous PR: ${story.substring(0, 50)}...`,
          head: branchName,
          base: mainBranch,
          draft: true,
          body: `## 🚀 SyncFlow MCP Autonomous Export\nGenerated via local AI Editor MCP Tool.\n\n### Requirement:\n> ${story}\n\n---\n*Sent from SyncFlow QA Agent Server — Draft PR: Human review required before merge.*`
        });

        return {
          content: [{
            type: "text",
            text: `✅ SUCCESS: Autonomous Pull Request created successfully!\n\n🔗 PR URL: ${prData.html_url}\n🌿 Branch: ${branchName}`
          }]
        };
      } catch (ghErr: unknown) {
        const msg = ghErr instanceof Error ? ghErr.message : 'Unknown GitHub API error';
        throw new Error(`GitHub API Error: ${msg}`);
      }
    }

    throw new Error(`Tool "${name}" is not implemented.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    console.error(`[SyncFlow MCP] Error handling tool call "${name}":`, err);
    return {
      content: [{
        type: "text",
        text: `Execution failed: ${message}`
      }],
      isError: true
    };
  }
});

// ----------------------------------------------------
// Standalone Runner Transport
// ----------------------------------------------------
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[SyncFlow MCP] Server is actively listening on Stdio channel.");
}

run().catch((error) => {
  console.error("[SyncFlow MCP] Fatal server bootstrap crash:", error);
  process.exit(1);
});

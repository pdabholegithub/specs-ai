import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

// Robust JSON parser helper
function extractAndParseJson(text: string) {
  let cleanText = text.trim();
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '');
  cleanText = cleanText.replace(/\s*```$/, '');
  cleanText = cleanText.trim();
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    const firstBrace = cleanText.indexOf('{');
    if (firstBrace !== -1) {
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      for (let i = firstBrace; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const jsonCandidate = cleanText.substring(firstBrace, i + 1);
              try { return JSON.parse(jsonCandidate); } catch (e) {}
            }
          }
        }
      }
    }
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const { errorLogs, originalCode, filePath, accessCode } = await req.json();

    // 1. Security check
    const requiredCode = process.env.SPECS_ACCESS_CODE || "DemoSpecs2026";
    if (!accessCode || accessCode.trim() !== requiredCode.trim()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!errorLogs || !originalCode) {
      return NextResponse.json({ error: "Missing logs or code for diagnosis." }, { status: 400 });
    }

    console.log(`[CI HEALING] Analyzing failure for file: ${filePath}`);

    // 2. AI Diagnosis and Healing
    const prompt = `
      You are a Staff QA Self-Healing Intelligence Agent.
      An automated test run in CI/CD has failed. Analyze the logs and code to provide an automated fix.
      
      --- TEST FILE PATH ---
      ${filePath}
      
      --- ORIGINAL CODE ---
      ${originalCode}
      
      --- CI FAILURE LOGS ---
      ${errorLogs}
      
      Provide:
      1. **Analysis**: Why did the test fail?
      2. **Healed Code**: The full updated, corrected code for the test file.
      
      You MUST return your response as a raw parseable JSON string with these EXACT keys:
      - "analysis": (string) Markdown description of root cause.
      - "healedCode": (string) The full, corrected test file source code.
    `;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
    });

    const result = extractAndParseJson(text);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[CI HEALING ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractAndParseJson } from '@/lib/json-parser';

// Memory Recall Helper: surfaces the last 5 successful fixes as context
function getHistoricalContext(): string {
  const historyDir = path.join(process.cwd(), 'src/data/healing-history');
  if (!fs.existsSync(historyDir)) return '';

  try {
    const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
    const history = files.slice(-5).map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(historyDir, file), 'utf8'));
      return `[Past Fix]: ${content.analysis.substring(0, 200)}... (File: ${content.filePath})`;
    });
    return history.length > 0
      ? '\n--- HISTORICAL CONTEXT (Past Successful Fixes) ---\n' + history.join('\n')
      : '';
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { errorLogs, originalCode, filePath, accessCode, screenshot } = await req.json();

    // Security check
    const requiredCode = process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026';
    if (!accessCode || accessCode.trim() !== requiredCode.trim()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!errorLogs || !originalCode) {
      return NextResponse.json({ error: 'Missing logs or code for diagnosis.' }, { status: 400 });
    }

    console.log(`[CI HEALING] Analyzing failure for: ${filePath} (Visual Healing: ${!!screenshot})`);

    const systemInstruction = `
      You are a Staff QA Self-Healing Intelligence Agent.
      An automated test run in CI/CD has failed. Analyze the logs, code, and optional screenshot to provide an automated fix.
      
      You MUST return your response as a raw parseable JSON string with these EXACT keys:
      - "analysis": (string) Markdown description of root cause.
      - "healedCode": (string) The full, corrected test file source code.
    `;

    const historyContext = getHistoricalContext();

    const userPrompt = `
      --- TEST FILE PATH ---
      ${filePath}
      
      --- ORIGINAL CODE ---
      ${originalCode}
      
      --- CI FAILURE LOGS ---
      ${errorLogs}
      
      ${historyContext}
      
      ${screenshot ? '--- VISUAL SCREENSHOT --- (Attached to this message)' : ''}
      
      Analyze the provided data. Use the Historical Context if it contains patterns similar to the current failure.
      If a screenshot is attached, use it to identify visual discrepancies or UI state issues.
      Provide the diagnosis and the full corrected code.
    `;

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      messages: [
        { role: 'system', content: systemInstruction },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...(screenshot ? [{
              type: 'image' as const,
              image: Buffer.from(screenshot, 'base64')
            }] : [])
          ]
        }
      ]
    });

    const result = extractAndParseJson(text);
    return NextResponse.json(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Healing failed.';
    console.error('[CI HEALING ERROR]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { extractAndParseJson } from '@/lib/json-parser';

// IP rate limit cache: in-memory map of IP to reset time and counter
// NOTE: This resets on serverless cold starts. For production use,
// replace with a persistent store (e.g., Upstash Redis / Vercel KV).
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const timestamp = new Date().toISOString();

  try {
    const { story, accessCode } = await req.json();

    // Layer 1: Access Passcode Protection
    const requiredCode = process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026';
    if (!accessCode || accessCode.trim() !== requiredCode.trim()) {
      console.warn(`[SECURITY WARN] [${timestamp}] Unauthorized access attempt. IP: ${ip}`);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing access passcode.' },
        { status: 401 }
      );
    }

    // Layer 2: IP-Based Rate Limiting
    const now = Date.now();
    let limitData = ipRateLimitMap.get(ip);

    if (!limitData || now > limitData.resetTime) {
      limitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    }

    if (limitData.count >= RATE_LIMIT_COUNT) {
      const minutesLeft = Math.ceil((limitData.resetTime - now) / 1000 / 60);
      console.warn(`[SECURITY WARN] [${timestamp}] Rate limit exceeded for IP: ${ip}.`);
      return NextResponse.json(
        { error: `Too Many Requests: Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    limitData.count++;
    ipRateLimitMap.set(ip, limitData);

    // Layer 3: Input Validation
    console.log(`[AUDIT LOG] [${timestamp}] Request from IP: ${ip}, Requests: ${limitData.count}/${RATE_LIMIT_COUNT}`);

    if (!story || story.trim().length < 15) {
      return NextResponse.json(
        { error: 'Invalid Input: Please provide a descriptive requirement (minimum 15 characters).' },
        { status: 400 }
      );
    }

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
      1. Do not wrap the JSON in markdown blocks like \`\`\`json. Return only the raw JSON string.
      2. All keys and string values must use double quotes.
      3. Any nested double quotes inside code snippets must be properly escaped (\\").
      4. Do not include trailing commas in arrays or objects.
    `;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    const parsed = extractAndParseJson(text);
    return NextResponse.json(parsed);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate specs.';
    console.error(`[AUDIT LOG] [${timestamp}] Generation Error for IP ${ip}:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

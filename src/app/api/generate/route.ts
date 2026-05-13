import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

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

// IP rate limit cache: in-memory maps IP to reset time and counter
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_COUNT = 5; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in ms

export async function POST(req: Request) {
  // Capture client IP address securely
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const timestamp = new Date().toISOString();

  try {
    const { story, accessCode } = await req.json();

    // ----------------------------------------------------
    // Layer 1: Access Passcode Protection
    // ----------------------------------------------------
    const requiredCode = process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026';
    if (!accessCode || accessCode.trim() !== requiredCode.trim()) {
      console.warn(`[SECURITY WARN] [${timestamp}] Unauthorized API access attempt. IP: ${ip}, PromptLength: ${story?.length || 0}`);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing access passcode. Please input the correct passcode in the settings panel to proceed.' },
        { status: 401 }
      );
    }

    // ----------------------------------------------------
    // Layer 2: IP-Based Rate Limiting
    // ----------------------------------------------------
    const now = Date.now();
    let limitData = ipRateLimitMap.get(ip);

    if (!limitData || now > limitData.resetTime) {
      // Initialize or reset limit window
      limitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    }

    if (limitData.count >= RATE_LIMIT_COUNT) {
      const minutesLeft = Math.ceil((limitData.resetTime - now) / 1000 / 60);
      console.warn(`[SECURITY WARN] [${timestamp}] Rate limit exceeded for IP: ${ip}. Blocked further Gemini token consumption.`);
      return NextResponse.json(
        { error: `Too Many Requests: Rate limit exceeded for this IP. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    // Increment request count
    limitData.count++;
    ipRateLimitMap.set(ip, limitData);

    // ----------------------------------------------------
    // Layer 3: Security & Usage Auditing Logs
    // ----------------------------------------------------
    console.log(`[AUDIT LOG] [${timestamp}] User request received. IP: ${ip}, PromptLength: ${story?.length || 0}, RequestsThisHour: ${limitData.count}/${RATE_LIMIT_COUNT}`);

    if (!story || story.trim().length < 15) {
      return NextResponse.json(
        { error: 'Invalid Input: Please provide a valid requirement story description (minimum 15 characters).' },
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
      1. Do not wrap the JSON in markdown blocks like \`\`\`json. Just return the raw parseable JSON string.
      2. All keys and string values must use double quotes.
      3. IMPORTANT: Any nested double quotes inside code snippets must be properly escaped (e.g. use \\" for nested quotes inside the JSON string properties, or use single quotes ' inside the code snippets to completely avoid quote conflicts).
      4. Do not include trailing commas in arrays or objects.
    `;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
    });

    const parsed = extractAndParseJson(text);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(`[AUDIT LOG] [${timestamp}] Generation Error for IP ${ip}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate specs.' },
      { status: 500 }
    );
  }
}

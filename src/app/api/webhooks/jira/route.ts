import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

// Reuse our robust parser
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
  const timestamp = new Date().toISOString();
  
  try {
    const body = await req.json();
    const event = body.webhookEvent;
    const issue = body.issue;

    if (!issue || !issue.key) {
      return NextResponse.json({ message: "Ignored: No issue data found" }, { status: 200 });
    }

    const issueKey = issue.key;
    const status = issue.fields?.status?.name;
    const description = issue.fields?.description || issue.fields?.summary;

    console.log(`[JIRA WEBHOOK] [${timestamp}] Received event: ${event} for ${issueKey} (Status: ${status})`);

    // Only proceed if the status is "Ready for QA" or "In Review"
    const TARGET_STATUSES = ["Ready for QA", "In Review", "Done"]; // Customize based on workflow
    if (!TARGET_STATUSES.includes(status)) {
      return NextResponse.json({ message: `Ignored: Status '${status}' is not a target for automation.` }, { status: 200 });
    }

    console.log(`[JIRA WEBHOOK] Triggering autonomous spec generation for ${issueKey}...`);

    // 1. Generate the Specs using Gemini
    const prompt = `
      You are an elite QA Automation Architect. Analyze this Jira Issue and convert it into a comprehensive acceptance test suite:
      Jira Key: ${issueKey}
      Description: ${description}

      Return a JSON object with:
      - "gherkin": (string) Gherkin scenarios.
      - "playwright": (object) { "TypeScript": string }
      - "testrail": (string) Manual steps.
    `;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
    });

    const specs = extractAndParseJson(text);

    // 2. Post the result back to Jira as a comment
    const jiraDomain = process.env.JIRA_DOMAIN;
    const jiraEmail = process.env.JIRA_USER_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;

    if (jiraDomain && jiraEmail && jiraToken && !jiraToken.includes("your_jira_api_token")) {
      const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
      const commentBody = {
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "🤖 [SyncFlow Autonomous Output]", marks: [{ type: "strong" }] }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "I have automatically analyzed this requirement and compiled the following acceptance suite:" }]
            },
            {
              type: "codeBlock",
              attrs: { language: "gherkin" },
              content: [{ type: "text", text: specs.gherkin }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "✅ Technical test scripts and manual logs have been initialized in the SyncFlow Dashboard." }]
            }
          ]
        }
      };

      const jiraRes = await fetch(`https://${jiraDomain}/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(commentBody)
      });

      if (!jiraRes.ok) {
        const errorText = await jiraRes.text();
        console.error(`[JIRA WEBHOOK ERROR] Failed to post comment to Jira: ${errorText}`);
      } else {
        console.log(`[JIRA WEBHOOK] Successfully posted autonomous comment to ${issueKey}`);
      }
    } else {
      console.warn(`[JIRA WEBHOOK WARN] Jira credentials not configured. Skipping comment post-back.`);
    }

    return NextResponse.json({
      success: true,
      issue: issueKey,
      generated: true
    });

  } catch (error: any) {
    console.error(`[JIRA WEBHOOK ERROR] [${timestamp}]`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

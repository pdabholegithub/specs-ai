import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { extractAndParseJson } from '@/lib/json-parser';

// P1.5: In-memory dedup to prevent duplicate PRs on Jira webhook retries
const processedWebhooks = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Helper: post a rich-text comment to a Jira issue
async function postJiraComment(domain: string, auth: string, issueKey: string, content: object[]) {
  const res = await fetch(`https://${domain}/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ body: { type: 'doc', version: 1, content } })
  });
  if (!res.ok) console.error(`[JIRA COMMENT ERROR] ${await res.text()}`);
  return res.ok;
}

// P1.4: Auto-transition a Jira issue to the first "In Progress"-like status
async function transitionJiraIssue(domain: string, auth: string, issueKey: string) {
  try {
    const res = await fetch(`https://${domain}/rest/api/3/issue/${issueKey}/transitions`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    });
    if (!res.ok) return;
    const { transitions } = await res.json();
    const target = transitions?.find((t: { name: string }) => t.name.toLowerCase().includes('in progress'));
    if (target) {
      await fetch(`https://${domain}/rest/api/3/issue/${issueKey}/transitions`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: { id: target.id } })
      });
      console.log(`[JIRA TRANSITION] ${issueKey} → "${target.name}"`);
    }
  } catch (err: unknown) {
    console.warn(`[JIRA TRANSITION WARN] ${err instanceof Error ? err.message : err}`);
  }
}

// P2.6: Send a Discord notification (free & open source alternative to Slack)
async function notifyDiscord(message: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }) // Discord uses 'content', not 'text'
    });
    console.log('[DISCORD NOTIFY] Notification sent.');
  } catch (err: unknown) {
    console.warn('[DISCORD NOTIFY WARN]', err instanceof Error ? err.message : err);
  }
}

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();

  try {
    // P0.1: Jira Webhook Secret Verification
    const webhookSecret = process.env.JIRA_WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedToken = new URL(req.url).searchParams.get('token');
      if (receivedToken !== webhookSecret) {
        console.warn(`[JIRA WEBHOOK SECURITY] [${timestamp}] Rejected: Invalid webhook secret.`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json();
    const issue = body.issue;
    if (!issue || !issue.key) {
      return NextResponse.json({ message: 'Ignored: No issue data found' }, { status: 200 });
    }

    const issueKey: string = issue.key;
    const status: string = issue.fields?.status?.name || '';
    const description: string = issue.fields?.description || issue.fields?.summary || '';

    console.log(`[JIRA WEBHOOK] [${timestamp}] ${body.webhookEvent} for ${issueKey} (Status: ${status})`);

    // P1.5: Idempotency — reject if processed within the dedup window
    const lastProcessed = processedWebhooks.get(issueKey);
    if (lastProcessed && Date.now() - lastProcessed < DEDUP_WINDOW_MS) {
      console.log(`[JIRA WEBHOOK] Deduplicated: ${issueKey} processed ${Math.round((Date.now() - lastProcessed) / 1000)}s ago.`);
      return NextResponse.json({ message: `Deduplicated: ${issueKey} already processed recently.` }, { status: 200 });
    }
    processedWebhooks.set(issueKey, Date.now());
    // Prune stale entries to prevent memory leak
    for (const [key, time] of processedWebhooks.entries()) {
      if (Date.now() - time > DEDUP_WINDOW_MS * 2) processedWebhooks.delete(key);
    }

    const TARGET_STATUSES = ['ready for qa', 'in review', 'done'];
    if (!TARGET_STATUSES.includes(status.toLowerCase())) {
      return NextResponse.json({ message: `Ignored: Status '${status}' is not a target.` }, { status: 200 });
    }

    console.log(`[JIRA WEBHOOK] Triggering autonomous spec generation for ${issueKey}...`);

    // 1. Generate Specs with Gemini
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are an elite QA Automation Architect. Analyze this Jira Issue and produce a comprehensive acceptance test suite.
Jira Key: ${issueKey}
Description: ${description}
Return a JSON object with:
- "gherkin": (string) Gherkin scenarios.
- "playwright": (object) { "TypeScript": string }
- "testrail": (string) Manual steps.`
    });

    const specs = extractAndParseJson<{
      gherkin: string;
      playwright: { TypeScript: string };
      testrail: string;
    }>(text);

    // Jira credentials
    const jiraDomain = process.env.JIRA_DOMAIN;
    const jiraEmail = process.env.JIRA_USER_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;
    const jiraConfigured = !!(jiraDomain && jiraEmail && jiraToken && !jiraToken.includes('your_jira_api_token'));
    let auth = '';

    if (jiraConfigured) {
      auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
      const envName = process.env.NEXT_PUBLIC_ENV_NAME || 'PRODUCTION';

      // 2. Post initial spec comment to Jira
      await postJiraComment(jiraDomain!, auth, issueKey, [
        { type: 'paragraph', content: [{ type: 'text', text: `🤖 [SyncFlow Autonomous Output - ${envName}]`, marks: [{ type: 'strong' }] }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Analyzed requirement and compiled the following acceptance suite:' }] },
        { type: 'codeBlock', attrs: { language: 'gherkin' }, content: [{ type: 'text', text: specs.gherkin }] },
        { type: 'paragraph', content: [{ type: 'text', text: '⏳ GitHub Draft PR is being created — link will follow in the next comment.' }] }
      ]);

      // P1.4: Auto-transition Jira issue to "In Progress"
      await transitionJiraIssue(jiraDomain!, auth, issueKey);
    } else {
      console.warn('[JIRA WEBHOOK WARN] Jira credentials not configured. Skipping comment.');
    }

    // 3. Trigger GitHub Draft PR
    let prUrl: string | null = null;
    try {
      const baseUrl = new URL(req.url).origin;
      const ghRes = await fetch(`${baseUrl}/api/github/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gherkin: specs.gherkin || 'Feature: Automated Spec',
          code: specs.playwright?.TypeScript || '// No code generated',
          language: 'TypeScript',
          story: description || `Jira Issue ${issueKey}`,
          accessCode: process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026'
        })
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        prUrl = ghData.prUrl;
        console.log(`[JIRA WEBHOOK] GitHub PR created: ${prUrl}`);
      } else {
        console.error(`[JIRA WEBHOOK ERROR] GitHub PR failed: ${await ghRes.text()}`);
      }
    } catch (ghErr: unknown) {
      console.error(`[JIRA WEBHOOK ERROR] ${ghErr instanceof Error ? ghErr.message : ghErr}`);
    }

    // 4. Post PR URL back to Jira as a follow-up comment
    if (prUrl && jiraConfigured && auth) {
      await postJiraComment(jiraDomain!, auth, issueKey, [
        { type: 'paragraph', content: [
          { type: 'text', text: '🐙 GitHub Draft PR Created: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: prUrl, marks: [{ type: 'link', attrs: { href: prUrl } }] }
        ]},
        { type: 'paragraph', content: [{ type: 'text', text: '✅ Draft PR awaits Human-in-the-Loop review before merging.' }] }
      ]);
    }

    // P2.6: Discord notification on successful PR creation
    if (prUrl) {
      await notifyDiscord(`🤖 **SyncFlow** created a Draft PR for **${issueKey}** (${status}):\n🔗 ${prUrl}`);
    }

    return NextResponse.json({ success: true, issue: issueKey, generated: true, prUrl });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    console.error(`[JIRA WEBHOOK ERROR] [${timestamp}]`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return new Response('🚀 SyncFlow Webhook is Live and Ready! (Use POST for Jira)', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}

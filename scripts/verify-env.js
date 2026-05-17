// Remove dotenv since we can use node --env-file
import fs from 'fs';
import path from 'path';

console.log("🔍 Verifying SyncFlow Environment Credentials...\n");

async function verifyGemini() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing.");
    return false;
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (res.ok) {
      console.log("✅ Gemini API: Connection Successful");
      return true;
    } else {
      console.error(`❌ Gemini API Error: ${res.status} ${res.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    return false;
  }
}

async function verifyGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  
  if (!token || !owner || !repo) {
    console.error("❌ GITHUB credentials missing. Check GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.");
    return false;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SyncFlow-Diagnostic'
      }
    });
    if (res.ok) {
      console.log(`✅ GitHub API: Connection Successful (Access to ${owner}/${repo} verified)`);
      return true;
    } else {
      console.error(`❌ GitHub API Error: ${res.status} ${res.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("❌ GitHub API Error:", error.message);
    return false;
  }
}

async function verifyJira() {
  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_USER_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!domain || !email || !token) {
    console.error("❌ JIRA credentials missing. Check JIRA_DOMAIN, JIRA_USER_EMAIL, JIRA_API_TOKEN.");
    return false;
  }
  try {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const res = await fetch(`https://${domain}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Jira API: Connection Successful (Authenticated as ${data.displayName || email})`);
      return true;
    } else {
      console.error(`❌ Jira API Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      return false;
    }
  } catch (error) {
    console.error("❌ Jira API Error:", error.message);
    return false;
  }
}

async function main() {
  let allGood = true;
  
  const geminiOk = await verifyGemini();
  if (!geminiOk) allGood = false;

  const ghOk = await verifyGitHub();
  if (!ghOk) allGood = false;

  const jiraOk = await verifyJira();
  if (!jiraOk) allGood = false;

  console.log("\n----------------------------------------");
  if (allGood) {
    console.log("🎉 All SyncFlow integrations verified successfully! You are ready for 'Zero-Touch' operations.");
  } else {
    console.log("⚠️ Some integrations failed verification. Please check your .env.local configuration.");
  }
}

main();

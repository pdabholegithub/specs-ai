const fs = require('fs');
const path = require('path');
// Fix #7: All requires hoisted to top-level
const { execSync } = require('child_process');

// P2.10: Detect test runner from file extension
function getTestCommand(filePath) {
  if (filePath.endsWith('.spec.ts') || filePath.endsWith('.spec.js')) {
    return 'npx playwright test';
  } else if (filePath.endsWith('.py')) {
    return 'pytest';
  } else if (filePath.endsWith('.java')) {
    return `mvn test -Dtest=${path.basename(filePath, '.java')}`;
  }
  return 'npx playwright test'; // default
}

// P2.6: Send Slack notification
async function notifySlack(message) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (err) {
    console.warn('[SLACK WARN] Failed to send notification:', err.message);
  }
}

// P2.9: Knowledge Base Cleanup — keep only the latest N files
function pruneKnowledgeBase(historyDir, maxItems = 200) {
  const files = fs.readdirSync(historyDir)
    .filter(f => f.endsWith('.json'))
    .sort();
  if (files.length > maxItems) {
    const toDelete = files.slice(0, files.length - maxItems);
    toDelete.forEach(f => fs.unlinkSync(path.join(historyDir, f)));
    console.log(`🧹 SyncFlow: Pruned ${toDelete.length} old knowledge items (kept latest ${maxItems}).`);
  }
}

function findFailingFile(logs) {
  const playwrightRegex = /([a-zA-Z0-9_\-\/]+\.spec\.(ts|js))/;
  const match = logs.match(playwrightRegex);
  return match ? match[1] : null;
}

function findScreenshot() {
  const resultsDir = path.resolve('test-results');
  if (!fs.existsSync(resultsDir)) return null;
  const findImage = (dir) => {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        const found = findImage(fullPath);
        if (found) return found;
      } else if (file.endsWith('.png')) return fullPath;
    }
    return null;
  };
  return findImage(resultsDir);
}

async function heal() {
  const errorLogs = process.env.FAILURE_LOGS;
  let filePath = process.env.FAILING_FILE;
  const apiEndpoint = process.env.SYNCFLOW_API_URL || 'https://your-app.vercel.app/api/ai/heal';
  const accessCode = process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026';

  if (!errorLogs) {
    console.error('❌ Missing FAILURE_LOGS env variable.');
    process.exit(1);
  }

  if (!filePath || filePath === 'tests/example.spec.ts') {
    console.log('🔍 SyncFlow: Detecting failing file from logs...');
    filePath = findFailingFile(errorLogs);
  }

  if (!filePath) {
    console.error('❌ SyncFlow: Could not detect which file failed.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const originalCode = fs.readFileSync(resolvedPath, 'utf8');

  let screenshot = null;
  const screenshotPath = findScreenshot();
  if (screenshotPath) {
    console.log(`📸 SyncFlow: Found screenshot at ${screenshotPath}. Adding visual context...`);
    screenshot = fs.readFileSync(screenshotPath, 'base64');
  }

  console.log('🤖 SyncFlow: Sending failure data to AI Healing Core...');

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorLogs, originalCode, filePath, accessCode, screenshot })
    });

    if (!response.ok) {
      console.error(`❌ SyncFlow: Healing API returned ${response.status}: ${await response.text()}`);
      process.exit(1);
    }

    const data = await response.json();

    if (data.healedCode) {
      console.log('✅ SyncFlow: AI Diagnosis complete.');
      console.log(`Root Cause: ${data.analysis}`);

      fs.writeFileSync(resolvedPath, data.healedCode, 'utf8');

      // Pre-Flight Verification with correct test runner
      const testCmd = getTestCommand(filePath);
      console.log(`⚖️ SyncFlow: Pre-Flight Verification via "${testCmd}"...`);
      try {
        execSync(`${testCmd} ${filePath}`, { stdio: 'inherit' });
        console.log('✅ SyncFlow: Pre-Flight Verification PASSED!');
      } catch {
        console.error('❌ SyncFlow: Pre-Flight Verification FAILED. No PR will be created.');
        await notifySlack(`❌ *SyncFlow Pre-Flight FAILED* for \`${filePath}\`. Human intervention required.`);
        process.exit(1);
      }

      // Generate Diagnosis Markdown
      const diagnosisMd = `### 🛡️ SyncFlow Autonomous Diagnosis
**Status:** ✅ Fix Generated & Pre-Flight Verified
**Target File:** \`${filePath}\`
**Test Runner:** \`${testCmd}\`
**Visual Healing:** ${screenshot ? '📸 Enabled (Screenshot Analyzed)' : '📝 Logs Only'}

#### 🔍 Root Cause Analysis
${data.analysis || 'The AI identified and applied a corrective patch.'}

#### 🛠️ Applied Changes
- Analyzed failure logs and original source code.
${screenshot ? '- Correlated error with visual state from screenshot.' : ''}
- Applied AI-generated corrective fix.
- Fix **verified by re-running the test** (Pre-Flight passed).
- *This is an autonomous fix. Please review carefully before merging.*

---
*Generated by [SyncFlow AI](https://syncflow.ai)*`;

      fs.writeFileSync('diagnosis.md', diagnosisMd, 'utf8');

      // Save to Historical Memory
      const historyDir = path.resolve('src/data/healing-history');
      if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

      const historyFile = path.join(historyDir, `fix-${Date.now()}.json`);
      const knowledgeItem = {
        timestamp: new Date().toISOString(),
        filePath,
        testRunner: testCmd,
        analysis: data.analysis,
        errorLogs: errorLogs.substring(0, 500),
        visualContext: !!screenshot,
        prUrl: null  // populated by CI workflow after gh pr create
      };
      fs.writeFileSync(historyFile, JSON.stringify(knowledgeItem, null, 2));

      // P2.9: Prune old knowledge base entries
      pruneKnowledgeBase(historyDir, 200);

      // Write the history file path so the workflow can update prUrl
      fs.writeFileSync('.syncflow-latest-fix', historyFile);

      console.log('🎉 SyncFlow: Healed, diagnosis generated, knowledge saved!');
    } else {
      console.error(`❌ SyncFlow: AI could not generate a fix. ${data.error || ''}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ SyncFlow: Failed to connect to Healing API. ${err.message}`);
    process.exit(1);
  }
}

heal();

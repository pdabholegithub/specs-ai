const fs = require('fs');
const path = require('path');

async function heal() {
  const errorLogs = process.env.FAILURE_LOGS;
  const filePath = process.env.FAILING_FILE;
  const apiEndpoint = process.env.SYNCFLOW_API_URL || 'https://your-app.vercel.app/api/ai/heal';
  const accessCode = process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026';

  if (!errorLogs || !filePath) {
    console.error("Missing FAILURE_LOGS or FAILING_FILE env variables.");
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const originalCode = fs.readFileSync(resolvedPath, 'utf8');

  console.log(`🤖 SyncFlow: Sending failure data to AI Healing Core...`);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorLogs,
        originalCode,
        filePath,
        accessCode
      })
    });

    const data = await response.json();

    if (data.healedCode) {
      console.log(`✅ SyncFlow: AI Diagnosis complete. Root Cause: ${data.analysis}`);
      fs.writeFileSync(resolvedPath, data.healedCode, 'utf8');
      console.log(`🎉 SyncFlow: File has been autonomously healed!`);
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

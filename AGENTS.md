# 🤖 SpecsAI Multi-Agent System

SpecsAI is powered by a coordinated fleet of specialized AI agents, each designed for a specific phase of the Autonomous SDLC.

---

## 1. 🏗️ The Architect Agent (Jira-to-PR)
*   **Role**: Translates ambiguous business requirements into precise technical specifications.
*   **Input**: Jira Webhook (Status: "Ready for QA").
*   **Intelligence**: Maps User Stories to Playwright/Selenium test patterns.
*   **Autonomous Action**: 
    1. Generates Gherkin scenarios.
    2. Writes Playwright test code.
    3. **Creates a new branch and Draft PR** in GitHub.
    4. Posts the summary back to Jira.

## 2. 🛡️ The Staff QA Healing Agent (Vision-to-Fix)
This is the "Special Forces" of the SpecsAI engine.
*   **Role**: Autonomous debugging and patching of CI/CD failures.
*   **Multi-Modal Intelligence**: Uses **Gemini 1.5 Flash** to analyze:
    1.  **Source Code**: The original test file.
    2.  **Failure Logs**: Stack traces and error messages.
    3.  **Visual Evidence**: Screenshots captured at the exact moment of failure.
*   **Capabilities**:
    *   Identifies stale locators (e.g., ID changed from `btn-submit` to `submit-now`).
    *   Detects layout shifts or overlapping elements.
    *   Handles asynchronous timing issues.

## 3. ⚖️ The Verification Agent (Trust-but-Verify)
*   **Role**: Ensures quality control for AI-generated code.
*   **Action**: Executes "Pre-Flight" test runs within the CI container after a healing attempt.
*   **Security Protocol**:
    *   Only allows PR creation if the fix is verified to pass the re-run.
    *   Enforces the **Secure PR Pattern** (Draft only, Human-in-the-Loop review).

---

## 🧠 The Memory Layer (Living Knowledge Base)
SpecsAI is not just an automation tool; it is a **Learning System**. 
*   **Knowledge Ingestion**: Every verified fix is serialized as a Knowledge Item in `src/data/healing-history/`.
*   **Contextual Recall**: When a failure occurs, the agents perform a "Memory Recall," retrieving the top 5 most relevant past fixes to guide the current diagnosis.
*   **Repository IQ**: The system builds a custom, repository-specific "Immune System" that documents every architectural quirk and common failure pattern.

---
### 🧠 Intelligence Tier: Google Gemini 1.5 Flash
We leverage Gemini's massive context window and native multi-modal capabilities to ensure that our agents have the "Full Picture" of the application state before making any modifications.

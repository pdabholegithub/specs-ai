"use client";

import { useState, useEffect } from "react";

// Predefined premium user story presets
const PRESETS = [
  {
    icon: "🛒",
    title: "E-Commerce Cart",
    description: "Adding items to a shopping cart with stock checks",
    story: "As an online shopper, I want to add items to my shopping cart so that I can purchase them later. If the item is out of stock, the button should be disabled, and I should see an 'Out of Stock' status."
  },
  {
    icon: "🔐",
    title: "Secure MFA Reset",
    description: "Password reset link with single-use secure tokens",
    story: "As a registered user, I want to securely reset my password using my email address so that I can regain access if I forget it. Validations should prevent submission for incorrect email formats."
  },
  {
    icon: "👥",
    title: "Enterprise Onboarding",
    description: "CSV list upload of member invites and RBAC",
    story: "As an Enterprise Admin, I want to upload a CSV file of member emails and roles to invite them in bulk. Standard non-admin users should be blocked with a 403 access denied message if they try to access this route."
  }
];

export default function Dashboard() {
  const [story, setStory] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [gherkin, setGherkin] = useState("");
  const [playwright, setPlaywright] = useState<Record<string, string> | null>(null);
  const [testrail, setTestrail] = useState("");
  const [loading, setLoading] = useState(false);
  // Custom interactive states for Wow Factor
  const [activeTab, setActiveTab] = useState<"gherkin" | "automation" | "testrail">("gherkin");
  const [loadingStep, setLoadingStep] = useState(1);
  const [copiedState, setCopiedState] = useState<"gherkin" | "automation" | "testrail" | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDestination, setExportDestination] = useState<"Jira" | "GitHub" | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  
  // Security Access code
  const [accessCode, setAccessCode] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      // P0.2: sessionStorage clears on tab close — safer than localStorage for credentials
      const saved = sessionStorage.getItem("specs_access_code");
      if (saved) setAccessCode(saved);
    }
  }, []);

  // Simulated compilation/sync process stepper
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 1200);
    } else {
      setLoadingStep(1);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (customStory?: string) => {
    const targetStory = customStory || story;
    const trimmedStory = targetStory.trim();
    if (!trimmedStory) return;

    if (trimmedStory.length < 15) {
      alert("Please provide a valid, descriptive requirement. Your input is too short to generate meaningful test specs.");
      return;
    }

    setLoading(true);
    setGherkin("");
    setPlaywright(null);
    setTestrail("");
    setActiveTab("gherkin");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: trimmedStory, accessCode }),
      });

      const data = await res.json();
      if (res.status === 401) {
        alert("🔒 Unauthorized: The access passcode you entered is incorrect. Please enter a valid passcode to proceed.");
        return;
      } else if (res.status === 429) {
        alert("⏱️ Rate Limit Exceeded: " + (data.error || "Max 5 generations per hour. Please try again later."));
        return;
      }

      if (data.gherkin && data.playwright) {
        setGherkin(data.gherkin);
        setPlaywright(data.playwright);
        if (data.testrail) setTestrail(data.testrail);
      } else {
        alert(data.error || "Failed to parse response. Make sure your API key is set.");
      }
    } catch (err) {
      alert("An error occurred while generating specs.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetStory: string) => {
    setStory(presetStory);
    handleGenerate(presetStory);
  };

  const handleCopy = (text: string, type: "gherkin" | "automation" | "testrail") => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const triggerExport = async (destination: "Jira" | "GitHub") => {
    setExportDestination(destination);
    setShowExportModal(true);
    setIsExporting(true);
    setExportSuccess(false);
    setPrUrl(null);

    if (destination === 'GitHub') {
      try {
        const res = await fetch('/api/github/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gherkin,
            code: playwright ? playwright[language] : '',
            language,
            story,
            accessCode
          }),
        });

        const data = await res.json();
        if (data.success) {
          setIsExporting(false);
          setExportSuccess(true);
          setPrUrl(data.prUrl);
        } else {
          setIsExporting(false);
          alert('GitHub Export Failed: ' + (data.error || 'Unknown error'));
          setShowExportModal(false);
        }
      } catch (err) {
        setIsExporting(false);
        alert('An error occurred during GitHub export.');
        setShowExportModal(false);
      }
    } else {
      // Jira direct sync is coming in a future release
      setIsExporting(false);
      setShowExportModal(false);
      alert('📬 Jira Sync is coming soon! For now, the Jira Webhook auto-syncs when you move a ticket to "Ready for QA".');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white p-6 relative overflow-hidden selection:bg-purple-500/30">
      {/* Background neon glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m21 16-4 4-4-4"/>
                <path d="M17 20V4"/>
                <path d="m3 8 4-4 4 4"/>
                <path d="M7 4v16"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                SpecsAI
              </h1>
              <p className="text-xs text-purple-400 font-semibold tracking-wider uppercase">Interactive SDLC Sync Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Status: Active
            </span>
            <a href="/" className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-all">
              ← Main Site
            </a>
          </div>
        </header>

        {/* Templates Presets Bar */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span>⚡ Select User Story Preset</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset.story)}
                disabled={loading}
                className="text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.05)] transition-all group flex gap-3.5 items-start disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl p-1 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">{preset.icon}</span>
                <div>
                  <h3 className="font-bold text-sm text-gray-200 group-hover:text-purple-400 transition-colors">{preset.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{preset.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: INPUT */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500" />
              
              <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold flex items-center justify-center">1</span>
                The Requirement
              </h2>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Provide a user story, feature brief, or Jira acceptance criteria description.
              </p>
              
              <textarea 
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="As a product owner, I want to allow users to..."
                className="w-full h-64 bg-[#0a0a0d] border border-white/10 hover:border-white/20 focus:border-purple-500 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none transition-all placeholder:text-gray-600"
              />
              
              <button 
                onClick={() => handleGenerate()}
                disabled={loading || story.trim().length < 15}
                className="w-full mt-4 px-5 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold tracking-wide transition-all shadow-[0_4px_25px_rgba(168,85,247,0.25)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Compiling Specs...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    <span>Generate Acceptance Suite</span>
                  </>
                )}
              </button>
            </div>

            {/* Access Passcode Verification */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-500 to-amber-500" />
              <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
                <span>🔒 Security Access Passcode</span>
              </h2>
              <p className="text-[11px] text-gray-400 mb-3 leading-normal">
                Enter your private beta passcode to authorize Gemini dynamic generations.
              </p>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  sessionStorage.setItem("specs_access_code", e.target.value);
                }}
                placeholder="Enter access code..."
                className="w-full bg-[#0a0a0d] border border-white/10 hover:border-white/20 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all placeholder:text-gray-700"
              />
            </div>

            {/* Simulated Live compilation stepper when loading */}
            {loading && (
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Live Pipeline Steps</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { step: 1, text: "Analyzing Requirement Context" },
                    { step: 2, text: "Drafting Gherkin Scenarios" },
                    { step: 3, text: "Compiling Automation Test Scripts" },
                    { step: 4, text: "Formatting TestRail QA Cases" }
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 text-xs">
                      {loadingStep > s.step ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">✓</div>
                      ) : loadingStep === s.step ? (
                        <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold animate-pulse">●</div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 text-gray-600 flex items-center justify-center">○</div>
                      )}
                      <span className={`transition-colors ${loadingStep >= s.step ? "text-gray-200" : "text-gray-600"}`}>
                        {s.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: TABS OUTPUTS */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Main Spec Output Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative">
              
              {/* Tab Selector Headers */}
              <div className="bg-black/30 border-b border-white/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl self-start">
                  {[
                    { id: "gherkin", label: "🥒 Gherkin Spec" },
                    { id: "automation", label: "🎭 Automation Script" },
                    { id: "testrail", label: "📝 Manual TestRail" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub language select for Automation Tab */}
                {activeTab === "automation" && (
                  <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                    {["TypeScript", "Python", "Java"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                          language === lang
                            ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TAB CORE CONTENT CONTAINER */}
              <div className="flex-1 p-6 flex flex-col min-h-0 bg-[#0a0a0d]">
                
                {/* 1. GHERKIN TAB */}
                {activeTab === "gherkin" && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                      <span>Syntax: Cucumber Gherkin Scenarios</span>
                      {gherkin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(gherkin, "gherkin")}
                            className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 transition-all"
                          >
                            {copiedState === "gherkin" ? "✓ Copied!" : "📋 Copy"}
                          </button>
                          <span className="text-gray-700">|</span>
                          <button
                            onClick={() => handleDownload(gherkin, "feature_specification.feature")}
                            className="hover:text-white transition-colors"
                          >
                            📥 Download
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-h-[300px] border border-white/5 bg-[#050508] p-5 rounded-xl font-mono text-xs overflow-auto text-emerald-400 leading-relaxed whitespace-pre">
                      {gherkin || (
                        <span className="text-gray-600 italic">// Submit a requirement to build acceptance scenarios...</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. AUTOMATION SCRIPTS TAB */}
                {activeTab === "automation" && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                      <span>Syntax: {language === "Java" ? "Selenium WebDriver (Java)" : `Playwright (${language})`}</span>
                      {playwright && playwright[language] && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(playwright[language], "automation")}
                            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-all"
                          >
                            {copiedState === "automation" ? "✓ Copied!" : "📋 Copy"}
                          </button>
                          <span className="text-gray-700">|</span>
                          <button
                            onClick={() => {
                              const ext = language === "TypeScript" ? "spec.ts" : language === "Python" ? "py" : "java";
                              handleDownload(playwright[language], `test_spec.${ext}`);
                            }}
                            className="hover:text-white transition-colors"
                          >
                            📥 Download
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-h-[300px] border border-white/5 bg-[#050508] p-5 rounded-xl font-mono text-xs overflow-auto text-sky-300 leading-relaxed whitespace-pre">
                      {playwright && playwright[language] ? (
                        playwright[language]
                      ) : (
                        <span className="text-gray-600 italic">// Submit a requirement to compile automated test script...</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. TESTRAIL TAB */}
                {activeTab === "testrail" && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                      <span>Syntax: TestRail CSV-ready test cases</span>
                      {testrail && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(testrail, "testrail")}
                            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-all"
                          >
                            {copiedState === "testrail" ? "✓ Copied!" : "📋 Copy"}
                          </button>
                          <span className="text-gray-700">|</span>
                          <button
                            onClick={() => handleDownload(testrail, "testrail_import.txt")}
                            className="hover:text-white transition-colors"
                          >
                            📥 Download
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-h-[300px] border border-white/5 bg-[#050508] p-5 rounded-xl font-mono text-xs overflow-auto text-amber-100/90 leading-relaxed whitespace-pre">
                      {testrail || (
                        <span className="text-gray-600 italic">// Submit a requirement to build TestRail structured manual logs...</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Sync Sync Utilities Bar */}
                {(gherkin || playwright || testrail) && (
                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-gray-400">
                      💡 Connect outputs directly to your team's workflow integrations.
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => triggerExport("Jira")}
                        className="px-4 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        📬 Sync to Jira Ticket
                      </button>
                      <button 
                        onClick={() => triggerExport("GitHub")}
                        className="px-4 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        🐙 Create GitHub PR
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SYNC/EXPORT SIMULATOR MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e12] border border-white/15 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
            
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
            >
              ×
            </button>

            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              {exportDestination === "Jira" ? "📬 Syncing with Jira" : "🐙 Creating GitHub Pull Request"}
            </h3>

            {isExporting ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <p className="text-sm text-gray-400">
                  {exportDestination === "Jira" 
                    ? "Connecting to workspace.atlassian.net and attaching criteria to ticket..." 
                    : "Forking repository, creating feature branch, and drafting tests PR..."
                  }
                </p>
              </div>
            ) : exportSuccess ? (
              <div className="py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  ✓
                </div>
                <p className="text-sm text-center text-gray-200 font-bold">
                  {exportDestination === "Jira" ? "Criteria Attached Successfully!" : "GitHub PR Generated!"}
                </p>
                <p className="text-xs text-center text-gray-500 mt-2">
                  {exportDestination === "Jira" 
                    ? "Sync Flow successfully added 3 Gherkin scenarios to your target Jira story ticket." 
                    : `Successfully created a new branch and initialized Pull Request for your test suite.`
                  }
                </p>
                
                {prUrl && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <a 
                      href={prUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      View Pull Request on GitHub
                    </a>
                  </div>
                )}
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Dismiss Overlay
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}

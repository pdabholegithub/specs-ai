"use client";

import { useState } from "react";

export default function Dashboard() {
  const [story, setStory] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [gherkin, setGherkin] = useState("");
  const [playwright, setPlaywright] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const trimmedStory = story.trim();
    if (!trimmedStory) return;

    if (trimmedStory.length < 15) {
      alert("Please provide a valid, descriptive requirement. Your input is too short to generate meaningful test specs.");
      return;
    }

    setLoading(true);
    setGherkin("");
    setPlaywright("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: trimmedStory, language }),
      });

      const data = await res.json();
      if (data.gherkin && data.playwright) {
        setGherkin(data.gherkin);
        setPlaywright(data.playwright);
      } else {
        alert("Failed to parse response. Make sure your API key is set.");
      }
    } catch (err) {
      alert("An error occurred while generating specs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
            </div>
            SpecsAI <span className="text-sm font-normal text-purple-400 bg-purple-500/10 px-2 py-1 rounded ml-2">Interactive Dashboard</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="col-span-1 flex flex-col gap-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h2 className="text-lg font-semibold mb-2">1. The Requirement</h2>
              <p className="text-sm text-gray-400 mb-4">Paste a PM's Jira ticket or User Story below.</p>
              
              <textarea 
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="As a user, I want to be able to reset my password using my email address so that I can regain access if I forget it."
                className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              />
              <button 
                onClick={handleGenerate}
                disabled={loading || story.trim().length < 15}
                className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "AI is Syncing..." : "Generate Specs"}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="col-span-2 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h2 className="text-lg font-semibold mb-4 text-purple-400">2. Gherkin Acceptance Criteria</h2>
              <div className="bg-[#111] border border-white/5 rounded-xl p-4 min-h-[150px] font-mono text-sm overflow-auto text-green-400 whitespace-pre-wrap">
                {gherkin || "// Awaiting requirement generation..."}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-blue-400">3. {language} Automation Code</h2>
                <div className="flex gap-2">
                  {['TypeScript', 'Python', 'Java'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        language === lang 
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                          : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-xl p-4 min-h-[250px] font-mono text-sm overflow-auto text-blue-300 whitespace-pre-wrap">
                {playwright ? playwright[language] : "// Awaiting code generation..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

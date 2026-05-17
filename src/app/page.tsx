import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
          </div>
          SpecsAI
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/healing" className="hidden lg:block text-sm text-gray-400 hover:text-white transition-colors mr-4">
            Resilience Center
          </Link>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all backdrop-blur-md">
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-8 uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          The Living Blueprint for SDLC
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Stop Meetings. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
            Start Syncing with AI.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          SpecsAI bridges Jira, GitHub, and Playwright. Turn PM user stories into live code specs and automated tests instantly. The single source of truth your team actually uses.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mb-16 justify-center">
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 text-center text-lg tracking-wide"
          >
            Launch Interactive Demo
          </Link>
          <Link 
            href="/dashboard/healing"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-all hover:scale-105 active:scale-95 text-center text-lg tracking-wide backdrop-blur-sm"
          >
            Monitor Resilience
          </Link>
        </div>

        {/* Dashboard Mockup Frame */}
        <div className="w-full relative mt-10 perspective-[2000px]">
          {/* Bottom fade overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
          {/* Glow behind image */}
          <div className="absolute inset-0 bg-purple-600/20 rounded-3xl blur-3xl scale-95 z-0" />
          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md shadow-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-700 ease-out">
            <div className="rounded-xl border border-purple-500/20 overflow-hidden relative">
              <Image
                src="/mockup-placeholder.png"
                alt="SpecsAI — AI-Powered SDLC Architecture Diagram showing Jira, GitHub, Playwright integration"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Subtle purple tint overlay for brand cohesion */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </main>

      {/* Features grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-32 grid md:grid-cols-3 gap-8">
        {[
          { title: "AI Acceptance Criteria", desc: "Write 2 sentences in Jira. Get full Gherkin scenarios instantly." },
          { title: "Playwright Automation", desc: "Generate typescript test skeletons mapped directly to PM requirements." },
          { title: "Living Feature Map", desc: "See exactly what is coded, tested, and deployed in one single view." }
        ].map((feature, i) => (
          <div key={i} className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Three Steps to Unified Testing
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            From raw product ideas to secure, auto-healed test code execution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Draft User Story",
              desc: "Paste your raw feature requirements or product ideas directly into the main interactive dashboard panel."
            },
            {
              step: "02",
              title: "Sync & Compile",
              desc: "Watch the Gemini 2.5 Flash architecture compile Gherkin scenarios, automated test skeletons, and manual TestRail cases in real-time."
            },
            {
              step: "03",
              title: "Heal in Your Editor",
              desc: "Integrate the MCP server locally. Let Cursor run your tests, catch any failures, and auto-heal your files instantly on your machine."
            }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 relative overflow-hidden group">
              <div className="text-6xl font-black text-white/[0.03] absolute top-4 right-4 transition-colors group-hover:text-purple-500/10">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-4 relative z-10">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Autonomous Flow Visualization */}
        <div className="mt-20 relative">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              Autonomous SDLC Loop
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-4 mb-2">The Zero-Touch Engineering Loop</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Jira → AI → GitHub → Playwright → Self-Heal. Fully autonomous, end-to-end.</p>
          </div>
          {/* Glow */}
          <div className="absolute inset-0 bg-cyan-600/10 rounded-3xl blur-3xl scale-95 z-0 pointer-events-none" />
          <div className="relative z-10 rounded-2xl border border-cyan-500/20 bg-white/[0.02] p-2 backdrop-blur-md shadow-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-700 ease-out">
            <div className="rounded-xl overflow-hidden relative">
              <Image
                src="/specsai-flow.png"
                alt="SpecsAI Autonomous SDLC Flow — Jira to GitHub to Playwright self-healing loop"
                width={1400}
                height={900}
                className="w-full h-auto object-cover"
              />
              {/* Tint overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/15 via-transparent to-purple-900/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Simple, Developer-First Pricing
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Get started for free or supercharge your workflow with our local MCP self-healing integration.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">Hobby</h3>
              <div className="text-4xl font-extrabold mb-6">$0<span className="text-sm font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-3.5 text-sm text-gray-400 mb-8">
                <li className="flex items-center gap-2">🟢 20 Dynamic Generations</li>
                <li className="flex items-center gap-2">🟢 Basic Gherkin Outputs</li>
                <li className="flex items-center gap-2">🟢 Playwright Test Skeletons</li>
                <li className="flex items-center gap-2">🔴 Local MCP Debug Server</li>
              </ul>
            </div>
            <Link href="/dashboard" className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-center font-medium border border-white/10 transition-colors text-sm">
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-500/10 to-blue-500/5 border border-purple-500/30 flex flex-col justify-between relative shadow-[0_0_50px_rgba(168,85,247,0.15)] transform md:scale-105">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Professional</h3>
              <div className="text-4xl font-extrabold mb-6">$49<span className="text-sm font-normal text-gray-400">/mo</span></div>
              <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2">🟢 Unlimited Dynamic Generations</li>
                <li className="flex items-center gap-2">🟢 Three-Language Automation Code</li>
                <li className="flex items-center gap-2">🟢 Advanced Manual TestRail Cases</li>
                <li className="flex items-center gap-2">🟢 Local MCP Debug & Run Server</li>
                <li className="flex items-center gap-2">🟢 Full Real-time Self-Healing Core</li>
              </ul>
            </div>
            <Link href="/dashboard" className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-center font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all">
              Go Professional
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">Enterprise</h3>
              <div className="text-4xl font-extrabold mb-6">Custom</div>
              <ul className="space-y-3.5 text-sm text-gray-400 mb-8 font-medium">
                <li className="flex items-center gap-2">🟢 Self-Hosted LLM Gateway</li>
                <li className="flex items-center gap-2">🟢 Custom SDLC Workflow Hooks</li>
                <li className="flex items-center gap-2">🟢 Private Cloud deployments</li>
                <li className="flex items-center gap-2">🟢 SSO / SAML Protection</li>
                <li className="flex items-center gap-2">🟢 24/7 Priority SLA Support</li>
              </ul>
            </div>
            <a href="mailto:support@specsai.co" className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-center font-medium border border-white/10 transition-colors text-sm">
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

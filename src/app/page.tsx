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
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all backdrop-blur-md">
          Open Dashboard
        </Link>
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
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-16 justify-center">
          <Link 
            href="/dashboard"
            className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 text-center text-lg tracking-wide"
          >
            Launch Interactive Demo
          </Link>
        </div>

        {/* Dashboard Mockup Frame */}
        <div className="w-full relative mt-10 perspective-[2000px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-20 h-full w-full bottom-0 top-auto"></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md shadow-2xl overflow-hidden transform rotateX-[10deg] scale-100 hover:rotate-0 transition-transform duration-700 ease-out">
            <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden aspect-[16/9] relative flex items-center justify-center">
               <div className="absolute inset-0 bg-[url('/mockup-placeholder.png')] bg-cover bg-center opacity-80 mix-blend-screen"></div>
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
          <div key={i} className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

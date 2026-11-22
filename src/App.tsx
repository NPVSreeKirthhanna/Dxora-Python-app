import { useState } from 'react';
import { LinkAnalysisView } from './components/LinkAnalysisView';
import { MultiPostingView } from './components/MultiPostingView';
import { LlmResearchView } from './components/LlmResearchView';
import { FastApiBlueprintView } from './components/FastApiBlueprintView';

type NavTab = 'analysis' | 'posting' | 'research' | 'blueprint';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('analysis');

  const navItems: Array<{ id: NavTab; label: string }> = [
    { id: 'analysis', label: 'Link Analysis' },
    { id: 'posting', label: 'Multi-Platform Post' },
    { id: 'research', label: 'LLM Research' },
    { id: 'blueprint', label: 'FastAPI Blueprint' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones (Wordmark — 4 Nav Links — 1 Primary Action) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('analysis');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            LinkScope & Dispatch
          </a>

          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                  activeTab === item.id
                    ? 'text-slate-900 border-indigo-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('blueprint')}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              API Reference
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex items-center gap-4 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeTab === item.id
                  ? 'text-slate-900 border-indigo-600'
                  : 'text-slate-600 border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'analysis' && <LinkAnalysisView />}
        {activeTab === 'posting' && <MultiPostingView />}
        {activeTab === 'research' && <LlmResearchView />}
        {activeTab === 'blueprint' && <FastApiBlueprintView />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>LinkScope & Dispatch API</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              POST /link-analysis
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('posting')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              POST /posting
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('research')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Model Benchmark Research
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Check, Copy, FileCode2, Loader2 } from 'lucide-react';
import type { PythonBlueprintProject } from '../types';

export function FastApiBlueprintView() {
  const [projects, setProjects] = useState<PythonBlueprintProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] =
    useState<PythonBlueprintProject['id']>('ai-link-analysis');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('app/main.py');
  const [copiedFile, setCopiedFile] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/python-blueprint')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else {
          setError(data.error || 'Failed to load Python FastAPI files.');
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Network error loading blueprints.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const currentProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const currentFile =
    currentProject?.files.find((f) => f.path === selectedFilePath) ?? currentProject?.files[0];

  const handleCopyFile = async () => {
    if (!currentFile) return;
    await navigator.clipboard.writeText(currentFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Live Endpoint Reference */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            REST API Contracts & Python FastAPI Source
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Both REST endpoints are live on this server and mirrored in the complete Python 3.x / FastAPI repositories under <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">python/</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-indigo-700">
                POST /link-analysis
              </span>
              <span className="text-xs text-slate-500">5-Section Website Intelligence</span>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:3000/link-analysis \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
            </pre>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-indigo-700">
                POST /posting
              </span>
              <span className="text-xs text-slate-500">5-Platform Automated Dispatch</span>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:3000/posting \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Explore our new platform! https://example.com"}'`}
            </pre>
          </div>
        </div>
      </section>

      {/* Python FastAPI File Browser */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1" role="tablist" aria-label="FastAPI repositories">
            {(
              [
                { id: 'ai-link-analysis', label: 'ai-link-analysis (FastAPI)' },
                { id: 'automated-posting', label: 'automated-posting (FastAPI)' },
              ] as const
            ).map((proj) => (
              <button
                key={proj.id}
                role="tab"
                aria-selected={selectedProjectId === proj.id}
                onClick={() => {
                  setSelectedProjectId(proj.id);
                  setSelectedFilePath('app/main.py');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedProjectId === proj.id
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {proj.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-500">
            uvicorn app.main:app --host 0.0.0.0 --port 4000
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading FastAPI source files...
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-700">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4">
            {/* File Tree */}
            <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 p-3 space-y-1">
              {currentProject?.files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
                    currentFile?.path === file.path
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </aside>

            {/* Code Viewer */}
            <div className="lg:col-span-3 flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white">
                <span className="text-xs font-mono text-slate-700">
                  python/{currentProject?.id}/{currentFile?.path}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopyFile()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors cursor-pointer"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy File
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[560px] leading-relaxed flex-1">
                {currentFile?.content}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

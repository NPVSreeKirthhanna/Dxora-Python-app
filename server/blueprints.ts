import fs from 'node:fs/promises';
import path from 'node:path';
import type { PythonBlueprintProject } from '../src/types.js';

const ROOT_DIR = process.cwd();

const LINK_ANALYSIS_FILES = [
  { path: 'app/main.py', language: 'python' },
  { path: 'app/config.py', language: 'python' },
  { path: 'app/schemas.py', language: 'python' },
  { path: 'app/utils/validators.py', language: 'python' },
  { path: 'app/services/website_extractor.py', language: 'python' },
  { path: 'app/services/llm_service.py', language: 'python' },
  { path: 'app/services/competitor_service.py', language: 'python' },
  { path: 'app/services/analysis_service.py', language: 'python' },
  { path: 'tests/test_link_analysis.py', language: 'python' },
  { path: 'requirements.txt', language: 'text' },
  { path: '.env.example', language: 'bash' },
];

const POSTING_FILES = [
  { path: 'app/main.py', language: 'python' },
  { path: 'app/config.py', language: 'python' },
  { path: 'app/schemas.py', language: 'python' },
  { path: 'app/services/posting_service.py', language: 'python' },
  { path: 'app/platforms/base.py', language: 'python' },
  { path: 'app/platforms/telegraph.py', language: 'python' },
  { path: 'app/platforms/devto.py', language: 'python' },
  { path: 'app/platforms/mastodon.py', language: 'python' },
  { path: 'app/platforms/bluesky.py', language: 'python' },
  { path: 'app/platforms/discord.py', language: 'python' },
  { path: 'tests/test_posting.py', language: 'python' },
  { path: 'requirements.txt', language: 'text' },
  { path: '.env.example', language: 'bash' },
];

async function loadProjectFiles(
  baseFolder: string,
  specs: Array<{ path: string; language: string }>
) {
  const baseDir = path.resolve(ROOT_DIR, 'python', baseFolder);
  const files = await Promise.all(
    specs.map(async (spec) => {
      const fullPath = path.resolve(baseDir, spec.path);
      if (!fullPath.startsWith(baseDir + path.sep)) {
        throw new Error('Invalid blueprint path');
      }
      const content = await fs.readFile(fullPath, 'utf-8');
      return {
        path: spec.path,
        language: spec.language,
        content,
      };
    })
  );
  return files;
}

export async function getPythonBlueprints(): Promise<PythonBlueprintProject[]> {
  const [linkFiles, postingFiles] = await Promise.all([
    loadProjectFiles('ai-link-analysis', LINK_ANALYSIS_FILES),
    loadProjectFiles('automated-posting', POSTING_FILES),
  ]);

  return [
    {
      id: 'ai-link-analysis',
      title: 'ai-link-analysis (FastAPI · Port 4000)',
      port: 4000,
      files: linkFiles,
    },
    {
      id: 'automated-posting',
      title: 'automated-posting (FastAPI · Port 4000)',
      port: 4000,
      files: postingFiles,
    },
  ];
}

import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { fetchAndExtractWebsite } from './server/extractor.js';
import { analyzeWebsiteWithGemini } from './server/gemini.js';
import { publishToAllPlatforms } from './server/platforms.js';
import { validatePostingMessage, ValidationError } from './server/validators.js';
import { getPythonBlueprints } from './server/blueprints.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.set('trust proxy', true);

  // Top-level request deserialization mounted strictly before any route handlers
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      timestamp: new Date().toISOString(),
    });
  });

  // POST /link-analysis (and /api/link-analysis alias)
  const handleLinkAnalysis = async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const url = body.url;

    try {
      const extracted = await fetchAndExtractWebsite(typeof url === 'string' ? url : '');
      const analysis = await analyzeWebsiteWithGemini(extracted);
      res.json(analysis);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
          success: false,
          error: err.message,
          details: err.details ?? null,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  };

  app.post('/link-analysis', handleLinkAnalysis);
  app.post('/api/link-analysis', handleLinkAnalysis);

  // POST /posting (and /api/posting alias)
  const handlePosting = async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

    try {
      const validated = await validatePostingMessage(body.message);
      const results = await publishToAllPlatforms(validated.message, validated.ctaUrl);
      const succeeded = results.filter((r) => r.status === 'success').length;
      const failed = results.length - succeeded;

      res.json({
        success: succeeded > 0,
        message: validated.message,
        cta_url: validated.ctaUrl,
        character_count: validated.characterCount,
        summary: {
          total_platforms: results.length,
          succeeded,
          failed,
        },
        results,
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
          success: false,
          error: err.message,
          details: err.details ?? null,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Unexpected posting error';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  };

  app.post('/posting', handlePosting);
  app.post('/api/posting', handlePosting);

  app.get('/api/python-blueprint', async (_req: Request, res: Response) => {
    try {
      const projects = await getPythonBlueprints();
      res.json({ success: true, projects });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load blueprint files',
      });
    }
  });

  // Malformed JSON error handler
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ success: false, error: 'Malformed JSON request payload.' });
      return;
    }
    next(err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkScope & Dispatch API listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

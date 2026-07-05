import express from 'express';
import { isAuthenticated } from '../services/google.js';
import { authenticate } from '../middleware/auth.js';
import { runIngestionPipeline } from '../services/ingestion.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  if (!isAuthenticated()) {
    return res.status(401).json({ error: "Please connect your Google account first." });
  }

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendProgress = (msg, percent) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', message: msg, progress: percent })}\n\n`);
  };

  try {
    const totalIngested = await runIngestionPipeline(sendProgress);
    res.write(`data: ${JSON.stringify({ type: 'done', ingested: totalIngested })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Ingest error:", error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: "Failed to ingest data" })}\n\n`);
    res.end();
  }
});

export default router;

import express from 'express';
import { generateEmbeddings } from '../services/embedder.js';
import { queryDocuments } from '../services/vectordb.js';
import { streamChat } from '../services/llm.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const { message, history = [] } = req.body || {};
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 1. Embed query
    const queryEmbeddings = await generateEmbeddings([message]);
    
    // 2. Query Vector DB
    const results = await queryDocuments(queryEmbeddings, 3);
    const contextDocs = results.documents[0] || [];
    const contextText = contextDocs.join("\n\n");
    
    const systemPrompt = `You are an AI assistant for the user's Personal Life OS. 
Answer questions using the provided context from their personal documents and emails.
Context:
${contextText}`;

    const messages = [
      ...history,
      { role: 'user', content: message }
    ];

    // 3. Stream response
    await streamChat(messages, systemPrompt, (chunk) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;

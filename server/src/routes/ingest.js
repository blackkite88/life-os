import express from 'express';
import { mcpService } from '../services/mcp.js';
import { generateEmbeddings } from '../services/embedder.js';
import { addDocuments } from '../services/vectordb.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    // 1. Fetch from Google Drive via MCP
    // In a real implementation, you'd specify which resources to fetch.
    // For demo, we just fetch a mock resource or handle a payload.
    // Assuming MCP readResource returns text content:
    const uri = req.body?.uri || 'drive://sample-doc-id';
    
    // Mock fetching for now if mcp is not fully setup by user
    let textContent = req.body?.content || "This is a sample document content from Google Drive.";
    
    try {
      const resource = await mcpService.readResource(uri);
      if (resource && resource.contents && resource.contents[0]) {
        textContent = resource.contents[0].text;
      }
    } catch (mcpErr) {
      console.warn("MCP fetch failed, using fallback content.", mcpErr.message);
    }

    // 2. Simple chunking (e.g. by paragraphs)
    const chunks = textContent.split('\n\n').filter(t => t.trim().length > 0);
    if (chunks.length === 0) return res.json({ success: true, ingested: 0 });

    // 3. Generate Embeddings
    const embeddings = await generateEmbeddings(chunks);

    // 4. Store in VectorDB
    const ids = chunks.map((_, i) => `${Date.now()}-chunk-${i}`);
    const metadatas = chunks.map(() => ({ source: uri, ingestedAt: new Date().toISOString() }));
    
    await addDocuments(ids, embeddings, metadatas, chunks);

    res.json({ success: true, ingested: chunks.length });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

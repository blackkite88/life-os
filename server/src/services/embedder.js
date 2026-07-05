import { pipeline, env } from '@xenova/transformers';

// Disable Web Workers to prevent ERR_WORKER_PATH on Apple Silicon / Node.js fallbacks
env.backends.onnx.wasm.numThreads = 1;

let embedder = null;

export async function generateEmbeddings(texts) {
  if (!embedder) {
    // Load a lightweight, free local model (Xenova/bge-small-en-v1.5)
    console.log("Loading local embedding model...");
    embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
  }

  const embeddings = [];
  for (const text of texts) {
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(result.data));
  }
  
  return embeddings;
}

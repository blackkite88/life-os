import { generateEmbeddings } from './src/services/embedder.js';
import { queryDocuments } from './src/services/vectordb.js';

async function test() {
  const texts = ["Hello world"];
  const embs = await generateEmbeddings(texts);
  
  try {
    const results = await queryDocuments(embs, 3);
    console.log("Success:", results);
  } catch (err) {
    console.error("Query failed:", err);
  }
}

test().catch(console.error);

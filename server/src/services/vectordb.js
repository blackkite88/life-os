import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const client = new ChromaClient({ path: process.env.CHROMADB_URL || 'http://localhost:8000' });

const dummyEmbedder = { generate: async (texts) => [] };

export async function getCollection() {
  return await client.getOrCreateCollection({
    name: 'life_os_docs',
    embeddingFunction: dummyEmbedder
  });
}

export async function addDocuments(ids, embeddings, metadatas, documents) {
  const collection = await getCollection();
  await collection.add({
    ids,
    embeddings,
    metadatas,
    documents
  });
}

export async function queryDocuments(queryEmbeddings, nResults = 5) {
  const collection = await getCollection();
  return await collection.query({
    queryEmbeddings,
    nResults
  });
}

import { fetchDriveDocuments, fetchRecentEmails } from './google.js';
import { generateEmbeddings } from './embedder.js';
import { addDocuments } from './vectordb.js';

export async function runIngestionPipeline(onProgress = () => {}) {
  onProgress("Fetching Google Docs...", 5);
  const docs = await fetchDriveDocuments((msg) => onProgress(msg, 10));
  
  onProgress("Fetching Gmail...", 20);
  const emails = await fetchRecentEmails((msg) => onProgress(msg, 30));
  
  const combinedData = [...docs, ...emails];
  let totalIngested = 0;
  const totalItems = combinedData.length;
  let processedItems = 0;

  for (const item of combinedData) {
    processedItems++;
    const shortTitle = item.title ? item.title.substring(0, 40) : "Item";
    onProgress(`Processing ${shortTitle}...`, 40 + Math.floor((processedItems / totalItems) * 50));
    
    if (item.content) {
      let fullText = item.content;
      let baseMetadata = { source: item.title };

      if (item.sender) {
        fullText = `From: ${item.sender}\nDate: ${item.date}\nSubject: ${item.title}\n\n${item.content}`;
        baseMetadata = {
          source: item.title,
          sender: item.sender,
          date: item.date,
          threadId: item.threadId,
          type: 'email'
        };
      } else {
        fullText = `Title: ${item.title}\n\n${item.content}`;
        baseMetadata.type = 'document';
      }

      const paragraphs = fullText.split(/\n\s*\n/);
      const chunks = [];
      let currentChunk = "";
      
      for (const p of paragraphs) {
        // Target ~1000 chars to allow MORE chunks within the 6000 TPM limit
        if (currentChunk.length + p.length > 1000 && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        currentChunk += p + "\n\n";
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());

      const ids = chunks.map((_, i) => `${item.threadId || Date.now()}-chunk-${i}-${Math.random().toString(36).substr(2, 9)}`);
      const metadatas = chunks.map(() => ({ ...baseMetadata }));
      
      const embeddings = await generateEmbeddings(chunks);
      await addDocuments(ids, embeddings, metadatas, chunks);
      totalIngested += chunks.length;
    }
  }

  onProgress("Finalizing...", 100);
  return totalIngested;
}

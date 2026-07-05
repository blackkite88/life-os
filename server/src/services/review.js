import { getCollection } from './vectordb.js';
import { generateSummary } from './llm.js';

let latestReview = null;

export async function generateWeeklyReview() {
  console.log("Generating Weekly Review...");
  try {
    const collection = await getCollection();
    const result = await collection.get({
      limit: 20 // Get recent docs
    });
    
    if (!result.documents || result.documents.length === 0) {
      latestReview = "No recent documents found for review.";
      return;
    }

    const combinedDocs = result.documents.join("\n\n---\n\n");
    const summary = await generateSummary(combinedDocs);
    
    latestReview = {
      date: new Date().toISOString(),
      content: summary
    };
    console.log("Weekly Review generated successfully.");
  } catch (error) {
    console.error("Error generating weekly review:", error);
  }
}

export function getLatestReview() {
  return latestReview;
}

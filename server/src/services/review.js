import { searchEmailsLive, searchDriveLive } from './google.js';
import { generateSummary } from './llm.js';

let latestReview = null;

export async function generateWeeklyReview() {
  console.log("Generating Weekly Review...");
  try {
    const emails = await searchEmailsLive('newer_than:7d', 10);
    const docs = await searchDriveLive('', 5);

    let combinedText = "RECENT EMAILS:\n\n";
    emails.forEach(e => combinedText += `From: ${e.from}\nSubject: ${e.subject}\nBody: ${e.content}\n\n`);
    
    combinedText += "\n\nRECENT DOCUMENTS:\n\n";
    docs.forEach(d => combinedText += `Title: ${d.name}\nContent: ${d.content}\n\n`);

    if (emails.length === 0 && docs.length === 0) {
      latestReview = { date: new Date().toISOString(), content: "No recent activity found to review." };
      return;
    }

    const summary = await generateSummary(combinedText);
    
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

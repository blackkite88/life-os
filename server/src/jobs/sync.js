import cron from 'node-cron';
import { isAuthenticated } from '../services/google.js';
import { runIngestionPipeline } from '../services/ingestion.js';

export function scheduleSyncJob() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    if (!isAuthenticated()) {
      console.log("[Cron] Sync skipped (Not authenticated with Google)");
      return;
    }

    console.log("[Cron] Starting background sync...");
    
    try {
      // Pass a dummy progress function so it doesn't crash but logs basic steps
      const totalIngested = await runIngestionPipeline((msg, percent) => {
        if (percent === 100) console.log(`[Cron] ${msg}`);
      });
      console.log(`[Cron] Completed. Ingested ${totalIngested} chunks.`);
    } catch (error) {
      console.error("[Cron] Failed to ingest data", error);
    }
  });

  console.log("Background sync cron job scheduled (Runs hourly).");
}

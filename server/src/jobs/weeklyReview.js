import cron from 'node-cron';
import { generateWeeklyReview } from '../services/review.js';

export function setupWeeklyReviewCron() {
  // Run every Sunday at 8:00 AM
  cron.schedule('0 8 * * 0', async () => {
    console.log('Running scheduled weekly review...');
    await generateWeeklyReview();
  });
  console.log('Weekly review cron job scheduled.');
}

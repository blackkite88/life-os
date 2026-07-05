import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import ingestRouter from './routes/ingest.js';
import reviewRouter from './routes/review.js';
import authRouter from './routes/auth.js';
import { setupWeeklyReviewCron } from './jobs/weeklyReview.js';
import { scheduleSyncJob } from './jobs/sync.js';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/review', reviewRouter);
app.use('/api/auth', authRouter);

setupWeeklyReviewCron();
scheduleSyncJob();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

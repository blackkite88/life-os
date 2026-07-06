import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import reviewRoutes from './routes/review.js';
import mcpRoutes from './services/mcp.js';
import { setupWeeklyReviewCron } from './jobs/weeklyReview.js';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());

// Mount MCP before express.json() so it can read the raw request stream
app.use('/mcp', mcpRoutes);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/review', reviewRoutes);

setupWeeklyReviewCron();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

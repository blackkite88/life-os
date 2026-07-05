import express from 'express';
import { getLatestReview, generateWeeklyReview } from '../services/review.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const review = getLatestReview();
  if (!review) {
    return res.json(null);
  }
  res.json(review);
});

router.post('/generate', authenticate, async (req, res) => {
  await generateWeeklyReview();
  res.json(getLatestReview());
});

export default router;

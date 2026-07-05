import express from 'express';
import { getAuthUrl, setCredentials, isAuthenticated } from '../services/google.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ authenticated: isAuthenticated() });
});

router.get('/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    await setCredentials(code);
    res.send(`
      <html>
        <body>
          <h2>Authentication Successful!</h2>
          <p>You can close this window and go back to Personal Life OS.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Auth callback error:", err);
    res.status(500).send("Authentication failed");
  }
});

export default router;

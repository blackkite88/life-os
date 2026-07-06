import { google } from 'googleapis';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config({ path: '../.env' });

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback'
);

export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function processOAuthCallback(code) {
  const { tokens } = await oauth2Client.getToken(code);
  
  // Create a temporary client to fetch user profile
  const tempClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback'
  );
  tempClient.setCredentials(tokens);
  
  const oauth2 = google.oauth2({ version: 'v2', auth: tempClient });
  const userInfo = await oauth2.userinfo.get();
  
  // Upsert user in DB
  let user = await User.findOne({ googleId: userInfo.data.id });
  if (!user) {
    user = new User({
      googleId: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name
    });
  }
  
  // Update tokens
  user.googleTokens = tokens;
  await user.save();
  
  return user;
}

// Helper to get an authenticated client for a specific user
async function getUserAuthClient(userId) {
  const user = await User.findById(userId);
  if (!user || !user.googleTokens) {
    throw new Error("User not found or not authenticated");
  }
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback'
  );
  client.setCredentials(user.googleTokens);
  return client;
}

// Helper for safe base64url decoding
function decodeBase64Url(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const buff = Buffer.from(base64, 'base64');
  return buff.toString('utf-8');
}

// Recursive function to extract plain text
function extractPlainText(payload) {
  if (!payload) return "";
  if (payload.mimeType === 'text/plain' && payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }
  if (payload.body && payload.body.data && !payload.parts) {
    return decodeBase64Url(payload.body.data);
  }
  return "";
}

// Live agentic searches
export async function searchEmailsLive(query, userId, maxResults = 3) {
  const authClient = await getUserAuthClient(userId);
  const gmail = google.gmail({ version: 'v1', auth: authClient });
  const emails = [];
  
  try {
    const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
    const messages = res.data.messages;
    if (!messages) return [];
    
    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
      const payload = msgRes.data.payload;
      const headers = payload.headers || [];
      const subject = (headers.find(h => h.name.toLowerCase() === 'subject') || {}).value || "No Subject";
      const from = (headers.find(h => h.name.toLowerCase() === 'from') || {}).value || "Unknown Sender";
      const date = (headers.find(h => h.name.toLowerCase() === 'date') || {}).value || "Unknown Date";
      
      let body = extractPlainText(payload) || msgRes.data.snippet || "";
      const cleanBody = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      const link = `https://mail.google.com/mail/u/0/#all/${msg.id}`;
        
      emails.push({ subject, from, date, content: cleanBody, link });
    }
  } catch (error) {
    console.error("Live search error:", error);
  }
  return emails;
}

export async function searchDriveLive(query, userId, maxResults = 3) {
  const authClient = await getUserAuthClient(userId);
  const drive = google.drive({ version: 'v3', auth: authClient });
  const docs = [];
  
  try {
    const res = await drive.files.list({
      q: `fullText contains '${query.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.document'`,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType)'
    });
    
    const files = res.data.files;
    if (!files || files.length === 0) return [];
    
    for (const file of files) {
      const exportRes = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' });
      let text = exportRes.data;
      if (typeof text !== 'string') text = JSON.stringify(text);
      
      const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 1500);
      const link = `https://docs.google.com/document/d/${file.id}/edit`;
      
      docs.push({ name: file.name, content: cleanText, link });
    }
  } catch (error) {
    console.error("Live drive search error:", error);
  }
  return docs;
}

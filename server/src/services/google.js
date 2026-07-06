import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config({ path: '../.env' });

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback'
);

const TOKEN_PATH = path.join(process.cwd(), 'google-tokens.json');

let userCredential = null;

// Load existing token if found
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
    userCredential = tokens;
  } catch (err) {
    console.warn("Failed to load saved Google tokens:", err);
  }
}

export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function setCredentials(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  userCredential = tokens;
  
  // Save token to disk for persistence across restarts
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  
  return tokens;
}

export function isAuthenticated() {
  return !!userCredential;
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

  // Fallback if it's just a root body
  if (payload.body && payload.body.data && !payload.parts) {
    return decodeBase64Url(payload.body.data);
  }
  
  return "";
}

export async function fetchDriveDocuments(onProgress) {
  if (!isAuthenticated()) throw new Error("Not authenticated with Google");
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const docs = [];
  
  try {
    // Fetch recent Google Docs (limit 10 for performance)
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      pageSize: 10,
      fields: 'files(id, name)',
      orderBy: 'modifiedTime desc'
    });

    const files = res.data.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (onProgress) onProgress(`Fetching document ${i + 1} of ${files.length}...`);
      try {
        const docRes = await drive.files.export({
          fileId: file.id,
          mimeType: 'text/plain'
        });
        docs.push({ title: file.name, content: docRes.data });
      } catch (e) {
        console.warn(`Failed to export document ${file.name}:`, e.message);
      }
    }
  } catch (error) {
    console.error("Drive fetch error:", error);
  }
  
  return docs;
}

export async function fetchRecentEmails(onProgress) {
  if (!isAuthenticated()) throw new Error("Not authenticated with Google");

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const emails = [];

  try {
    // Fetch last 50 emails from the past 7 days
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'newer_than:7d',
      maxResults: 50
    });

    if (res.data.messages) {
      const total = res.data.messages.length;
      for (let i = 0; i < total; i++) {
        const msg = res.data.messages[i];
        if (onProgress) onProgress(`Fetching email ${i + 1} of ${total}...`);
        
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        const payload = msgRes.data.payload;
        let body = extractPlainText(payload);

        // Fallback to snippet if body parsing fails
        if (!body) {
          body = msgRes.data.snippet || "No body content found.";
        }

        const threadId = msgRes.data.threadId || msg.id;

        const headers = payload.headers || [];
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
        const subject = subjectHeader ? subjectHeader.value : "No Subject";
        
        const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
        const from = fromHeader ? fromHeader.value : "Unknown Sender";
        
        const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');
        const date = dateHeader ? dateHeader.value : "Unknown Date";

        if (body) {
          // Strip <style> and <script> contents entirely, then strip remaining HTML tags
          const cleanBody = body
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]*>?/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          emails.push({ 
            title: subject,
            sender: from,
            date: date,
            threadId: threadId,
            content: cleanBody 
          });
        }
      }
    }
  } catch (error) {
    console.error("Gmail fetch error:", error);
  }

  return emails;
}

// New function for live agentic searches
export async function searchEmailsLive(query, maxResults = 3) {
  if (!userCredential) throw new Error("Not authenticated");
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const emails = [];
  
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });
    
    const messages = res.data.messages;
    if (!messages) return [];
    
    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });
      
      const payload = msgRes.data.payload;
      const headers = payload.headers || [];
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
      const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');
      
      const subject = subjectHeader ? subjectHeader.value : "No Subject";
      const from = fromHeader ? fromHeader.value : "Unknown Sender";
      const date = dateHeader ? dateHeader.value : "Unknown Date";
      
      let body = extractPlainText(payload);
      if (!body) body = msgRes.data.snippet || "";
      
      const cleanBody = body
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const link = `https://mail.google.com/mail/u/0/#all/${msg.id}`;
        
      emails.push({
        subject, from, date, content: cleanBody, link
      });
    }
  } catch (error) {
    console.error("Live search error:", error);
  }
  
  return emails;
}

// New function for live MCP Drive searches
export async function searchDriveLive(query, maxResults = 3) {
  if (!userCredential) throw new Error("Not authenticated");
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
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
      const exportRes = await drive.files.export({
        fileId: file.id,
        mimeType: 'text/plain'
      });
      
      let text = exportRes.data;
      if (typeof text !== 'string') text = JSON.stringify(text);
      
      const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 1500); // chunk it
      const link = `https://docs.google.com/document/d/${file.id}/edit`;
      
      docs.push({
        name: file.name,
        content: cleanText,
        link
      });
    }
  } catch (error) {
    console.error("Live drive search error:", error);
  }
  
  return docs;
}

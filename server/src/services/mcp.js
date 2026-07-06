import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { searchEmailsLive, searchDriveLive } from './google.js';

const router = express.Router();
const mcpServer = new Server({
  name: "Life-OS-MCP",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_gmail",
        description: "Search the user's live Gmail inbox for real-time or specific emails. E.g. query='from:zerodha' or 'subject:order'.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The native Gmail search query to execute (e.g. 'newer_than:2d')." }
          },
          required: ["query"]
        }
      },
      {
        name: "search_drive",
        description: "Search the user's Google Drive for documents containing specific text.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The text to search for within documents." }
          },
          required: ["query"]
        }
      }
    ]
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "search_gmail") {
    const emails = await searchEmailsLive(args.query, 3);
    const text = emails.length > 0 
      ? emails.map(e => `[LIVE GMAIL] **From:** ${e.from}\n**Date:** ${e.date}\n**Subject:** ${e.subject}\n**Link:** [Open in Gmail](${e.link})\n**Body:** ${e.content}`).join("\n\n")
      : "No emails found.";
    return { content: [{ type: "text", text }] };
  }
  
  if (name === "search_drive") {
    const docs = await searchDriveLive(args.query, 3);
    const text = docs.length > 0
      ? docs.map(d => `[DRIVE DOC] **Name:** ${d.name}\n**Link:** [Open in Drive](${d.link})\n**Content:** ${d.content}`).join("\n\n")
      : "No documents found.";
    return { content: [{ type: "text", text }] };
  }
  
  throw new Error(`Tool not found: ${name}`);
});

let transport = null;

router.get('/sse', async (req, res) => {
  transport = new SSEServerTransport("/mcp/messages", res);
  await mcpServer.connect(transport);
});

router.post('/messages', async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(500).send("No active transport");
  }
});

export default router;

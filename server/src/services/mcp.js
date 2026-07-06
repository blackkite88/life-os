import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { searchEmailsLive, searchDriveLive } from './google.js';

const router = express.Router();

// We need to map active SSE transports by a unique session ID
// because MCP clients send a POST to /messages?sessionId=...
const transports = new Map();

router.get('/sse', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).send("Missing x-user-id header");
  }

  // Spin up a unique MCP Server just for this user
  const mcpServer = new Server({
    name: `Life-OS-MCP-${userId}`,
    version: "1.0.0"
  }, {
    capabilities: { tools: {} }
  });

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_gmail",
          description: "Search the user's live Gmail inbox for real-time or specific emails.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        },
        {
          name: "search_drive",
          description: "Search the user's Google Drive for documents.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" }
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
      const emails = await searchEmailsLive(args.query, userId, 3);
      const text = emails.length > 0 
        ? emails.map(e => `[LIVE GMAIL] **From:** ${e.from}\n**Date:** ${e.date}\n**Subject:** ${e.subject}\n**Link:** [Open in Gmail](${e.link})\n**Body:** ${e.content}`).join("\n\n")
        : "No emails found.";
      return { content: [{ type: "text", text }] };
    }
    
    if (name === "search_drive") {
      const docs = await searchDriveLive(args.query, userId, 3);
      const text = docs.length > 0
        ? docs.map(d => `[DRIVE DOC] **Name:** ${d.name}\n**Link:** [Open in Drive](${d.link})\n**Content:** ${d.content}`).join("\n\n")
        : "No documents found.";
      return { content: [{ type: "text", text }] };
    }
    
    throw new Error(`Tool not found: ${name}`);
  });

  const transport = new SSEServerTransport("/mcp/messages", res);
  
  // Connect the server to the transport
  await mcpServer.connect(transport);
  
  // Store the transport using its sessionId so POST /messages can find it
  transports.set(transport.sessionId, transport);
  
  // Clean up when connection closes
  res.on('close', () => {
    transports.delete(transport.sessionId);
  });
});

router.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send("Transport not found");
  }
});

export default router;

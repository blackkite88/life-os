import express from 'express';
import { streamChat, groq } from '../services/llm.js';
import { authenticate } from '../middleware/auth.js';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const router = express.Router();

let mcpClient = null;

async function getMcpClient() {
  if (mcpClient) return mcpClient;
  
  // Connect to our own MCP Server running on the same host using dynamic port
  const port = process.env.PORT || 3001;
  const transport = new SSEClientTransport(new URL(`http://localhost:${port}/mcp/sse`));
  const client = new Client({
    name: "Life-OS-Chat",
    version: "1.0.0"
  }, {
    capabilities: {}
  });
  
  await client.connect(transport);
  mcpClient = client;
  return client;
}

router.post('/', authenticate, async (req, res) => {
  const { message, history = [] } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const client = await getMcpClient();
    const toolsRes = await client.listTools();
    const mcpTools = toolsRes.tools || [];
    
    // Map MCP Tools to Groq format
    const groqTools = mcpTools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
      }
    }));

    const baseSystemPrompt = `You are a pure MCP Agent for the user's Personal Life OS.

You have access to MCP Tools that let you search the user's live Gmail inbox and Google Drive documents.

RULES:
- When the user asks a question, ALWAYS use the relevant MCP tools to find the answer.
- Call tools silently (never mention searching, tools, or your process).
- Never output raw/uppercase tool logs, brackets, or meta-commentary — only clean natural language.
- Format responses in short paragraphs or bullet points, not walls of text.
- Bold key details (sender name, subject, dates, key facts, document titles) using **markdown bold**.
- ALWAYS include a clickable markdown link to the original email or document if a Link URL is provided by the tool (e.g., [Open in Gmail](URL)).
- Never hallucinate — if no data is found, say so plainly.
- Keep tone conversational, concise, and human — like a helpful assistant.`;

    let messages = [
      ...history,
      { role: 'user', content: message }
    ];

    let responseMsg = null;

    try {
      const initialResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: baseSystemPrompt },
          ...messages
        ],
        tools: groqTools.length > 0 ? groqTools : undefined,
        tool_choice: "auto",
        temperature: 0.1
      });
      responseMsg = initialResponse.choices[0].message;
    } catch (toolError) {
      console.warn("Groq Tool Call Failed:", toolError.message);
    }

    if (responseMsg && responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      const toolCall = responseMsg.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      // Execute Tool via MCP Client
      const result = await client.callTool({
        name: toolCall.function.name,
        arguments: args
      });
      
      const toolText = result.content[0]?.text || "No results found.";

      messages.push(responseMsg);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: toolText
      });

      // Stream final generated response after tool execution
      await streamChat(messages, baseSystemPrompt, (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      });

    } else if (responseMsg && responseMsg.content) {
      // No tool was called! Return the direct answer.
      res.write(`data: ${JSON.stringify({ text: responseMsg.content })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ text: "I'm sorry, I couldn't process that." })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;

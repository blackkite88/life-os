import express from 'express';
import { generateEmbeddings } from '../services/embedder.js';
import { queryDocuments } from '../services/vectordb.js';
import { streamChat, groq } from '../services/llm.js';
import { authenticate } from '../middleware/auth.js';
import { searchEmailsLive } from '../services/google.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const { message, history = [] } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 1. Embed query and fetch Local Vector DB Context
    const queryEmbeddings = await generateEmbeddings([message]);
    const results = await queryDocuments(queryEmbeddings, 5);
    const contextDocs = results.documents[0] || [];
    const contextText = contextDocs.join("\n\n");

    const baseSystemPrompt = `You are a Hybrid AI assistant for the user's Personal Life OS.

You have access to historical local data and a live_search_gmail tool.

RULES:
- Use local context by default.
- If context is insufficient or user asks for realtime/latest updates, call live_search_gmail silently (never mention searching, tools, or your process).
- Never output raw/uppercase tool logs, brackets, or meta-commentary — only clean natural language.
- Format responses in short paragraphs or bullet points, not walls of text.
- Bold key details (sender name, subject, dates, key facts) using **markdown bold**.
- ALWAYS include a clickable markdown link to the original email if a Link URL is provided in the context (e.g., [Open in Gmail](URL)).
- Never hallucinate — if no data is found, say so plainly.
- Keep tone conversational, concise, and human — like a helpful assistant summarizing an email, not a system printing logs.

Local Database Context:
${contextText}`;

    let messages = [
      ...history,
      { role: 'user', content: message }
    ];

    let responseMsg = null;

    // 2. Hybrid Agent Check: Ask LLM if it needs to use a Tool
    try {
      const initialResponse = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: baseSystemPrompt },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "live_search_gmail",
              description: "Search the user's live Gmail inbox for real-time or specific emails not found in the local context. E.g. query='from:zerodha' or 'subject:order'.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The native Gmail search query to execute (e.g. 'newer_than:2d from:john')."
                  }
                },
                required: ["query"]
              }
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.1
      });
      responseMsg = initialResponse.choices[0].message;
    } catch (toolError) {
      console.warn("Groq Tool Call Failed:", toolError.message);
      // Fallback: Continue without tools if Groq's backend tool parser crashes
    }

    // 3. Execute Tool if Requested
    if (responseMsg && responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      const toolCall = responseMsg.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      const liveEmails = await searchEmailsLive(args.query, 3);

      if (liveEmails.length > 0) {
        const liveText = liveEmails.map(e => `[LIVE] **From:** ${e.from}\n**Date:** ${e.date}\n**Subject:** ${e.subject}\n**Link:** [Open in Gmail](${e.link})\n**Body:** ${e.content}`).join("\n\n");
        messages.push(responseMsg);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: liveText
        });
      } else {
        messages.push(responseMsg);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: "No live emails found for that query."
        });
      }

      // 4. Stream final generated response after tool execution
      await streamChat(messages, baseSystemPrompt, (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      });

      // Force append the source links at the end so we don't rely on the LLM
      if (liveEmails.length > 0) {
        let sourcesText = "\n\n**Sources:**\n";
        liveEmails.forEach(e => {
          sourcesText += `- [Open in Gmail](${e.link}) (${e.subject})\n`;
        });
        const chunks = sourcesText.match(/.{1,4}/g) || [sourcesText];
        for (const chunk of chunks) {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      }
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

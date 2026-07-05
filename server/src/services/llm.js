import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function streamChat(messages, systemPrompt, onData) {
  // Groq requires system prompt to be part of the messages array for standard chat completions
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const stream = await groq.chat.completions.create({
    messages: apiMessages,
    model: 'llama-3.1-8b-instant', // Groq supported model
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      onData(content);
    }
  }
}

export async function generateSummary(text) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an AI assistant.' },
      { role: 'user', content: `Summarize the following text for a weekly review:\n\n${text}` }
    ]
  });
  
  return response.choices[0]?.message?.content || '';
}

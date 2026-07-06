# Personal Life OS (MCP Edition)

Personal Life OS is a local, AI-powered hybrid agent that connects to your personal data (Gmail, Google Drive). 

This project uses a pure **Model Context Protocol (MCP)** architecture. Instead of syncing your data to a vector database, it exposes your live accounts as MCP Tools. When you ask a question, the LLM dynamically decides which MCP Tool to invoke to fetch your latest data.

## 🚀 Features

- **Pure MCP Architecture**: The backend spins up an MCP Server that exposes your live Gmail and Google Drive as standardized tools. The chat agent acts as an MCP Client.
- **Agentic Tool Calling**: Powered by Groq's `llama-3.1-8b-instant`, the agent autonomously fetches available tools from the MCP server and executes them when necessary.
- **Real-time Streaming**: Chat responses stream directly to the frontend using Server-Sent Events (SSE).
- **Persistent Chat Sessions**: Full ChatGPT-style sidebar with chat history securely saved to your browser's local storage.
- **Google OAuth Integration**: Secure, persistent authentication with Google APIs.

## 🛠️ Technology Stack

### Frontend
- **React (Vite)**: Fast, modern UI framework.
- **Tailwind CSS v4**: Utility-first styling for a sleek, dark-mode-first premium design.
- **React Markdown**: Renders LLM outputs natively with bolding, lists, and clickable links.
- **LocalStorage**: Handles persistent multi-chat sessions entirely on the client-side.

### Backend
- **Node.js & Express**: Lightweight, fast server architecture.
- **Model Context Protocol (`@modelcontextprotocol/sdk`)**: Powers the native Server and Client standard for tool execution.
- **Groq API**: High-speed token generation and function calling.
- **Google APIs (`googleapis`)**: 
  - **Gmail API**: Exposes `search_gmail` MCP tool.
  - **Google Drive API**: Exposes `search_drive` MCP tool.

## 🧠 Architecture Flow

1. **Authentication**: User logs in via Google OAuth. The backend securely stores the refresh tokens locally.
2. **MCP Handshake**: When you send a message, the Chat route (`chat.js`) acts as an MCP Client. It connects to the local MCP Server (`mcp.js`) and fetches the list of available tools (`search_gmail`, `search_drive`).
3. **Agentic Evaluation**: The LLM evaluates if it needs to use a tool. If you ask about a recent email or document, it returns a tool call.
4. **Tool Execution**: The backend executes the tool via the MCP Client, which translates to a native Google API call.
5. **Streaming**: The final answer, complete with direct URL links to the source emails/docs, is streamed back to the frontend.

## 💻 Running Locally

1. **Clone & Install**:
   - Navigate to `/client` and run `npm install`
   - Navigate to `/server` and run `npm install`
2. **Environment Variables**:
   - Ensure your `.env` contains your `GROQ_API_KEY` and Google Cloud OAuth credentials.
3. **Start the Servers**:
   - Start the backend: `cd server && npm run dev`
   - Start the frontend: `cd client && npm run dev`
4. **Access**: Open `http://localhost:3000` in your browser.

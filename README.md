# Personal Life OS

Personal Life OS is a local, AI-powered hybrid agent that connects to your personal data (Gmail, Google Drive) and acts as a localized, proactive assistant. 

It is designed with a privacy-first, locally-hosted architecture, allowing you to seamlessly chat with your historical documents or fetch live data in real-time.

## 🚀 Features

- **Hybrid Agentic AI**: The core brain uses Groq's high-speed Llama 3 models. It autonomously decides whether to answer from your local vector database (historical data) or trigger a live tool to search your Gmail inbox for real-time answers.
- **Local RAG Pipeline**: Ingests and chunks documents, embedding them locally on your machine, and stores them in a local ChromaDB instance. 
- **Real-time Streaming**: Chat responses stream directly to the frontend using Server-Sent Events (SSE).
- **Persistent Chat Sessions**: Full ChatGPT-style sidebar with chat history securely saved to your browser's local storage.
- **Google OAuth Integration**: Secure, persistent authentication with Google APIs, meaning you only have to log in once.

## 🛠️ Technology Stack

### Frontend
- **React (Vite)**: Fast, modern UI framework.
- **Tailwind CSS v4**: Utility-first styling for a sleek, dark-mode-first premium design.
- **React Markdown**: Renders LLM outputs natively with bolding, lists, and clickable links pointing directly to your emails.
- **LocalStorage**: Handles persistent multi-chat sessions entirely on the client-side.

### Backend
- **Node.js & Express**: Lightweight, fast server architecture.
- **Groq API**: Powers the LLM (`llama-3.1-8b-instant`) for blazing fast token generation and function calling.
- **ChromaDB**: Open-source vector database running locally for semantic search.
- **HuggingFace Transformers (`@xenova/transformers`)**: Runs embedding models completely locally in Node.js for RAG.
- **Google APIs (`googleapis`)**: 
  - **Gmail API**: Live inbox searching and fetching.
  - **Google Drive API**: Document fetching for vector DB ingestion.
- **Nodemon**: Hot-reloading for rapid backend development.

## 🧠 Architecture Flow

1. **Authentication**: User logs in via Google OAuth. The backend securely stores the refresh tokens locally.
2. **Data Sync (Ingestion)**: The user triggers a Drive sync. The backend fetches documents, strips HTML, chunks the text, runs it through a local embedding model, and saves the vectors to ChromaDB.
3. **Chat Query**: 
   - The user asks a question.
   - The query is embedded, and relevant historical context is pulled from ChromaDB.
   - The context and query are sent to the Groq LLM.
4. **Agentic Tool Calling**:
   - The LLM evaluates if the local context is enough.
   - If not (e.g. asking for "latest emails"), the LLM silently triggers the `live_search_gmail` tool.
   - The backend intercepts the tool call, fetches the live data from Gmail, and injects it back into the prompt.
5. **Streaming**: The final answer, complete with direct URL links to the source emails, is streamed back to the frontend.

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

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export class MCPService {
  constructor() {
    this.client = null;
    this.transport = null;
  }

  async connect() {
    const mcpUrl = process.env.DRIVE_MCP_URL;
    if (!mcpUrl) throw new Error("DRIVE_MCP_URL not configured");

    this.transport = new SSEClientTransport(new URL(mcpUrl));
    this.client = new Client({
      name: "life-os-client",
      version: "1.0.0",
    }, { capabilities: { resources: {}, tools: {} } });

    await this.client.connect(this.transport);
    console.log("Connected to Google Drive MCP");
  }

  async listResources() {
    if (!this.client) await this.connect();
    return await this.client.listResources();
  }

  async readResource(uri) {
    if (!this.client) await this.connect();
    return await this.client.readResource({ uri });
  }
}

export const mcpService = new MCPService();

#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const K2ThinkClient = require('./client.js');

class K2ThinkMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'k2think-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'k2think_chat',
            description: 'Send a message to K2Think AI model',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to send to K2Think',
                },
                model: {
                  type: 'string',
                  description: 'Model to use (default: MBZUAI-IFM/K2-Think)',
                  default: 'MBZUAI-IFM/K2-Think',
                },
                temperature: {
                  type: 'number',
                  description: 'Temperature for response generation (0-2)',
                  minimum: 0,
                  maximum: 2,
                  default: 0.7,
                },
                max_tokens: {
                  type: 'integer',
                  description: 'Maximum tokens to generate',
                  default: 1000,
                },
              },
              required: ['message'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'k2think_chat') {
          const { message, model, temperature, max_tokens } = args;
          
          // Initialize K2Think client
          const client = new K2ThinkClient();
          
          const response = await client.chat.completions.create({
            model: model || 'MBZUAI-IFM/K2-Think',
            messages: [{ role: 'user', content: message }],
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 1000,
          });

          return {
            content: [
              {
                type: 'text',
                text: response.choices[0].message.content,
              },
            ],
          };
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('K2Think MCP server running on stdio');
  }
}

const server = new K2ThinkMCPServer();
server.run().catch(console.error);

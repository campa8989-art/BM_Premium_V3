/**
 * LM STUDIO MCP BRIDGE
 * Model Context Protocol Server for connecting Antigravity to local LM Studio instances.
 * Endpoint: http://localhost:1234/v1
 */

const readline = require('readline');

// --- Configuration ---
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || "http://localhost:1234/v1";

// --- Helpers ---
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${LM_STUDIO_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (e) {
        throw new Error(`Failed to connect to LM Studio at ${url}. Ensure the local server is running.`);
    }
}

// --- MCP Implementation ---
const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
});

rl.on('line', async (line) => {
    if (!line.trim()) return;
    
    try {
        const request = JSON.parse(line);
        const { method, params, id } = request;

        switch (method) {
            case 'initialize':
                sendResponse(id, {
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        tools: {
                            list_local_models: {
                                description: "Lists all models currently loaded or available in LM Studio",
                                inputSchema: { type: "object", properties: {} }
                            },
                            query_local_model: {
                                description: "Sends a text prompt to the local model in LM Studio",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        prompt: { type: "string", description: "The message to send to the model" },
                                        system: { type: "string", description: "Optional system instruction" }
                                    },
                                    required: ["prompt"]
                                }
                            }
                        }
                    },
                    serverInfo: { name: "lm-studio-bridge", version: "1.0.0" }
                });
                break;

            case 'tools/list':
                sendResponse(id, {
                    tools: [
                        {
                            name: "list_local_models",
                            description: "List all models available in LM Studio",
                            inputSchema: { type: "object", properties: {} }
                        },
                        {
                            name: "query_local_model",
                            description: "Query the local LLM",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    prompt: { type: "string" },
                                    system: { type: "string" }
                                },
                                required: ["prompt"]
                            }
                        }
                    ]
                });
                break;

            case 'tools/call':
                await handleToolCall(id, params.name, params.arguments);
                break;

            default:
                // Handle other methods or ignore
                if (id !== undefined) sendError(id, -32601, "Method not found");
        }
    } catch (e) {
        // Silently ignore malformed JSON or log to stderr
        console.error("MCP Error:", e.message);
    }
});

async function handleToolCall(id, name, args) {
    try {
        if (name === "list_local_models") {
            const data = await apiRequest("/models");
            const models = data.data.map(m => m.id);
            sendResponse(id, {
                content: [{ type: "text", text: `Modelli disponibili: ${models.join(", ")}` }]
            });
        } 
        else if (name === "query_local_model") {
            const messages = [];
            if (args.system) messages.push({ role: "system", content: args.system });
            messages.push({ role: "user", content: args.prompt });

            const data = await apiRequest("/chat/completions", "POST", {
                messages,
                temperature: 0.7,
                max_tokens: 2000
            });

            const answer = data.choices[0].message.content;
            sendResponse(id, {
                content: [{ type: "text", text: answer }]
            });
        }
        else {
            sendError(id, -32602, "Unknown tool");
        }
    } catch (e) {
        sendResponse(id, {
            content: [{ type: "text", text: `❌ ERRORE: ${e.message}` }],
            isError: true
        });
    }
}

function sendResponse(id, result) {
    console.log(JSON.stringify({ jsonrpc: "2.0", id, result }));
}

function sendError(id, code, message) {
    console.log(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }));
}

// Global error handler to prevent crashing
process.on('uncaughtException', (err) => {
    console.error('Caught exception: ' + err);
});

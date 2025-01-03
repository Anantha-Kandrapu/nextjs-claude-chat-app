import { BedrockRuntimeClient, ConverseStreamCommand, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { loadConversation, saveConversation } from '@/utils/fileUtils';
import { fromIni } from "@aws-sdk/credential-providers";
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { log } from "console";
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: string;
        text: string;
    }>;
}

function runAdacredsCommand() {
    return new Promise((resolve, reject) => {
        exec('ada credentials update --once --account=135601577239 --provider=conduit --partition=aws --role=IibsAdminAccess-DO-NOT-DELETE --profile=bedrock', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
                return;
            }
            console.log(`adacreds command output: ${stdout}`);
            resolve(stdout);
        });
    });
}

function refreshCredentials() {
    return new BedrockRuntimeClient({
        region: 'us-west-2',
        credentials: fromIni({
            profile: 'bedrock'
        })
    });
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
        return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    async function attemptLoad() {
        try {
            const messages = await loadConversation(conversationId!);
            return NextResponse.json({ messages });
        } catch (error) {
            console.error("Error loading conversation:", error);
            throw error;
        }
    }

    try {
        return await attemptLoad();
    } catch (error) {
        console.log("Attempting to refresh credentials and retry...");
        try {
            await runAdacredsCommand();
            const client = refreshCredentials();
            return await attemptLoad();
        } catch (retryError) {
            console.error("Error after refreshing credentials:", retryError);
            return NextResponse.json({ error: "Failed to load conversation after refreshing credentials" }, { status: 500 });
        }
    }
}

export async function POST(req: Request) {
    const client = getClient();
    const { messages, conversationId } = await req.json();

    const input = {
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: messages.map((msg: { role: any; content: any[]; }) => ({
            role: msg.role,
            content: msg.content.map(content => ({
                text: content.text
            }))
        })),
        inferenceConfig: {
            maxTokens: 4096,
            temperature: 0.3,
            topP: 0.999
        }
    };

    try {
        const command = new ConverseStreamCommand(input);
        const response = await client.send(command);

        if (!response.stream) {
            throw new Error('No stream available in response');
        }

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response.stream!) {
                        if (chunk.contentBlockDelta?.delta?.text) {
                            controller.enqueue(new TextEncoder().encode(chunk.contentBlockDelta.delta.text));
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error('Stream processing error:', error);
                    controller.error(error);
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Streaming error:', error);
        return new Response(JSON.stringify({ error: 'Streaming failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}


function getClient() {
    return new BedrockRuntimeClient({
        credentials: fromIni({
            profile: 'bedrock'
        })
    });
}
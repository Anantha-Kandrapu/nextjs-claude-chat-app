import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { loadConversation, saveConversation } from '@/utils/fileUtils';
import { fromIni } from "@aws-sdk/credential-providers";
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

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
            client = refreshCredentials();
            return await attemptLoad();
        } catch (retryError) {
            console.error("Error after refreshing credentials:", retryError);
            return NextResponse.json({ error: "Failed to load conversation after refreshing credentials" }, { status: 500 });
        }
    }
}

export async function POST(req: Request) {
    const clonedReq = req.clone();
    async function attemptRequest(request: Request) {
        const client = getClient();
        const { messages, conversationId } = await request.json();

        const requestInput = {
            modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4096,
                temperature : 0.3,
                top_p: 0.999,
                messages: messages,
            }),
        };

        const command = new InvokeModelCommand(requestInput);
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        const assistantMessage = { role: 'assistant', content: [{ type: 'text', text: responseBody.content[0].text }] };
        const updatedMessages = [...messages, assistantMessage];

        await saveConversation(conversationId, updatedMessages);

        return NextResponse.json({ response: responseBody.content[0].text });
    }
    try {
        return await attemptRequest(req);
    } catch (error) {
        console.error("Error in chat API:", error);
        console.log("Attempting to refresh credentials and retry...");
        try {
            await runAdacredsCommand();
            return await attemptRequest(clonedReq);  // Use the cloned request for retry
        } catch (retryError) {
            console.error("Error after refreshing credentials:", retryError);
            return NextResponse.json({ error: "An error occurred while processing your request, even after refreshing credentials." }, { status: 500 });
        }
    }
}

function getClient() {
    return new BedrockRuntimeClient({
        credentials: fromIni({
            profile: 'bedrock'
        })
    });
}
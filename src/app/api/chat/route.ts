import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { loadConversation, saveConversation } from '@/utils/fileUtils';
import { NextRequest, NextResponse } from 'next/server';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
        return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    try {
        const messages = await loadConversation(conversationId);
        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error loading conversation:", error);
        return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { messages, conversationId } = await req.json();

        const request = {
            modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1024,
                messages: messages,
            }),
        };

        const command = new InvokeModelCommand(request);
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        const assistantMessage = { role: 'assistant', content: [{ type: 'text', text: responseBody.content[0].text }] };
        const updatedMessages = [...messages, assistantMessage];

        // Save the conversation
        await saveConversation(conversationId, updatedMessages);

        return NextResponse.json({ response: responseBody.content[0].text });
    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json({ error: "An error occurred while processing your request." }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_HOST = 'http://192.168.1.128:11434';
const MODEL = 'llama3.1:8b-instruct-q4_K_M';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Construct the prompt
    let prompt = `You are HEXNODE Assistant, a Minecraft server hosting expert.
You help users configure, optimize, and troubleshoot Minecraft servers.
Be concise, practical, and technical when appropriate.

`;

    // Add context if provided
    if (context) {
      if (context.resourcePool) {
        prompt += `User's Resource Pool:
- Total RAM: ${context.resourcePool.totalRam} GB
- Used RAM: ${context.resourcePool.usedRam} GB
- Available RAM: ${context.resourcePool.totalRam - context.resourcePool.usedRam} GB

`;
      }

      if (context.servers && context.servers.length > 0) {
        prompt += `User's Servers:\n`;
        context.servers.forEach((server: any) => {
          prompt += `- ${server.name} (${server.type} ${server.version}): ${server.ram} GB RAM, Status: ${server.status}\n`;
        });
        prompt += '\n';
      }
    }

    prompt += `User question: ${message}\n\nAssistant:`;

    // Forward to Ollama
    const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
    }

    const ollamaData = await ollamaResponse.json();

    if (!ollamaData.response) {
      throw new Error('No response from Ollama');
    }

    return NextResponse.json({
      response: ollamaData.response.trim(),
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 500 }
    );
  }
}


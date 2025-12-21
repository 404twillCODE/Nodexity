import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_HOST = 'http://192.168.1.128:11434';
const MODEL = 'llama3.1:8b-instruct-q4_K_M';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, autoFill } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Construct the prompt with exact format
    let prompt = `You are HEXNODE Assistant, a Minecraft server hosting expert.
You help users configure, optimize, and troubleshoot Minecraft servers.
Be concise, technical, and practical.

`;

    // Add context block if provided (pre-formatted string from frontend)
    if (context && typeof context === 'string') {
      prompt += `${context}\n\n`;
    }

    // If auto-fill mode, request strict JSON output
    if (autoFill) {
      const remainingRam = context 
        ? (parseFloat(context.match(/Remaining RAM: ([\d.]+) GB/)?.[1] || '0') || 0)
        : 0;
      prompt += `User request:\n${message}\n\nIMPORTANT: Return ONLY valid JSON. No explanations. 
Format: {"type": "Paper | Fabric | Forge | Proxy", "version": "1.21 | 1.20.4 | 1.19.4", "ram": number}
Rules:
- ram must be between 0.5 and ${remainingRam} GB (remaining pool)
- ram should be rounded to 0.25 GB increments
- minimum ram: 0.5 GB`;
    } else {
      // Append user request
      prompt += `User request:\n${message}`;
    }

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

    const responseText = ollamaData.response.trim();

    // If auto-fill mode, try to extract and parse JSON
    if (autoFill) {
      try {
        // Remove markdown code blocks if present
        let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Try to extract JSON from the response (might have extra text)
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate the parsed JSON has required fields
          if (parsed.type && parsed.version && typeof parsed.ram === 'number') {
            return NextResponse.json({
              response: responseText,
              autoFill: parsed,
            });
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, return the raw response
        console.error('Failed to parse auto-fill JSON:', parseError);
      }
    }

    return NextResponse.json({
      response: responseText,
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 500 }
    );
  }
}


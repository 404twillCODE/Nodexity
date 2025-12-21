import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.1:8b-instruct-q4_K_M';

// AI State Machine States
type AIState = 'CHAT' | 'PROVISION' | 'APPROVAL' | 'HANDOFF';

// Intent detection: Check if message is about provisioning
function isProvisioningIntent(message: string, mode?: string): boolean {
  if (mode === 'provision') return true;
  
  const provisioningPhrases = [
    'make me a server',
    'create a server',
    'set up a server',
    'paper server',
    'fabric server',
    'forge server',
    'vanilla server',
    'proxy',
    'velocity',
    'bungee',
    'minecraft server',
  ];
  
  const lowerMessage = message.toLowerCase();
  return provisioningPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Check if message is an approval
function isApproval(message: string): boolean {
  return /^(y|ye|yes|yep|ok|do it|please do it|apply|sounds good)$/i.test(message.trim());
}

// Check if previous assistant message contains "RECOMMENDED SETUP"
function hasRecommendedSetup(messages: Array<{ role: string; content: string }>): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].content.includes('RECOMMENDED SETUP')) {
      return true;
    }
  }
  return false;
}

// Check if conversation is in HANDOFF state (has "CONFIGURATION READY" message)
function isInHandoffState(messages: Array<{ role: string; content: string }>): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].content.includes('CONFIGURATION READY')) {
      return true;
    }
  }
  return false;
}

// User preferences structure
interface UserPreferences {
  preferredSoftware?: string;
  prefersMultiServer?: boolean;
  typicalLayout?: string;
  ramStyle?: string;
  skillLevel?: 'beginner' | 'advanced';
}

// Extract user preferences from conversation history
function extractPreferences(
  conversationMessages: Array<{ role: string; content: string }>
): UserPreferences {
  const preferences: UserPreferences = {};
  const allText = conversationMessages.map(m => m.content).join(' ').toLowerCase();

  // Extract preferred software from assistant recommendations
  for (const msg of conversationMessages) {
    if (msg.role === 'assistant') {
      // Look for "Software: X" pattern
      const softwareMatch = msg.content.match(/Software:\s*(Paper|Fabric|Forge|Proxy|Velocity|Bungee)/i);
      if (softwareMatch && !preferences.preferredSoftware) {
        const software = softwareMatch[1];
        if (software.toLowerCase() === 'velocity' || software.toLowerCase() === 'bungee') {
          preferences.preferredSoftware = 'Proxy';
        } else {
          preferences.preferredSoftware = software;
        }
      }
    }
    
    // Extract from user messages mentioning software
    if (msg.role === 'user') {
      const userMsg = msg.content.toLowerCase();
      if (userMsg.includes('paper') && !userMsg.includes('fabric') && !userMsg.includes('forge')) {
        preferences.preferredSoftware = 'Paper';
      } else if (userMsg.includes('fabric') && !userMsg.includes('paper') && !userMsg.includes('forge')) {
        preferences.preferredSoftware = 'Fabric';
      } else if (userMsg.includes('forge') && !userMsg.includes('paper') && !userMsg.includes('fabric')) {
        preferences.preferredSoftware = 'Forge';
      }
    }
  }

  // Detect multi-server layout preferences
  const multiServerIndicators = [
    'proxy',
    'world',
    'creative',
    'lobby',
    'hub',
    'multiple servers',
    'network',
  ];
  
  const hasMultiServer = multiServerIndicators.some(indicator => 
    allText.includes(indicator) && 
    (allText.includes('proxy') || allText.includes('world') || allText.includes('creative'))
  );
  
  if (hasMultiServer) {
    preferences.prefersMultiServer = true;
    
    // Extract typical layout pattern
    if (allText.includes('proxy') && allText.includes('world') && allText.includes('creative')) {
      preferences.typicalLayout = 'Proxy + World + Creative';
    } else if (allText.includes('proxy') && allText.includes('world')) {
      preferences.typicalLayout = 'Proxy + World';
    } else if (allText.includes('world') && allText.includes('creative')) {
      preferences.typicalLayout = 'World + Creative';
    }
  }

  // Extract RAM distribution patterns from assistant recommendations
  for (const msg of conversationMessages) {
    if (msg.role === 'assistant' && msg.content.includes('RAM')) {
      const content = msg.content.toLowerCase();
      
      if (content.includes('proxy') && content.includes('1 gb') || content.includes('minimal')) {
        preferences.ramStyle = 'Proxy minimal, World prioritized';
      } else if (content.includes('world') && (content.includes('priority') || content.includes('most'))) {
        preferences.ramStyle = 'World prioritized';
      } else if (content.includes('balanced') || content.includes('even')) {
        preferences.ramStyle = 'Balanced distribution';
      }
    }
  }

  // Infer skill level from user language
  const advancedTerms = [
    'jvm flags',
    'gc settings',
    'heap',
    'optimization',
    'performance tuning',
    'garbage collection',
    'threads',
    'tps',
  ];
  
  const beginnerTerms = [
    'how do i',
    'what is',
    'explain',
    'help me understand',
    'i don\'t know',
    'new to',
  ];
  
  const hasAdvancedTerms = advancedTerms.some(term => allText.includes(term));
  const hasBeginnerTerms = beginnerTerms.some(term => allText.includes(term));
  
  if (hasAdvancedTerms && !hasBeginnerTerms) {
    preferences.skillLevel = 'advanced';
  } else if (hasBeginnerTerms && !hasAdvancedTerms) {
    preferences.skillLevel = 'beginner';
  }

  return preferences;
}

// Format preferences for prompt injection
function formatPreferencesForPrompt(preferences: UserPreferences): string {
  const lines: string[] = [];
  
  if (preferences.preferredSoftware) {
    lines.push(`- Preferred software: ${preferences.preferredSoftware}`);
  }
  
  if (preferences.typicalLayout) {
    lines.push(`- Typical layout: ${preferences.typicalLayout}`);
  }
  
  if (preferences.ramStyle) {
    lines.push(`- RAM style: ${preferences.ramStyle}`);
  }
  
  if (preferences.skillLevel) {
    lines.push(`- Skill level: ${preferences.skillLevel}`);
  }
  
  if (preferences.prefersMultiServer && !preferences.typicalLayout) {
    lines.push(`- Prefers multi-server setups`);
  }
  
  return lines.length > 0 ? lines.join('\n') : '';
}

// Determine current state from conversation history
function determineState(
  message: string,
  conversationMessages: Array<{ role: string; content: string }>,
  mode?: string
): AIState {
  // If already in HANDOFF, stay in HANDOFF
  if (isInHandoffState(conversationMessages)) {
    return 'HANDOFF';
  }

  // Check if we're waiting for approval
  if (isApproval(message) && hasRecommendedSetup(conversationMessages)) {
    return 'APPROVAL';
  }

  // Check if we have a recommended setup (waiting for approval)
  if (hasRecommendedSetup(conversationMessages)) {
    return 'APPROVAL';
  }

  // Check if message is about provisioning
  if (isProvisioningIntent(message, mode)) {
    return 'PROVISION';
  }

  // Default to CHAT
  return 'CHAT';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, autoFill, messages: conversationMessages, mode } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation history (last ~10 messages)
    const recentMessages = Array.isArray(conversationMessages) 
      ? conversationMessages.slice(-10)
      : [];

    // Extract user preferences from conversation history
    const preferences = extractPreferences(recentMessages);
    const preferencesText = formatPreferencesForPrompt(preferences);

    // Determine current state
    const currentState = determineState(message, recentMessages, mode);

    // HANDOFF state: Return exact format, no further processing
    if (currentState === 'HANDOFF') {
      return NextResponse.json({
        response: `CONFIGURATION READY

The server configuration has been finalized and is ready to be applied.

You can now review or create the servers using the prepared configuration.`,
        state: 'HANDOFF',
      });
    }

    // If auto-fill mode, request strict JSON output (keep existing behavior)
    if (autoFill) {
      const remainingRam = context 
        ? (parseFloat(context.match(/Remaining RAM: ([\d.]+) GB/)?.[1] || '0') || 0)
        : 0;
      
      let prompt = `You are HEXNODE Assistant. Return ONLY valid JSON. No explanations.
Format: {"type": "Paper | Fabric | Forge | Proxy", "version": "1.21 | 1.20.4 | 1.19.4", "ram": number}
Rules:
- ram must be between 0.5 and ${remainingRam} GB (remaining pool)
- ram should be rounded to 0.25 GB increments
- minimum ram: 0.5 GB
User request: ${message}`;

      const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
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
      const responseText = ollamaData.response.trim();

      try {
        let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type && parsed.version && typeof parsed.ram === 'number') {
            return NextResponse.json({
              response: responseText,
              autoFill: parsed,
            });
          }
        }
      } catch (parseError) {
        console.error('Failed to parse auto-fill JSON:', parseError);
      }

      return NextResponse.json({
        response: responseText,
      });
    }

    // APPROVAL state: Transition to HANDOFF
    if (currentState === 'APPROVAL' && isApproval(message)) {
      // Extract configuration from previous assistant message
      const lastAssistantMessage = [...recentMessages].reverse().find(m => m.role === 'assistant' && m.content.includes('RECOMMENDED SETUP'));
      
      if (lastAssistantMessage) {
        // Return HANDOFF message - exact format, no questions
        return NextResponse.json({
          response: `CONFIGURATION READY

The server configuration has been finalized and is ready to be applied.

You can now review or create the servers using the prepared configuration.`,
          state: 'HANDOFF',
        });
      }
    }

    // Build prompt based on state
    let prompt = '';
    
    if (currentState === 'PROVISION') {
      // PROVISIONING MODE - Strong system prompt
      const remainingRam = context 
        ? (parseFloat(context.match(/Remaining RAM: ([\d.]+) GB/)?.[1] || '0') || 0)
        : 0;

      prompt = `You are HEXNODE Provisioning Assistant. Design Minecraft server configurations.

Communication style:
- Short, direct sentences.
- No exclamation points or emojis.
- No support-agent language ("happy to help", "let me know", "I'd be glad to").
- State facts with neutral confidence.
- Sound like an experienced engineer, not a chatbot.

Rules:
- Be decisive. Use known preferences as defaults.
- Do not ask questions that preferences already answer.
- If information is missing, assume sensible defaults.
- Output one recommended configuration only.
- Keep reasoning to three bullets maximum.
- Do not contradict previous statements.
- Do not repeat questions already answered.
- You design configurations. Do not claim to configure or set up servers.
- Do not ask for confirmation or approval. Present the configuration.

${preferencesText ? `Known user preferences:\n${preferencesText}\n` : ''}
Defaults (use preferences if available, otherwise these):
- Software: ${preferences.preferredSoftware || 'Paper'}
- Version: latest stable
- Players: 10
- Priority: stable TPS
- Plugin load: light-to-moderate

Required output format:

RECOMMENDED SETUP
- Software:
- Version:
- RAM Allocation:
- Expected Players:
- Notes (max 3 bullets)

Then end with ONE line:
'Reply "yes" to apply this configuration.'

RAM allocation rules:
- RAM allocations must sum exactly to the available pool (${remainingRam} GB remaining).
- Proxy defaults to 1 GB unless overridden.
- World server gets priority RAM.
- Creative gets remaining RAM.
- RAM Allocation is a single number (GB) representing what HEXNODE allocates to the server.
- Do not suggest -Xmx larger than allocated RAM.
- JVM flags must fit inside allocated RAM (e.g., allocate 3 GB → suggest -Xmx3G).
- Default: 3 GB for Paper with ~10 players (unless user specifies heavy mods/plugins).
- Do not change RAM after approval.

Forbidden phrases (never use):
- "Is this configuration acceptable?"
- "Let me know if you'd like to proceed"
- "Next steps"
- "I will configure"
- "I will set up"
- "Please confirm again"
- "Happy to help"
- "I'd be glad to"
- Any exclamation points
- Any emojis

`;
    } else {
      // GENERAL CHAT MODE
      prompt = `You are HEXNODE Assistant. You provide technical guidance on Minecraft server configuration, optimization, and troubleshooting.

Communication style:
- Short, direct sentences.
- No exclamation points or emojis.
- No support-agent language ("happy to help", "let me know", "I'd be glad to").
- State facts with neutral confidence.
- Sound like an experienced engineer, not a chatbot.

Be concise, technical, and practical.
${preferences.skillLevel === 'beginner' ? 'The user appears to be a beginner. Use simpler language and explain technical terms.' : ''}
${preferences.skillLevel === 'advanced' ? 'The user appears to be advanced. Use technical terminology and assume deeper knowledge.' : ''}
${preferencesText ? `\nKnown user preferences:\n${preferencesText}\n` : ''}

`;
    }

    // Add context block if provided
    if (context && typeof context === 'string') {
      prompt += `${context}\n\n`;
    }

    // Build conversation history
    if (recentMessages.length > 0) {
      prompt += `Previous conversation:\n`;
      recentMessages.forEach((msg) => {
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${roleLabel}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    // Append current user request
    prompt += `User request:\n${message}`;

    // Forward to Ollama
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
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

    let responseText = ollamaData.response.trim();

    // Block forbidden phrases in response
    const forbiddenPhrases = [
      'is this configuration acceptable',
      'let me know if you\'d like to proceed',
      'next steps',
      'i will configure',
      'i will set up',
      'please confirm again',
      'happy to help',
      'i\'d be glad to',
      'i\'m happy to',
      'glad to',
    ];

    // Remove forbidden phrases
    forbiddenPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      responseText = responseText.replace(regex, '');
    });

    // Clean up extra whitespace
    responseText = responseText.replace(/\n{3,}/g, '\n\n').trim();

    return NextResponse.json({
      response: responseText,
      state: currentState,
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 500 }
    );
  }
}


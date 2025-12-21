'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useServerContext } from '@/components/context/ServerContext';
import { useAssistantContext } from '@/components/context/AssistantContext';
import { buttonHover, buttonTap } from '@/components/motionVariants';

interface Message {
  id: string;
  text: string;
  isAssistant: boolean;
  isPassive?: boolean;
}

export default function FloatingAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const { servers, resourcePool } = useServerContext();
  const {
    isOpen,
    setIsOpen,
    initialMessage,
    autoFillMode,
    onAutoFillCallback,
    setInitialMessage,
    setAutoFillMode,
    setOnAutoFillCallback,
  } = useAssistantContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hi! I can help you configure, optimize, or troubleshoot your servers.",
      isAssistant: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const [shownSuggestions, setShownSuggestions] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle passive suggestions on page change or context change
  useEffect(() => {
    if (!isOpen || isHandoff || isLoading) return;

    // Wait a bit after page change to show suggestion
    const timer = setTimeout(() => {
      const totalRam = resourcePool.totalRam;
      const usedRam = resourcePool.usedRam;
      const remainingRam = totalRam - usedRam;
      const usagePercent = totalRam > 0 ? (usedRam / totalRam) * 100 : 0;

      // Create a unique key for this context
      const contextKey = `${pathname}-${Math.floor(usagePercent / 10)}-${servers.length}`;

      // Don't show if already shown for this context
      if (shownSuggestions.has(contextKey)) {
        return;
      }

      let suggestion: string | null = null;

      // Create Server page suggestions
      if (pathname?.includes('/servers/create')) {
        if (usagePercent > 80) {
          suggestion = "You're using most of your RAM pool — new servers will be limited.";
        } else if (servers.length > 0 && remainingRam < 2) {
          suggestion = "Remaining RAM is low — consider optimizing existing servers or expanding your pool.";
        } else if (servers.length === 0 && totalRam > 8) {
          suggestion = "You have plenty of RAM available — you can run multiple servers or allocate more to a single server.";
        } else {
          suggestion = "Paper performs best when RAM is not fully saturated — leave some headroom for optimal performance.";
        }
      }
      // Server Detail page suggestions
      else if (pathname?.includes('/servers/') && !pathname?.includes('/create')) {
        const serverId = pathname.split('/').pop();
        const currentServer = servers.find(s => s.id === serverId);
        
        if (currentServer) {
          const serverRamPercent = totalRam > 0 ? (currentServer.ram / totalRam) * 100 : 0;
          
          if (serverRamPercent > 50) {
            suggestion = "This server uses most of your RAM pool — that's fine, but it will limit adding others.";
          } else if (currentServer.ram < 1) {
            suggestion = "Servers with less than 1 GB RAM may experience performance issues with multiple players.";
          } else if (currentServer.type?.toLowerCase().includes('paper') && currentServer.ram < 2) {
            suggestion = "Paper servers benefit from at least 2 GB RAM for stable performance with 10+ players.";
          }
        }
      }
      // Dashboard/Servers list suggestions
      else if (pathname?.includes('/dashboard') || (pathname?.includes('/servers') && !pathname?.includes('/create'))) {
        if (servers.length === 0) {
          suggestion = "Start by creating a Paper server — it's the most popular and well-optimized option.";
        } else if (usagePercent > 70 && servers.length > 1) {
          suggestion = "Your RAM pool is getting full — consider consolidating servers or expanding your pool.";
        } else if (servers.length > 3 && remainingRam < 1) {
          suggestion = "Running many small servers can fragment resources — consider fewer, larger servers.";
        }
      }

      if (suggestion) {
        setShownSuggestions(prev => new Set(prev).add(contextKey));
        
        const suggestionMessage: Message = {
          id: `suggestion-${Date.now()}`,
          text: suggestion,
          isAssistant: true,
          isPassive: true,
        };
        
        setMessages((prev) => [...prev, suggestionMessage]);
      }
    }, 2000); // 2 second delay after page change

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isOpen, resourcePool.totalRam, resourcePool.usedRam, servers, isHandoff, isLoading]);

  // Handle initial message when assistant opens
  useEffect(() => {
    if (isOpen && initialMessage) {
      setInputValue(initialMessage);
      // Auto-send the message after a brief delay
      const messageToSend = initialMessage;
      const isAutoFill = autoFillMode;
      setTimeout(() => {
        sendMessage(messageToSend, isAutoFill);
        setInitialMessage(null);
      }, 100);
    }
  }, [isOpen, initialMessage, autoFillMode]);

  const suggestedActions = [
    'Recommend server setup',
    'How much RAM do I need?',
    'Optimize performance',
    'Why is my server lagging?',
  ];

  const sendMessage = async (messageText: string, isAutoFill = false) => {
    if (!messageText.trim() || isLoading || isHandoff) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      isAssistant: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Generate context string from live dashboard data
      const totalRam = resourcePool.totalRam;
      const usedRam = resourcePool.usedRam;
      const remainingRam = totalRam - usedRam;

      let contextString = `Current HEXNODE infrastructure:
- Total RAM pool: ${totalRam} GB
- Used RAM: ${usedRam} GB
- Remaining RAM: ${remainingRam} GB`;

      // Limit to first 5 servers to keep prompt size reasonable
      const serverList = servers.slice(0, 5);
      if (serverList.length > 0) {
        contextString += `\n- Servers:`;
        serverList.forEach((server) => {
          contextString += `\n  - ${server.name} (${server.type} ${server.version}, ${server.ram} GB, ${server.status})`;
        });
      }

      // Convert messages to API format (role/content), including the new user message
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.isAssistant ? 'assistant' : 'user',
        content: msg.text,
      }));

      // Call API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context: contextString,
          autoFill: isAutoFill || autoFillMode,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      
      // Handle auto-fill response
      if ((isAutoFill || autoFillMode) && data.autoFill && onAutoFillCallback) {
        onAutoFillCallback(data.autoFill);
        setAutoFillMode(false);
        setOnAutoFillCallback(null);
      }

      // Check if we're in HANDOFF state
      if (data.state === 'HANDOFF' || (data.response && data.response.includes('CONFIGURATION READY'))) {
        setIsHandoff(true);
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        text: data.response || 'AI service unavailable',
        isAssistant: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI request error:', error);
      const errorMessage = {
        id: `assistant-${Date.now()}`,
        text: 'AI service unavailable. Please try again later.',
        isAssistant: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        text: "Hi! I can help you configure, optimize, or troubleshoot your servers.",
        isAssistant: true,
      },
    ]);
    setIsHandoff(false);
    setShownSuggestions(new Set());
  };

  const handleSuggestedAction = (action: string) => {
    sendMessage(action);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    sendMessage(message, autoFillMode);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-foreground rounded-full shadow-lg flex items-center justify-center font-semibold z-50"
        whileHover={{ scale: 1.1, boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)' }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        AI
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-6 right-6 w-[360px] h-[480px] bg-background border border-foreground/10 rounded-lg shadow-2xl flex flex-col z-50"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    HEXNODE Assistant
                  </h3>
                  <p className="text-xs text-muted">
                    Server setup & optimization
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={resetChat}
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Reset chat"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.isAssistant ? 'justify-start' : 'justify-end'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.isAssistant
                          ? message.isPassive
                            ? 'bg-foreground/3 border border-foreground/10 text-foreground/80'
                            : 'bg-foreground/5 text-foreground'
                          : 'bg-accent text-foreground'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        message.isPassive ? 'italic' : ''
                      }`}>
                        {message.isPassive && (
                          <span className="text-xs text-muted mr-2">💡</span>
                        )}
                        {message.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="max-w-[80%] p-3 rounded-lg bg-foreground/5 text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Actions */}
              {messages.length === 1 && (
                <motion.div
                  className="px-4 pb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex flex-wrap gap-2">
                    {suggestedActions.map((action) => (
                      <motion.button
                        key={action}
                        onClick={() => handleSuggestedAction(action)}
                        className="px-3 py-1.5 text-xs border border-foreground/20 rounded-full text-foreground hover:border-accent hover:bg-accent/10 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {action}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Input Area */}
              {isHandoff ? (
                <div className="p-4 border-t border-foreground/10 space-y-3">
                  <div className="px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg">
                    <p className="text-xs text-muted mb-2">Configuration locked</p>
                    <p className="text-sm text-foreground">
                      The server configuration has been finalized and is ready to be applied.
                    </p>
                  </div>
                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/dashboard/servers/create');
                    }}
                    className="w-full px-4 py-2 bg-accent text-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                  >
                    Review in Create Server
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="p-4 border-t border-foreground/10">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask anything about your server…"
                      disabled={isLoading || isHandoff}
                      className="flex-1 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <motion.button
                      type="submit"
                      disabled={isLoading || !inputValue.trim() || isHandoff}
                      className={`px-4 py-2 bg-accent text-foreground font-medium rounded-lg transition-colors ${
                        isLoading || !inputValue.trim() || isHandoff
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-accent/90'
                      }`}
                      whileHover={!isLoading && inputValue.trim() && !isHandoff ? buttonHover : {}}
                      whileTap={!isLoading && inputValue.trim() && !isHandoff ? buttonTap : {}}
                    >
                      Send
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


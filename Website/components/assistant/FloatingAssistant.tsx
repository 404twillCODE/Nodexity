'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHover, buttonTap } from '@/components/motionVariants';

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: "Hi! I can help you configure, optimize, or troubleshoot your servers.",
      isAssistant: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const suggestedActions = [
    'Recommend server setup',
    'How much RAM do I need?',
    'Optimize performance',
    'Why is my server lagging?',
  ];

  const handleSuggestedAction = (action: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: action,
        isAssistant: false,
      },
      {
        id: `assistant-${Date.now()}`,
        text: "I'll help you with that. This feature is coming soon!",
        isAssistant: true,
      },
    ]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: inputValue,
        isAssistant: false,
      },
      {
        id: `assistant-${Date.now()}`,
        text: "Thanks for your question! AI assistance is coming soon.",
        isAssistant: true,
      },
    ]);

    setInputValue('');
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
                          ? 'bg-foreground/5 text-foreground'
                          : 'bg-accent text-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
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
              <form onSubmit={handleSend} className="p-4 border-t border-foreground/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything about your server…"
                    className="flex-1 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors text-sm"
                  />
                  <motion.button
                    type="submit"
                    className="px-4 py-2 bg-accent text-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                  >
                    Send
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


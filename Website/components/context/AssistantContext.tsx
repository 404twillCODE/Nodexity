'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AssistantContextType {
  openAssistant: (message?: string, autoFill?: boolean, onAutoFill?: (data: any) => void) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialMessage: string | null;
  autoFillMode: boolean;
  onAutoFillCallback: ((data: any) => void) | null;
  setInitialMessage: (message: string | null) => void;
  setAutoFillMode: (mode: boolean) => void;
  setOnAutoFillCallback: (callback: ((data: any) => void) | null) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [autoFillMode, setAutoFillMode] = useState(false);
  const [onAutoFillCallback, setOnAutoFillCallback] = useState<((data: any) => void) | null>(null);

  const openAssistant = useCallback((message?: string, autoFill?: boolean, onAutoFill?: (data: any) => void) => {
    if (message) {
      setInitialMessage(message);
    }
    if (autoFill) {
      setAutoFillMode(true);
    }
    if (onAutoFill) {
      setOnAutoFillCallback(() => onAutoFill);
    }
    setIsOpen(true);
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        openAssistant,
        isOpen,
        setIsOpen,
        initialMessage,
        autoFillMode,
        onAutoFillCallback,
        setInitialMessage,
        setAutoFillMode,
        setOnAutoFillCallback,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantContext() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistantContext must be used within an AssistantProvider');
  }
  return context;
}


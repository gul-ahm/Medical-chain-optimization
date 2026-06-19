'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  type?: 'text' | 'recommendation' | 'alert';
}

interface CopilotContextType {
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: string | null;
  setInput: (value: string) => void;
  sendMessage: (userMessage: string) => Promise<void>;
  handleQuickAction: (query: string) => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export const CopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setError(null);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let response;
      try {
        // Try the actual FastAPI route first
        response = await fetch('/api/v1/ai/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.trim(),
            context: 'simulation_lab',
            warehouse_id: 'WH-REG-001',
          }),
        });
        if (!response.ok) {
          throw new Error('API v1 offline');
        }
      } catch (err) {
        // Fallback to direct path specified in directive
        response = await fetch('/ai/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.trim(),
            context: 'simulation_lab',
            warehouse_id: 'WH-REG-001',
          }),
        });
      }

      if (!response.ok) {
        throw new Error('AI Orchestrator responded with an error');
      }

      const resData = await response.json();
      const aiResponse = resData.data?.response || resData.response || resData.data || 'No response returned from copilot.';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        type: aiResponse.includes('SKU-') || aiResponse.includes('recommend') ? 'recommendation' : 'text'
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setError('Local Ollama Orchestrator is offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  return (
    <CopilotContext.Provider
      value={{
        messages,
        input,
        isLoading,
        error,
        setInput,
        sendMessage,
        handleQuickAction,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (context === undefined) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
};

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Lightbulb,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AgentMessage, AgentSuggestion } from '../lib/agents/types';
import type { SimpleBlock } from './UnifiedTransactionBuilder';

interface TransactionAgentProps {
  simpleWorkflow?: SimpleBlock[];
  transactionDraft?: any;
  onAddBlock?: (block: SimpleBlock) => void;
  onUpdateBlock?: (blockId: string, params: Record<string, string>) => void;
  errors?: string[];
  warnings?: string[];
}

export function TransactionAgent({
  simpleWorkflow = [],
  transactionDraft,
  onAddBlock,
  onUpdateBlock,
  errors = [],
  warnings = []
}: TransactionAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your Transaction Assistant. I can help you build Solana transactions, suggest optimizations, and explain what each instruction does. What would you like to build?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-suggestions based on context
  useEffect(() => {
    if (simpleWorkflow.length === 0 && messages.length === 1) {
      // Suggest starting when workflow is empty
      const suggestion: AgentMessage = {
        id: 'suggestion-1',
        role: 'assistant',
        content: '💡 Tip: Start by adding a block from the left sidebar. I can help explain what each one does!',
        timestamp: new Date(),
        suggestions: [
          {
            type: 'explain',
            title: 'Show available blocks',
            description: 'I can explain what each block does',
            action: () => {
              addMessage('assistant', 'Here are some common blocks you can use:\n\n• Transfer SOL - Send SOL between accounts\n• Transfer Token - Send SPL tokens\n• Jupiter Swap - Swap tokens via Jupiter\n• Create ATA - Create Associated Token Account\n\nHover over any block to see detailed information!');
            }
          }
        ]
      };
      if (messages.length === 1) {
        setTimeout(() => {
          setMessages(prev => [...prev, suggestion]);
        }, 2000);
      }
    }
  }, [simpleWorkflow.length]);

  const addMessage = (role: 'user' | 'assistant', content: string, suggestions?: AgentSuggestion[]) => {
    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      suggestions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    setIsTyping(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const response = generateResponse(userMessage, simpleWorkflow, errors, warnings);
      addMessage('assistant', response.content, response.suggestions);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestion = (suggestion: AgentSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Agent Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
        title="AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Agent Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600/20 to-indigo-600/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Transaction Assistant</h3>
                <p className="text-xs text-gray-400">AI-powered help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestion(suggestion)}
                          className="w-full text-left p-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <Lightbulb size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-200 group-hover:text-white">
                                {suggestion.title}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {suggestion.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about building transactions..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simple response generator (replace with actual AI API)
function generateResponse(
  userMessage: string,
  workflow: SimpleBlock[],
  errors: string[],
  warnings: string[]
): { content: string; suggestions?: AgentSuggestion[] } {
  const lowerMessage = userMessage.toLowerCase();
  const suggestions: AgentSuggestion[] = [];

  // Context-aware responses
  if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
    return {
      content: `To transfer SOL or tokens, you'll need:\n\n1. **Transfer SOL**: Use the "Transfer SOL" block\n   - Set the recipient address in the "to" field\n   - Set the amount in lamports (1 SOL = 1,000,000,000 lamports)\n\n2. **Transfer Token**: Use the "Transfer Token" block\n   - Set the destination token account\n   - Set the amount to transfer\n\n💡 Tip: You can copy addresses from your clipboard or use the clipboard button in the header!`,
      suggestions: [
        {
          type: 'explain',
          title: 'Explain Transfer SOL',
          description: 'Learn more about transferring SOL',
        },
        {
          type: 'explain',
          title: 'Explain Transfer Token',
          description: 'Learn more about transferring tokens',
        }
      ]
    };
  }

  if (lowerMessage.includes('swap') || lowerMessage.includes('jupiter')) {
    return {
      content: `Jupiter Swap allows you to swap tokens on Solana. Here's what you need:\n\n• **Amount**: The amount of input tokens (in token's smallest unit)\n• **Min Amount Out**: Minimum output tokens (slippage protection)\n\n💡 Make sure you have the token accounts set up first! If you need to create an Associated Token Account, use the "Create ATA" block.`,
    };
  }

  if (lowerMessage.includes('ata') || lowerMessage.includes('token account')) {
    return {
      content: `An Associated Token Account (ATA) is a token account owned by a specific wallet for a specific token mint.\n\nTo create one:\n1. Add the "Create ATA" block\n2. Set the wallet address (usually your wallet)\n3. Set the token mint address\n\n💡 ATAs are deterministic - the same wallet + mint always creates the same ATA address!`,
    };
  }

  if (lowerMessage.includes('error') || errors.length > 0) {
    return {
      content: `I see you have some errors. Let me help:\n\n${errors.map(e => `• ${e}`).join('\n')}\n\nCommon fixes:\n• Check that all addresses are valid Solana addresses\n• Ensure amounts are in the correct units (lamports for SOL)\n• Verify all required fields are filled\n\nWould you like me to suggest specific fixes?`,
      suggestions: errors.map(error => ({
        type: 'fix_error',
        title: `Fix: ${error}`,
        description: 'Get help fixing this error',
      }))
    };
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what can')) {
    return {
      content: `I can help you with:\n\n• 🧱 **Adding blocks** - Explain what each block does and when to use them\n• ⚙️ **Configuring parameters** - Help set up accounts, amounts, and addresses\n• 🐛 **Fixing errors** - Debug transaction issues and validation errors\n• ⚡ **Optimizing** - Reduce costs and improve transaction efficiency\n• 📚 **Explaining** - Understand how Solana transactions work\n• 🔍 **Reviewing** - Check your transaction before building\n\nWhat would you like to do?`,
    };
  }

  if (lowerMessage.includes('lamport') || lowerMessage.includes('sol')) {
    return {
      content: `**SOL vs Lamports:**\n\n• 1 SOL = 1,000,000,000 lamports\n• Lamports are the smallest unit of SOL\n• When entering amounts, use lamports (e.g., 1 SOL = 1000000000)\n\n💡 Quick conversions:\n• 0.1 SOL = 100,000,000 lamports\n• 1 SOL = 1,000,000,000 lamports\n• 10 SOL = 10,000,000,000 lamports`,
    };
  }

  if (workflow.length > 0 && (lowerMessage.includes('review') || lowerMessage.includes('check'))) {
    const blockNames = workflow.map(b => b.name).join(', ');
    return {
      content: `Your transaction currently has ${workflow.length} block(s):\n\n${workflow.map((b, i) => `${i + 1}. ${b.name}`).join('\n')}\n\nLet me review:\n• Check that all required parameters are filled\n• Verify addresses are valid\n• Ensure amounts are correct\n• Review the transaction flow makes sense\n\nWould you like me to check for specific issues?`,
    };
  }

  // Default response
  return {
    content: `I understand you're asking about "${userMessage}". Let me help you with that!\n\nYou currently have ${workflow.length} block(s) in your transaction. I can help you:\n\n• Explain what each block does\n• Add more blocks to your transaction\n• Review for errors and issues\n• Optimize the transaction\n• Answer questions about Solana\n\nWhat would you like to know?`,
    suggestions: workflow.length > 0 ? [
      {
        type: 'explain',
        title: 'Explain current blocks',
        description: 'Get detailed explanations of your blocks',
      },
      {
        type: 'optimize',
        title: 'Review transaction',
        description: 'Check for errors and optimizations',
      }
    ] : [
      {
        type: 'explain',
        title: 'Show available blocks',
        description: 'See what blocks you can add',
      }
    ]
  };
}


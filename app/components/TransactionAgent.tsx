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
  AlertCircle,
  Zap,
  FileText,
  TrendingUp
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
  availableBlocks?: SimpleBlock[];
  onExplainBlock?: (blockId: string) => void;
  onOptimize?: () => void;
}

export function TransactionAgent({
  simpleWorkflow = [],
  transactionDraft,
  onAddBlock,
  onUpdateBlock,
  errors = [],
  warnings = [],
  availableBlocks = [],
  onExplainBlock,
  onOptimize
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

    // Auto-analyze when workflow changes
    if (simpleWorkflow.length > 0 && messages.length > 1) {
      const hasEmptyParams = simpleWorkflow.some(block => 
        Object.values(block.params).some(val => !val || val === '')
      );
      
      if (hasEmptyParams) {
        const analysis: AgentMessage = {
          id: `analysis-${Date.now()}`,
          role: 'assistant',
          content: `🔍 I noticed some blocks have empty parameters. Would you like me to help fill them in?`,
          timestamp: new Date(),
          suggestions: simpleWorkflow
            .filter(block => Object.entries(block.params).some(([key, val]) => !val || val === ''))
            .slice(0, 3)
            .map(block => ({
              type: 'update_param' as const,
              title: `Fill ${block.name} parameters`,
              description: `Help configure ${block.name}`,
              action: () => {
                const emptyParams = Object.entries(block.params)
                  .filter(([_, val]) => !val || val === '')
                  .map(([key]) => key);
                addMessage('assistant', `To configure ${block.name}, you need to fill:\n\n${emptyParams.map(p => `• ${p}`).join('\n')}\n\nWhat values would you like to use?`);
              },
              data: block
            }))
        };
        // Only add if not already shown recently
        const recentAnalysis = messages.filter(m => m.id.startsWith('analysis-'));
        if (recentAnalysis.length === 0) {
          setTimeout(() => {
            setMessages(prev => [...prev, analysis]);
          }, 3000);
        }
      }
    }

    // Auto-detect errors
    if (errors.length > 0) {
      const errorMsg: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ I found ${errors.length} error(s) in your transaction. Let me help fix them!`,
        timestamp: new Date(),
        suggestions: errors.slice(0, 3).map(error => ({
          type: 'fix_error' as const,
          title: `Fix: ${error}`,
          description: 'Get help with this error',
          action: () => {
            addMessage('assistant', `Let's fix: ${error}\n\nCommon solutions:\n• Check address format (should be base58)\n• Verify amounts are in correct units\n• Ensure all required fields are filled\n\nWhat specific help do you need?`);
          }
        }))
      };
      const recentErrors = messages.filter(m => m.id.startsWith('error-'));
      if (recentErrors.length === 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, errorMsg]);
        }, 2000);
      }
    }
  }, [simpleWorkflow.length, errors.length, messages.length]);

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

          {/* Quick Actions */}
          {simpleWorkflow.length > 0 && (
            <div className="px-4 pt-2 border-t border-gray-700">
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => {
                    const analysis = analyzeTransaction(simpleWorkflow);
                    addMessage('assistant', analysis);
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles size={12} />
                  Analyze
                </button>
                {onOptimize && (
                  <button
                    onClick={() => {
                      if (onOptimize) onOptimize();
                      addMessage('assistant', '🔍 Analyzing your transaction for optimizations...\n\nChecking:\n• Transaction size\n• Account usage\n• Compute units\n• Fee optimization\n\nI\'ll provide suggestions shortly!');
                    }}
                    className="px-3 py-1.5 text-xs bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Zap size={12} />
                    Optimize
                  </button>
                )}
                <button
                  onClick={() => {
                    const blocks = simpleWorkflow.map((b, i) => `${i + 1}. ${b.name}${Object.values(b.params).some(v => !v) ? ' (incomplete)' : ''}`).join('\n');
                    addMessage('assistant', `📋 Your Transaction Summary:\n\n${blocks}\n\n${simpleWorkflow.length} block(s) total\n${simpleWorkflow.filter(b => Object.values(b.params).every(v => v)).length} complete\n${simpleWorkflow.filter(b => Object.values(b.params).some(v => !v)).length} need configuration`);
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle size={12} />
                  Summary
                </button>
              </div>
            </div>
          )}

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

  if (lowerMessage.includes('code') || lowerMessage.includes('example') || lowerMessage.includes('snippet')) {
    return {
      content: `Here's a code example for your transaction:\n\n\`\`\`typescript\n// Example: Building a transaction with ${workflow.length} instruction(s)\nconst transaction = new Transaction();\n\n${workflow.map((block, i) => {
        if (block.id === 'system_transfer') {
          return `// Instruction ${i + 1}: Transfer SOL\ntransaction.add(\n  SystemProgram.transfer({\n    fromPubkey: wallet.publicKey,\n    toPubkey: new PublicKey('${block.params.to || 'RECIPIENT_ADDRESS'}'),\n    lamports: ${block.params.amount || '0'}\n  })\n);`;
        }
        return `// Instruction ${i + 1}: ${block.name}\n// Add ${block.name} instruction here`;
      }).join('\n\n')}\n\n// Sign and send\nconst signature = await sendTransaction(transaction, [wallet]);\n\`\`\`\n\nWould you like me to generate the full code for any specific block?`,
    };
  }

  if (lowerMessage.includes('cost') || lowerMessage.includes('fee') || lowerMessage.includes('price')) {
    const estimatedCost = workflow.length * 5000; // Rough estimate: 5000 lamports per instruction
    return {
      content: `💰 Estimated Transaction Cost:\n\n• Base fee: ~5,000 lamports per instruction\n• Your transaction: ${workflow.length} instruction(s)\n• Estimated total: ~${estimatedCost.toLocaleString()} lamports (~${(estimatedCost / 1_000_000_000).toFixed(9)} SOL)\n\n💡 Note: Actual fees may vary based on:\n• Network congestion\n• Compute units used\n• Account rent (if creating accounts)\n• Priority fees\n\nWant me to help optimize costs?`,
      suggestions: [
        {
          type: 'optimize',
          title: 'Optimize transaction costs',
          description: 'Get cost-saving suggestions',
        }
      ]
    };
  }

  if (lowerMessage.includes('validate') || lowerMessage.includes('check') || lowerMessage.includes('verify')) {
    const issues: string[] = [];
    workflow.forEach((block, i) => {
      const emptyParams = Object.entries(block.params).filter(([_, val]) => !val || val === '');
      if (emptyParams.length > 0) {
        issues.push(`Block ${i + 1} (${block.name}): Missing ${emptyParams.map(([key]) => key).join(', ')}`);
      }
    });

    if (issues.length === 0) {
      return {
        content: `✅ Validation Check:\n\nAll blocks appear to be configured correctly!\n\n• ${workflow.length} block(s) configured\n• All required parameters filled\n• No obvious errors detected\n\nReady to build! 🚀`,
      };
    }

    return {
      content: `🔍 Validation Results:\n\nFound ${issues.length} issue(s):\n\n${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}\n\nWould you like me to help fix these?`,
      suggestions: issues.slice(0, 3).map((issue, i) => ({
        type: 'fix_error' as const,
        title: `Fix: ${issue.split(':')[0]}`,
        description: issue.split(':')[1]?.trim() || 'Fix this issue',
      }))
    };
  }

  // Default response
  return {
    content: `I understand you're asking about "${userMessage}". Let me help you with that!\n\nYou currently have ${workflow.length} block(s) in your transaction. I can help you:\n\n• Explain what each block does\n• Add more blocks to your transaction\n• Review for errors and issues\n• Optimize the transaction\n• Generate code examples\n• Estimate costs\n• Validate the transaction\n• Answer questions about Solana\n\nWhat would you like to know?`,
    suggestions: workflow.length > 0 ? [
      {
        type: 'explain',
        title: 'Explain current blocks',
        description: 'Get detailed explanations',
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

// Transaction analysis function
function analyzeTransaction(workflow: SimpleBlock[]): string {
  const analysis: string[] = [];
  
  analysis.push(`📊 Transaction Analysis:\n`);
  analysis.push(`• Total blocks: ${workflow.length}`);
  
  const blockTypes = workflow.reduce((acc, block) => {
    acc[block.name] = (acc[block.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  analysis.push(`• Block types: ${Object.keys(blockTypes).join(', ')}`);
  
  const completeBlocks = workflow.filter(b => Object.values(b.params).every(v => v && v !== ''));
  const incompleteBlocks = workflow.filter(b => Object.values(b.params).some(v => !v || v === ''));
  
  analysis.push(`• Complete: ${completeBlocks.length}`);
  analysis.push(`• Need configuration: ${incompleteBlocks.length}`);
  
  // Check for common patterns
  const hasTransfer = workflow.some(b => b.id === 'system_transfer' || b.id === 'token_transfer');
  const hasSwap = workflow.some(b => b.id === 'jup_swap');
  const hasATA = workflow.some(b => b.id === 'ata_create');
  
  analysis.push(`\n💡 Observations:`);
  if (hasATA && hasTransfer) {
    analysis.push(`• Good flow: Creating ATA before transferring tokens`);
  }
  if (hasSwap && !hasATA) {
    analysis.push(`• Consider: You might need to create token accounts before swapping`);
  }
  if (workflow.length > 5) {
    analysis.push(`• Large transaction: Consider splitting into multiple transactions if possible`);
  }
  
  return analysis.join('\n');
}


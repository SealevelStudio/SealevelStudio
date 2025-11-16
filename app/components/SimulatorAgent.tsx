// AI Agent for Transaction Simulator - Predicts outcomes, optimizes compute, detects failures

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Clock,
  DollarSign,
  Cpu,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { AgentMessage, AgentSuggestion } from '../lib/agents/types';
import { Transaction } from '@solana/web3.js';
import type { SimpleBlock } from './UnifiedTransactionBuilder';

interface SimulatorAgentProps {
  transaction?: Transaction | null;
  workflow?: SimpleBlock[];
  transactionDraft?: any;
  onOptimize?: (optimizations: OptimizationSuggestion[]) => void;
  onFixErrors?: (fixes: ErrorFix[]) => void;
}

interface OptimizationSuggestion {
  type: 'compute' | 'cost' | 'ordering' | 'batching';
  description: string;
  impact: 'low' | 'medium' | 'high';
  action?: () => void;
}

interface ErrorFix {
  error: string;
  fix: string;
  action?: () => void;
}

interface PredictionResult {
  success: boolean;
  confidence: number;
  estimatedComputeUnits: number;
  estimatedCost: number;
  potentialErrors: string[];
  stateChanges: Array<{
    account: string;
    before: any;
    after: any;
  }>;
  warnings: string[];
}

export function SimulatorAgent({
  transaction,
  workflow = [],
  transactionDraft,
  onOptimize,
  onFixErrors
}: SimulatorAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your Transaction Simulator AI. I predict transaction outcomes, detect failures before execution, optimize compute units, and suggest improvements. Ready to analyze your transaction!",
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

  // Auto-analyze when transaction changes
  useEffect(() => {
    if (transaction && messages.length === 1) {
      setTimeout(() => {
        const prediction = predictOutcome(transaction, workflow);
        const analysis = analyzeTransaction(transaction, workflow, prediction);
        addMessage('assistant', analysis.content, analysis.suggestions);
      }, 2000);
    }
  }, [transaction?.signatures.length]);

  // Auto-detect failures
  useEffect(() => {
    if (transaction && isOpen) {
      setTimeout(() => {
        const failures = detectFailures(transaction, workflow);
        if (failures.length > 0) {
          const failureAnalysis = formatFailureAnalysis(failures);
          addMessage('assistant', failureAnalysis.content, failureAnalysis.suggestions);
        }
      }, 1500);
    }
  }, [transaction?.signatures.length]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, suggestions?: AgentSuggestion[]) => {
    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      suggestions
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    setIsTyping(true);

    // Generate AI response
    setTimeout(() => {
      const response = generateResponse(userMessage, transaction, workflow, transactionDraft);
      addMessage('assistant', response.content, response.suggestions);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestion = (suggestion: AgentSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    }
    
    if (suggestion.data) {
      if (suggestion.data.optimizations && onOptimize) {
        onOptimize(suggestion.data.optimizations);
      }
      if (suggestion.data.fixes && onFixErrors) {
        onFixErrors(suggestion.data.fixes);
      }
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
        className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        title="Open Simulator AI Agent"
      >
        {isOpen ? <X size={24} /> : <Cpu size={24} />}
      </button>

      {/* Agent Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-white" />
              <h3 className="text-white font-semibold">Simulator AI Agent</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot size={16} className="mt-1 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User size={16} className="mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestion(suggestion)}
                              className="w-full text-left text-xs bg-gray-700 hover:bg-gray-600 rounded p-2 transition-colors"
                            >
                              <div className="font-semibold">{suggestion.title}</div>
                              <div className="text-gray-400">{suggestion.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot size={16} />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about predictions, optimizations, or errors..."
                className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

// Predict transaction outcome
function predictOutcome(transaction: Transaction, workflow: SimpleBlock[]): PredictionResult {
  const instructionCount = transaction.instructions.length;
  const estimatedCU = estimateComputeUnits(instructionCount, workflow);
  const estimatedCost = estimateCost(transaction, estimatedCU);
  
  const potentialErrors = detectPotentialErrors(transaction, workflow);
  const warnings = detectWarnings(transaction, workflow);
  
  // Calculate confidence based on error count and complexity
  const errorScore = potentialErrors.length * 0.2;
  const complexityScore = instructionCount > 5 ? 0.1 : 0;
  const confidence = Math.max(0, Math.min(100, 100 - (errorScore + complexityScore) * 100));

  return {
    success: potentialErrors.length === 0,
    confidence,
    estimatedComputeUnits: estimatedCU,
    estimatedCost,
    potentialErrors,
    stateChanges: predictStateChanges(transaction, workflow),
    warnings,
  };
}

// Estimate compute units
function estimateComputeUnits(instructionCount: number, workflow: SimpleBlock[]): number {
  // Base compute units per instruction type
  const baseCU = 200000; // Base CU per transaction
  const perInstruction = 100000; // Average CU per instruction
  
  let totalCU = baseCU;
  
  for (const block of workflow) {
    switch (block.id) {
      case 'transfer_sol':
        totalCU += 5000;
        break;
      case 'transfer_token':
        totalCU += 15000;
        break;
      case 'jup_swap':
        totalCU += 50000; // Jupiter swaps are more complex
        break;
      case 'create_ata':
        totalCU += 20000;
        break;
      case 'create_token_and_mint':
        totalCU += 100000; // Token creation is expensive
        break;
      default:
        totalCU += perInstruction;
    }
  }
  
  return totalCU;
}

// Estimate cost
function estimateCost(transaction: Transaction, computeUnits: number): number {
  const baseFee = 5000; // Base transaction fee in lamports
  const cuPrice = 0.000001; // Price per CU (simplified)
  const priorityFee = 0; // Would be calculated from transaction
  
  return (baseFee + (computeUnits * cuPrice) + priorityFee) / 1e9; // Convert to SOL
}

// Detect potential errors
function detectPotentialErrors(transaction: Transaction, workflow: SimpleBlock[]): string[] {
  const errors: string[] = [];
  
  // Check for missing accounts
  if (transaction.instructions.length === 0) {
    errors.push('Transaction has no instructions');
  }
  
  // Check for common issues
  for (const block of workflow) {
    // Check for missing required parameters
    if (block.id === 'transfer_sol' && !block.params.to) {
      errors.push('Transfer SOL: Missing recipient address');
    }
    if (block.id === 'transfer_token' && !block.params.destination) {
      errors.push('Transfer Token: Missing destination address');
    }
    if (block.id === 'jup_swap' && !block.params.amount) {
      errors.push('Jupiter Swap: Missing amount');
    }
  }
  
  // Check for account ordering issues
  if (transaction.instructions.length > 1) {
    // Check if ATA creation comes before token operations
    const ataIndex = workflow.findIndex(b => b.id === 'create_ata');
    const tokenOpIndex = workflow.findIndex(b => 
      b.id === 'transfer_token' || b.id === 'jup_swap'
    );
    
    if (ataIndex !== -1 && tokenOpIndex !== -1 && ataIndex > tokenOpIndex) {
      errors.push('ATA creation should come before token operations');
    }
  }
  
  return errors;
}

// Detect warnings
function detectWarnings(transaction: Transaction, workflow: SimpleBlock[]): string[] {
  const warnings: string[] = [];
  
  // Check for high compute usage
  const estimatedCU = estimateComputeUnits(transaction.instructions.length, workflow);
  if (estimatedCU > 800000) {
    warnings.push('High compute unit usage - transaction may fail if compute limit is exceeded');
  }
  
  // Check for expensive operations
  const expensiveOps = workflow.filter(b => 
    b.id === 'create_token_and_mint' || b.id === 'jup_swap'
  );
  if (expensiveOps.length > 3) {
    warnings.push('Multiple expensive operations - consider batching or optimizing');
  }
  
  // Check for missing slippage protection
  const swaps = workflow.filter(b => b.id === 'jup_swap');
  for (const swap of swaps) {
    if (!swap.params.minAmountOut || parseFloat(swap.params.minAmountOut || '0') === 0) {
      warnings.push('Jupiter Swap: No slippage protection (minAmountOut not set)');
    }
  }
  
  return warnings;
}

// Predict state changes
function predictStateChanges(transaction: Transaction, workflow: SimpleBlock[]): Array<{
  account: string;
  before: any;
  after: any;
}> {
  const changes: Array<{ account: string; before: any; after: any }> = [];
  
  for (const block of workflow) {
    if (block.id === 'transfer_sol') {
      changes.push({
        account: block.params.to || 'unknown',
        before: { balance: 'unknown' },
        after: { balance: `+${block.params.amount || '0'} lamports` },
      });
    }
    if (block.id === 'create_ata') {
      changes.push({
        account: 'new_ata',
        before: { exists: false },
        after: { exists: true, owner: block.params.owner || 'unknown' },
      });
    }
    if (block.id === 'create_token_and_mint') {
      changes.push({
        account: 'new_mint',
        before: { exists: false },
        after: { exists: true, supply: block.params.initialSupply || '0' },
      });
    }
  }
  
  return changes;
}

// Detect failures
function detectFailures(transaction: Transaction, workflow: SimpleBlock[]): ErrorFix[] {
  const failures: ErrorFix[] = [];
  
  const errors = detectPotentialErrors(transaction, workflow);
  
  for (const error of errors) {
    let fix = '';
    let action: (() => void) | undefined;
    
    if (error.includes('Missing recipient')) {
      fix = 'Add a valid recipient address in the "to" field';
    } else if (error.includes('Missing destination')) {
      fix = 'Add a valid destination token account address';
    } else if (error.includes('Missing amount')) {
      fix = 'Specify the amount to swap';
    } else if (error.includes('ATA creation should come before')) {
      fix = 'Reorder instructions: Create ATA before token operations';
    } else {
      fix = 'Review transaction structure and required parameters';
    }
    
    failures.push({ error, fix, action });
  }
  
  return failures;
}

// Analyze transaction
function analyzeTransaction(
  transaction: Transaction,
  workflow: SimpleBlock[],
  prediction: PredictionResult
): { content: string; suggestions?: AgentSuggestion[] } {
  const optimizations = suggestOptimizations(transaction, workflow, prediction);
  
  const content = `🔍 **Transaction Analysis**\n\n` +
    `📊 **Prediction**:\n` +
    `• Success Probability: ${prediction.confidence.toFixed(0)}%\n` +
    `• Estimated Compute Units: ${prediction.estimatedComputeUnits.toLocaleString()}\n` +
    `• Estimated Cost: ${prediction.estimatedCost.toFixed(6)} SOL\n` +
    `• Instructions: ${transaction.instructions.length}\n\n` +
    `${prediction.potentialErrors.length > 0 ? `❌ **Potential Errors**:\n${prediction.potentialErrors.map(e => `• ${e}`).join('\n')}\n\n` : '✅ **No errors detected**\n\n'}` +
    `${prediction.warnings.length > 0 ? `⚠️ **Warnings**:\n${prediction.warnings.map(w => `• ${w}`).join('\n')}\n\n` : ''}` +
    `${optimizations.length > 0 ? `💡 **Optimization Opportunities**:\n${optimizations.map(o => `• ${o.description} (${o.impact} impact)`).join('\n')}\n\n` : ''}` +
    `📈 **State Changes**:\n` +
    `${prediction.stateChanges.length > 0 ? prediction.stateChanges.map(c => `• ${c.account}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`).join('\n') : 'No state changes predicted'}`;

  return {
    content,
    suggestions: [
      ...(optimizations.length > 0 ? [{
        type: 'optimize' as const,
        title: 'Apply Optimizations',
        description: `Apply ${optimizations.length} optimization(s)`,
        data: { optimizations },
      }] : []),
      ...(prediction.potentialErrors.length > 0 ? [{
        type: 'fix_error' as const,
        title: 'Fix Errors',
        description: `Fix ${prediction.potentialErrors.length} error(s)`,
        data: { fixes: detectFailures(transaction, workflow) },
      }] : []),
    ],
  };
}

// Suggest optimizations
function suggestOptimizations(
  transaction: Transaction,
  workflow: SimpleBlock[],
  prediction: PredictionResult
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  
  // Compute optimization
  if (prediction.estimatedComputeUnits > 600000) {
    suggestions.push({
      type: 'compute',
      description: 'Reduce compute units by batching operations or optimizing instruction order',
      impact: 'high',
    });
  }
  
  // Cost optimization
  if (prediction.estimatedCost > 0.001) {
    suggestions.push({
      type: 'cost',
      description: 'Consider reducing priority fees or batching operations to lower costs',
      impact: 'medium',
    });
  }
  
  // Ordering optimization
  const ataIndex = workflow.findIndex(b => b.id === 'create_ata');
  const tokenOpIndex = workflow.findIndex(b => b.id === 'transfer_token' || b.id === 'jup_swap');
  if (ataIndex !== -1 && tokenOpIndex !== -1 && ataIndex > tokenOpIndex) {
    suggestions.push({
      type: 'ordering',
      description: 'Reorder instructions: Create ATA before token operations',
      impact: 'high',
    });
  }
  
  // Batching optimization
  if (workflow.filter(b => b.id === 'transfer_sol').length > 3) {
    suggestions.push({
      type: 'batching',
      description: 'Consider batching multiple transfers into fewer instructions',
      impact: 'medium',
    });
  }
  
  return suggestions;
}

// Format failure analysis
function formatFailureAnalysis(failures: ErrorFix[]): { content: string; suggestions?: AgentSuggestion[] } {
  return {
    content: `❌ **Failure Detection**\n\n` +
      `Found ${failures.length} potential issue(s):\n\n` +
      failures.map((f, i) => `${i + 1}. **${f.error}**\n   Fix: ${f.fix}`).join('\n\n') +
      `\n\nWould you like me to help fix these?`,
    suggestions: failures.map((f, i) => ({
      type: 'fix_error' as const,
      title: `Fix: ${f.error}`,
      description: f.fix,
      data: { fixes: [f] },
    })),
  };
}

// Generate response to user query
function generateResponse(
  userMessage: string,
  transaction: Transaction | null | undefined,
  workflow: SimpleBlock[],
  transactionDraft: any
): { content: string; suggestions?: AgentSuggestion[] } {
  const lowerMessage = userMessage.toLowerCase();

  if (!transaction) {
    return {
      content: 'No transaction available for analysis. Please build a transaction first.',
    };
  }

  if (lowerMessage.includes('predict') || lowerMessage.includes('outcome') || lowerMessage.includes('will it work')) {
    const prediction = predictOutcome(transaction, workflow);
    return {
      content: `🔮 **Outcome Prediction**\n\n` +
        `Success Probability: **${prediction.confidence.toFixed(0)}%**\n\n` +
        `Estimated Compute Units: ${prediction.estimatedComputeUnits.toLocaleString()}\n` +
        `Estimated Cost: ${prediction.estimatedCost.toFixed(6)} SOL\n\n` +
        `${prediction.success ? '✅ Transaction should succeed!' : '⚠️ Transaction may fail - check errors below'}\n\n` +
        `${prediction.potentialErrors.length > 0 ? `**Errors**:\n${prediction.potentialErrors.map(e => `• ${e}`).join('\n')}\n\n` : ''}` +
        `${prediction.warnings.length > 0 ? `**Warnings**:\n${prediction.warnings.map(w => `• ${w}`).join('\n')}` : ''}`,
    };
  }

  if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') || lowerMessage.includes('better')) {
    const prediction = predictOutcome(transaction, workflow);
    const optimizations = suggestOptimizations(transaction, workflow, prediction);
    return {
      content: `⚡ **Optimization Suggestions**\n\n` +
        `${optimizations.length > 0 ? optimizations.map((o, i) => `${i + 1}. **${o.type.toUpperCase()}** (${o.impact} impact)\n   ${o.description}`).join('\n\n') : 'No optimizations needed - transaction is already efficient!'}`,
      suggestions: optimizations.length > 0 ? [{
        type: 'optimize',
        title: 'Apply All Optimizations',
        description: `Apply ${optimizations.length} optimization(s)`,
        data: { optimizations },
      }] : undefined,
    };
  }

  if (lowerMessage.includes('error') || lowerMessage.includes('fail') || lowerMessage.includes('problem')) {
    const failures = detectFailures(transaction, workflow);
    return {
      content: failures.length > 0 
        ? formatFailureAnalysis(failures).content
        : '✅ No errors detected! Your transaction looks good.',
      suggestions: failures.length > 0 ? formatFailureAnalysis(failures).suggestions : undefined,
    };
  }

  if (lowerMessage.includes('compute') || lowerMessage.includes('cu') || lowerMessage.includes('units')) {
    const prediction = predictOutcome(transaction, workflow);
    return {
      content: `💻 **Compute Unit Analysis**\n\n` +
        `Estimated CU: **${prediction.estimatedComputeUnits.toLocaleString()}**\n` +
        `Limit: 1,400,000 CU\n` +
        `Usage: ${((prediction.estimatedComputeUnits / 1400000) * 100).toFixed(1)}%\n\n` +
        `${prediction.estimatedComputeUnits > 800000 ? '⚠️ High compute usage - consider optimizing' : '✅ Compute usage is within safe limits'}`,
    };
  }

  if (lowerMessage.includes('cost') || lowerMessage.includes('fee') || lowerMessage.includes('price')) {
    const prediction = predictOutcome(transaction, workflow);
    return {
      content: `💰 **Cost Analysis**\n\n` +
        `Estimated Cost: **${prediction.estimatedCost.toFixed(6)} SOL**\n` +
        `Breakdown:\n` +
        `• Base Fee: 0.000005 SOL\n` +
        `• Compute Units: ${((prediction.estimatedComputeUnits * 0.000001) / 1e9).toFixed(6)} SOL\n` +
        `• Priority Fee: 0 SOL (if set)\n\n` +
        `${prediction.estimatedCost > 0.001 ? '💡 Consider optimizing to reduce costs' : '✅ Cost is reasonable'}`,
    };
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
    return {
      content: `I can help you with:\n\n` +
        `🔮 **Prediction**: Predict transaction outcomes and success probability\n` +
        `⚡ **Optimization**: Optimize compute units, costs, and instruction ordering\n` +
        `❌ **Error Detection**: Find potential failures before execution\n` +
        `💻 **Compute Analysis**: Analyze compute unit usage\n` +
        `💰 **Cost Estimation**: Estimate transaction costs\n` +
        `📊 **State Changes**: Predict account state mutations\n\n` +
        `Try asking:\n` +
        `• "Will this transaction work?"\n` +
        `• "Optimize this transaction"\n` +
        `• "What errors might occur?"\n` +
        `• "How much compute will this use?"`,
    };
  }

  // Default response
  return {
    content: `I can help analyze your transaction. I found ${transaction.instructions.length} instruction(s). ` +
      `I can predict outcomes, detect errors, optimize compute units, and estimate costs. ` +
      `What would you like to know?`,
  };
}


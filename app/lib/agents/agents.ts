import { Agent } from './types';

// Available agents registry
export const AVAILABLE_AGENTS: Agent[] = [
  {
    id: 'transaction-assistant',
    name: 'Transaction Assistant',
    description: 'Helps you build and optimize Solana transactions',
    icon: '🤖',
    color: 'bg-purple-600',
    enabled: true,
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Reviews transactions for security best practices',
    icon: '🛡️',
    color: 'bg-red-600',
    enabled: false, // Coming soon
  },
  {
    id: 'gas-optimizer',
    name: 'Gas Optimizer',
    description: 'Optimizes transaction costs and efficiency',
    icon: '⚡',
    color: 'bg-yellow-600',
    enabled: false, // Coming soon
  },
  {
    id: 'scanner-agent',
    name: 'Scanner AI Agent',
    description: 'Analyzes arbitrage opportunities, calculates risk/reward, suggests strategies',
    icon: '🔍',
    color: 'bg-teal-600',
    enabled: true,
  },
  {
    id: 'simulator-agent',
    name: 'Simulator AI Agent',
    description: 'Predicts transaction outcomes, optimizes compute units, detects failures',
    icon: '🎭',
    color: 'bg-cyan-600',
    enabled: true,
  },
];

export function getAgentById(id: string): Agent | undefined {
  return AVAILABLE_AGENTS.find(agent => agent.id === id);
}

export function getEnabledAgents(): Agent[] {
  return AVAILABLE_AGENTS.filter(agent => agent.enabled);
}


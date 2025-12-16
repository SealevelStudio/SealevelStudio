'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function AlertMessage({ 
  type, 
  title, 
  message, 
  onDismiss,
  className = '' 
}: AlertMessageProps) {
  const config = {
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      titleColor: 'text-red-400',
      messageColor: 'text-gray-300',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      titleColor: 'text-green-400',
      messageColor: 'text-gray-300',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      titleColor: 'text-yellow-400',
      messageColor: 'text-gray-300',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      titleColor: 'text-blue-400',
      messageColor: 'text-gray-300',
    },
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div className={`mb-6 p-4 ${style.bgColor} border ${style.borderColor} rounded-lg flex items-start gap-3 ${className}`}>
      <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {title && (
          <p className={`${style.titleColor} font-medium mb-1`}>{title}</p>
        )}
        <p className={`text-sm ${style.messageColor} ${title ? 'mt-1' : ''}`}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Dismiss message"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}


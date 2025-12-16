'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true
}: SkeletonProps) {
  const baseClasses = `bg-gray-700/50 ${animated ? 'animate-pulse' : ''}`;
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} rounded`}
            style={{
              width: i === lines - 1 ? '75%' : width || '100%',
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 ${className}`}>
      <Skeleton variant="rectangular" height={24} width="60%" className="mb-4" />
      <Skeleton variant="text" lines={3} className="mb-4" />
      <Skeleton variant="rectangular" height={40} width="40%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={20} width="100%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} variant="rectangular" height={16} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonBalance({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="rectangular" height={16} width="40%" />
        <Skeleton variant="rectangular" height={12} width="60%" />
      </div>
      <Skeleton variant="rectangular" height={32} width={80} />
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="rectangular" height={24} width="200px" />
        <Skeleton variant="rectangular" height={32} width="100px" />
      </div>
      <Skeleton variant="rectangular" height={300} width="100%" className="mb-4" />
      <div className="flex gap-4">
        <Skeleton variant="rectangular" height={16} width="80px" />
        <Skeleton variant="rectangular" height={16} width="80px" />
        <Skeleton variant="rectangular" height={16} width="80px" />
      </div>
    </div>
  );
}


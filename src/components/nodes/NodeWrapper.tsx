'use client';

import { ReactNode } from 'react';
import { Handle, Position, type IsValidConnection } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface NodeWrapperProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  status?: 'idle' | 'running' | 'success' | 'failed';
  error?: string;
  className?: string;
  showSourceHandle?: boolean;
  showTargetHandles?: boolean;
  sourceHandleType?: string;
  targetHandleTypes?: string[];
  selected?: boolean;
}

export function NodeWrapper({
  children,
  title,
  icon,
  status = 'idle',
  error,
  className,
  showSourceHandle = true,
  showTargetHandles = true,
  sourceHandleType = 'text',
  targetHandleTypes = [],
  selected = false,
}: NodeWrapperProps) {
  const statusColors = {
    idle:    'border-gray-700',
    running: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse',
    success: 'border-green-500',
    failed:  'border-red-500',
  };

  const statusBadge = {
    idle: null,
    running: (
      <span className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full animate-ping" />
    ),
    success: (
      <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
        ✓
      </span>
    ),
    failed: (
      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
        ✕
      </span>
    ),
  };

  // Evenly distribute handles across the full node height (5%–95%)
  const getHandleTop = (index: number, total: number): string => {
    if (total === 1) return '50%';
    const pct = 5 + (index / (total - 1)) * 90;
    return `${pct}%`;
  };

  // Only allow a connection if the source handle ID matches the target handle ID exactly
  const makeIsValidConnection = (targetHandleId: string): IsValidConnection =>
    (connection) => connection.sourceHandle === targetHandleId;

  return (
    <div
      className={cn(
        'relative min-w-[200px] bg-gray-900 rounded-lg border-2 transition-all duration-200',
        statusColors[status],
        selected && 'ring-2 ring-purple-500',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-t-md border-b border-gray-700">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="text-sm font-medium text-gray-200">{title}</span>
        {statusBadge[status]}
      </div>

      {/* Content */}
      <div className="p-3">
        {children}
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Target Handles — evenly spaced, each only accepts matching source handle ID */}
      {showTargetHandles && targetHandleTypes.map((type, index) => (
        <Handle
          key={type}
          type="target"
          position={Position.Left}
          id={type}
          isValidConnection={makeIsValidConnection(type)}
          style={{
            top:        getHandleTop(index, targetHandleTypes.length),
            background: '#a855f7',
            width:      12,
            height:     12,
          }}
        />
      ))}

      {/* Source Handle */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id={sourceHandleType}
          style={{
            background: '#a855f7',
            width:      12,
            height:     12,
          }}
        />
      )}
    </div>
  );
}
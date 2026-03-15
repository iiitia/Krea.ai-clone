'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  MousePointer,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NodeRun {
  id: string;
  nodeId: string;
  nodeType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  executionTime?: number;
  error?: string;
}

interface WorkflowRun {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  scope: 'FULL' | 'SINGLE_NODE' | 'SELECTED_NODES';
  duration?: number;
  createdAt: string;
  nodeRuns: NodeRun[];
}

export function RightSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await fetch('/api/runs');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs);
      }
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'FAILED':
        return <XCircle size={16} className="text-red-500" />;
      case 'RUNNING':
        return <Loader2 size={16} className="text-purple-500 animate-spin" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'FULL':
        return <Layers size={14} />;
      case 'SINGLE_NODE':
        return <MousePointer size={14} />;
      case 'SELECTED_NODES':
        return <Play size={14} />;
      default:
        return <Layers size={14} />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`
        flex flex-col bg-gray-900 border-l border-gray-800 transition-all duration-300
        ${isCollapsed ? 'w-12' : 'w-80'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-200">History</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="text-purple-500 animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Clock size={32} className="mb-2" />
              <p className="text-sm">No runs yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                >
                  {/* Run Header */}
                  <button
                    onClick={() =>
                      setExpandedRunId(expandedRunId === run.id ? null : run.id)
                    }
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-750 transition-colors"
                  >
                    {getStatusIcon(run.status)}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-200">
                          {formatDate(run.createdAt)}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          {getScopeIcon(run.scope)}
                          {run.scope.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Duration: {formatDuration(run.duration)}
                      </p>
                    </div>
                    {expandedRunId === run.id ? (
                      <ChevronUp size={14} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {expandedRunId === run.id && run.nodeRuns.length > 0 && (
                    <div className="border-t border-gray-700">
                      {run.nodeRuns.map((nodeRun) => (
                        <div
                          key={nodeRun.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-750"
                        >
                          {getStatusIcon(nodeRun.status)}
                          <div className="flex-1">
                            <p className="text-xs text-gray-300">
                              {nodeRun.nodeType.replace('Node', '')}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {formatDuration(nodeRun.executionTime)}
                            </p>
                          </div>
                          {nodeRun.error && (
                            <span
                              className="text-[10px] text-red-400 truncate max-w-[100px]"
                              title={nodeRun.error}
                            >
                              {nodeRun.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Scissors, Video, Slider } from 'lucide-react';
import { TrimVideoNodeData } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

function TrimVideoNodeComponent({ id, data: nodeData, selected }: NodeProps) {
  const data = nodeData as TrimVideoNodeData;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const runNode = async () => {
    if (!data.videoUrl) {
      updateNodeData(id, { status: 'failed', error: 'No video input' });
      return;
    }

    if (!data.startTime || !data.endTime || parseFloat(data.startTime) >= parseFloat(data.endTime)) {
      updateNodeData(id, { status: 'failed', error: 'Invalid start/end times' });
      return;
    }

    updateNodeData(id, { isTrimming: true, status: 'running' });

    try {
      const response = await fetch('/api/nodes/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: id,
          nodeType: 'trimVideoNode',
          inputs: {
            videoUrl: data.videoUrl,
            startTime: data.startTime,
            endTime: data.endTime,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateNodeData(id, {
          trimmedVideoUrl: result.output.videoUrl,
          isTrimming: false,
          status: 'success',
        });
      } else {
        updateNodeData(id, {
          isTrimming: false,
          status: 'failed',
          error: result.error,
        });
      }
    } catch (error) {
      updateNodeData(id, {
        isTrimming: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Trim failed',
      });
    }
  };

  const formatTime = (seconds: string) => {
    const s = parseFloat(seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <NodeWrapper
      title="Trim Video"
      icon={<Scissors size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle={true}
      showTargetHandles={true}
      sourceHandleType="trimmed_video_url"
      targetHandleTypes={['video_url']}
      selected={selected}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Start Time (s)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={data.startTime}
              onChange={(e) => updateNodeData(id, { startTime: e.target.value })}
              className="flex-1 p-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-400 min-w-[40px]">{formatTime(data.startTime)}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">End Time (s)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={data.endTime}
              onChange={(e) => updateNodeData(id, { endTime: e.target.value })}
              className="flex-1 p-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-400 min-w-[40px]">{formatTime(data.endTime)}</span>
          </div>
        </div>

        {data.trimmedVideoUrl && (
          <video
            src={data.trimmedVideoUrl}
            className="w-full h-24 object-cover rounded border border-gray-700"
            controls
          />
        )}

        <button
          onClick={runNode}
          disabled={data.isTrimming}
          className="w-full py-1.5 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white rounded transition-colors"
        >
          {data.isTrimming ? 'Trimming...' : 'Trim'}
        </button>
      </div>
    </NodeWrapper>
  );
}

export const TrimVideoNode = memo(TrimVideoNodeComponent);


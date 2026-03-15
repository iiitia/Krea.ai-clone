'use client';

import { memo, useEffect } from 'react';
import { NodeProps, useEdges, useNodes } from '@xyflow/react';
import { Film, Clock } from 'lucide-react';
import { ExtractFrameNodeData } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

type ExtractFrameNodeProps = NodeProps & {
  data: ExtractFrameNodeData;
  selected: boolean;
};

function ExtractFrameNodeComponent({ id, data, selected }: ExtractFrameNodeProps) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const nodes = useNodes();
  const edges = useEdges();

  // ── Sync videoUrl from connected video_url handle ──────────────────────
  useEffect(() => {
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'video_url');
    if (!edge) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return;

    const url =
      (sourceNode.data as Record<string, unknown>).videoUrl ??
      (sourceNode.data as Record<string, unknown>).trimmedVideoUrl ??
      null;

    if (typeof url === 'string' && url !== data.videoUrl) {
      updateNodeData(id, { videoUrl: url });
    }
  }, [edges, nodes, id, data.videoUrl, updateNodeData]);

  // ── Run — calls /api/nodes/run ─────────────────────────────────────────
  const runNode = async () => {
    if (!data.videoUrl) {
      updateNodeData(id, { status: 'failed', error: 'No video_url connected' });
      return;
    }

    updateNodeData(id, {
      isRunning: true,
      status: 'running',
      frameImageUrl: undefined,
      error: undefined,
    });

    try {
      const res = await fetch('/api/nodes/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'extractFrameNode',
          inputs: {
            videoUrl:  data.videoUrl,
            timestamp: data.timestamp || '00:00:01',
          },
        }),
      });

      const result = await res.json() as {
        success: boolean;
        output?: { frameImageUrl: string };
        error?: string;
      };

      if (!result.success || !result.output?.frameImageUrl) {
        throw new Error(result.error ?? 'Frame extraction failed');
      }

      updateNodeData(id, {
        frameImageUrl: result.output.frameImageUrl,
        isRunning: false,
        status: 'success',
      });
    } catch (error) {
      updateNodeData(id, {
        isRunning: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Extraction failed',
      });
    }
  };

  return (
    <NodeWrapper
      title="Extract Frame"
      icon={<Film size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle={true}
      showTargetHandles={true}
      sourceHandleType="frame_image_url"
      targetHandleTypes={['video_url']}
      selected={selected}
    >
      <div className="space-y-2">

        {/* Video preview */}
        {data.videoUrl ? (
          <video
            src={data.videoUrl}
            controls
            className="w-full h-20 object-cover rounded"
          />
        ) : (
          <div
            className="flex items-center justify-center rounded bg-gray-800 text-gray-500 text-[10px]"
            style={{ height: 80 }}
          >
            Connect video_url input
          </div>
        )}

        {/* Timestamp input */}
        <div>
          <label className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            Timestamp
          </label>
          <input
            type="text"
            value={data.timestamp ?? ''}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
            placeholder="00:00:01 or 50%"
            className="w-full px-2 py-1 text-xs bg-gray-800 text-gray-200 border border-gray-700 rounded"
          />
        </div>

        {/* Provider badge */}
        <div className="text-[9px] text-gray-600">
          <span className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">
            FFmpeg · Trigger.dev
          </span>
        </div>

        {/* Result frame */}
        {data.frameImageUrl && (
          <div>
            <span className="text-[10px] text-gray-500">Result:</span>
            <img
              src={data.frameImageUrl}
              alt="Extracted frame"
              className="w-full rounded mt-1"
            />
          </div>
        )}

        <button
          onClick={runNode}
          disabled={data.isRunning || !data.videoUrl}
          className="w-full py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          {data.isRunning ? 'Extracting…' : 'Extract Frame via FFmpeg'}
        </button>

      </div>
    </NodeWrapper>
  );
}

export const ExtractFrameNode = memo(ExtractFrameNodeComponent);
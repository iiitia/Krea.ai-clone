'use client';

import { memo, useEffect } from 'react';
import { NodeProps, useEdges, useNodes } from '@xyflow/react';
import { Crop } from 'lucide-react';
import { CropImageNodeData } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

type CropImageNodeProps = NodeProps & {
  data: CropImageNodeData;
  selected: boolean;
};

function resolveHandleValue(
  nodeId: string,
  handleId: string,
  fallback: number,
  nodes: ReturnType<typeof useNodes>,
  edges: ReturnType<typeof useEdges>
): { value: number; connected: boolean } {
  const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handleId);
  if (!edge) return { value: fallback, connected: false };

  const sourceNode = nodes.find((n) => n.id === edge.source);
  if (!sourceNode) return { value: fallback, connected: false };

  const raw =
    (sourceNode.data as Record<string, unknown>).outputValue ??
    (sourceNode.data as Record<string, unknown>).value ??
    (sourceNode.data as Record<string, unknown>).number;

  const parsed = Number(raw);
  return { value: isNaN(parsed) ? fallback : parsed, connected: true };
}

function CropImageNodeComponent({ id, data, selected }: CropImageNodeProps) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const nodes = useNodes();
  const edges = useEdges();

  // Sync imageUrl from connected image_url handle
  useEffect(() => {
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'image_url');
    if (!edge) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return;

    const url =
      (sourceNode.data as Record<string, unknown>).imageUrl ??
      (sourceNode.data as Record<string, unknown>).croppedImageUrl ??
      (sourceNode.data as Record<string, unknown>).generatedImageUrl ??
      (sourceNode.data as Record<string, unknown>).frameImageUrl ??
      null;

    if (typeof url === 'string' && url !== data.imageUrl) {
      updateNodeData(id, { imageUrl: url });
    }
  }, [edges, nodes, id, data.imageUrl, updateNodeData]);

  const { value: x, connected: xConn } = resolveHandleValue(id, 'x_percent',      data.xPercent      ?? 0,   nodes, edges);
  const { value: y, connected: yConn } = resolveHandleValue(id, 'y_percent',      data.yPercent      ?? 0,   nodes, edges);
  const { value: w, connected: wConn } = resolveHandleValue(id, 'width_percent',  data.widthPercent  ?? 100, nodes, edges);
  const { value: h, connected: hConn } = resolveHandleValue(id, 'height_percent', data.heightPercent ?? 100, nodes, edges);

  const maxW = 100 - x;
  const maxH = 100 - y;

  const handleChange = (key: string, raw: number) => {
    const updates: Partial<CropImageNodeData> = { [key]: raw };
    if (key === 'xPercent') {
      const newMax = 100 - raw;
      if ((data.widthPercent ?? 100) > newMax) updates.widthPercent = newMax;
    }
    if (key === 'yPercent') {
      const newMax = 100 - raw;
      if ((data.heightPercent ?? 100) > newMax) updates.heightPercent = newMax;
    }
    if (key === 'widthPercent')  updates.widthPercent  = Math.min(raw, maxW);
    if (key === 'heightPercent') updates.heightPercent = Math.min(raw, maxH);
    updateNodeData(id, updates);
  };

  const runNode = async () => {
    if (!data.imageUrl) {
      updateNodeData(id, { status: 'failed', error: 'No image_url connected' });
      return;
    }

    updateNodeData(id, {
      isRunning: true,
      status: 'running',
      croppedImageUrl: undefined,
      error: undefined,
    });

    try {
      const res = await fetch('/api/nodes/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'cropImageNode',
          inputs: {
            imageUrl:      data.imageUrl,
            xPercent:      Math.max(0,  Math.min(99,   x)),
            yPercent:      Math.max(0,  Math.min(99,   y)),
            widthPercent:  Math.max(1,  Math.min(maxW, w)),
            heightPercent: Math.max(1,  Math.min(maxH, h)),
          },
        }),
      });

      const result = await res.json() as {
        success: boolean;
        output?: { croppedImageUrl: string };
        error?: string;
      };

      console.log('CROP RESULT:', result);

      if (!result.success || !result.output?.croppedImageUrl) {
        throw new Error(result.error ?? 'Crop failed — no output URL returned');
      }

      updateNodeData(id, {
        croppedImageUrl: result.output.croppedImageUrl,
        isRunning: false,
        status: 'success',
      });

    } catch (error) {
      updateNodeData(id, {
        isRunning: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Crop failed',
      });
    }
  };

  const fields = [
    { label: 'X %', key: 'xPercent',      value: x, min: 0, max: 99,   connected: xConn },
    { label: 'Y %', key: 'yPercent',      value: y, min: 0, max: 99,   connected: yConn },
    { label: 'W %', key: 'widthPercent',  value: w, min: 1, max: maxW, connected: wConn },
    { label: 'H %', key: 'heightPercent', value: h, min: 1, max: maxH, connected: hConn },
  ] as const;

  return (
    <NodeWrapper
      title="Crop Image"
      icon={<Crop size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle={true}
      showTargetHandles={true}
      sourceHandleType="cropped_image_url"
      targetHandleTypes={['x_percent', 'y_percent', 'image_url', 'width_percent', 'height_percent']}
      selected={selected}
    >
      <div className="space-y-2">

        {/* Source preview with crop overlay */}
        {data.imageUrl ? (
          <div className="relative rounded overflow-hidden" style={{ height: 80 }}>
            <img
              src={data.imageUrl}
              alt="Source"
              className="w-full h-full"
              style={{ objectFit: 'fill' }}
            />
            <div
              className="border-2 border-purple-500 bg-purple-500/20 absolute pointer-events-none"
              style={{
                left:   `${x}%`,
                top:    `${y}%`,
                width:  `${Math.min(w, maxW)}%`,
                height: `${Math.min(h, maxH)}%`,
              }}
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded bg-gray-800 text-gray-500 text-[10px]"
            style={{ height: 80 }}
          >
            Connect image_url input
          </div>
        )}

        {/* Crop controls */}
        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ label, key, value, min, max, connected }) => (
            <div key={key}>
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                {label}
                {key === 'widthPercent'  && <span className="text-gray-600">(max {maxW})</span>}
                {key === 'heightPercent' && <span className="text-gray-600">(max {maxH})</span>}
                {connected && <span className="ml-auto text-purple-400 text-[9px]">⚡ linked</span>}
              </label>
              <input
                type="number"
                min={min}
                max={max}
                step={1}
                value={value}
                disabled={connected}
                onChange={(e) =>
                  handleChange(key, Math.min(max, Math.max(min, Number(e.target.value))))
                }
                onWheel={(e) => e.currentTarget.blur()}
                className={`w-full px-1 py-0.5 text-xs border rounded ${
                  connected
                    ? 'bg-gray-900 text-purple-300 border-purple-800 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-200 border-gray-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Provider badge */}
        <div className="text-[9px] text-gray-600">
          <span className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">
            FFmpeg · Trigger.dev
          </span>
        </div>

        {/* Cropped result */}
        {data.croppedImageUrl && (
          <div className="mt-2">
            <span className="text-[10px] text-gray-500">Result:</span>
            <img
              src={data.croppedImageUrl}
              alt="Cropped"
              className="w-full rounded mt-1"
            />
          </div>
        )}

        <button
          onClick={runNode}
          disabled={data.isRunning || !data.imageUrl}
          className="w-full py-1 px-2 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          {data.isRunning ? 'Running…' : 'Crop via FFmpeg'}
        </button>

      </div>
    </NodeWrapper>
  );
}

export const CropImageNode = memo(CropImageNodeComponent);
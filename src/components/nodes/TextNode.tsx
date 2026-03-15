'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import { TextNodeData } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

function TextNodeComponent({ id, data, selected }: NodeProps<TextNodeData>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  return (
    <NodeWrapper
      title="Text"
      icon={<Type size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle={true}
      showTargetHandles={false}
      sourceHandleType="text"
      selected={selected}
    >
      <textarea
        value={data.text}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
        placeholder="Enter text..."
        className="w-full h-24 px-2 py-1 text-sm bg-gray-800 text-gray-200 border border-gray-700 rounded resize-none focus:outline-none focus:border-purple-500"
      />
    </NodeWrapper>
  );
}

export const TextNode = memo(TextNodeComponent);

'use client';

import { memo, useEffect } from 'react';
import { NodeProps, useNodes, useEdges } from '@xyflow/react';
import { ImageIcon } from 'lucide-react';
import { ImageGenNodeData } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

function ImageGenNodeComponent({ id, data, selected }: NodeProps<ImageGenNodeData>) {

  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const nodes = useNodes();
  const edges = useEdges();

  /* ---------- Auto-read prompt from connected nodes ---------- */

  useEffect(() => {

    const connectedEdges = edges.filter((edge) => edge.target === id);

    connectedEdges.forEach((edge) => {

      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return;

      // Prompt from Text node
      if (sourceNode.data.type === 'textNode') {
        updateNodeData(id, {
          prompt: (sourceNode.data as any).text
        });
      }

      // Prompt from LLM node
      if (sourceNode.data.type === 'llmNode') {
        updateNodeData(id, {
          prompt: (sourceNode.data as any).response
        });
      }

    });

  }, [edges, nodes, id, updateNodeData]);

  /* ---------- Run Image Generation ---------- */

  const runNode = async () => {

    const prompt = data.prompt || '';

    if (!prompt.trim()) {
      updateNodeData(id, {
        status: 'failed',
        error: 'No prompt provided',
      });
      return;
    }

    updateNodeData(id, {
      isGenerating: true,
      status: 'running',
      error: undefined,
    });

    try {

      const response = await fetch('/api/nodes/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: id,
          nodeType: 'imageGenNode',
          inputs: {
            prompt: prompt,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {

        updateNodeData(id, {
          generatedImageUrl: result.output.generatedImageUrl,
          isGenerating: false,
          status: 'success',
        });

      } else {

        updateNodeData(id, {
          isGenerating: false,
          status: 'failed',
          error: result.error || 'Image generation failed',
        });

      }

    } catch (error) {

      updateNodeData(id, {
        isGenerating: false,
        status: 'failed',
        error:
          error instanceof Error
            ? error.message
            : 'Image generation failed',
      });

    }

  };

  return (
    <NodeWrapper
      title="Image Gen"
      icon={<ImageIcon size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle={true}
      showTargetHandles={true}
      sourceHandleType="image_url"
      targetHandleTypes={['prompt']}
      selected={selected}
    >
      <div className="space-y-2">

        {/* Prompt input */}
        <textarea
          placeholder="Describe the image"
          value={data.prompt || ''}
          onChange={(e) =>
            updateNodeData(id, { prompt: e.target.value })
          }
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-xs resize-vertical min-h-[60px] text-white"
        />

        {/* Generated Image */}
        {data.generatedImageUrl && (
          <img
            src={data.generatedImageUrl}
            alt="Generated"
            className="w-full h-32 object-cover rounded border border-gray-700"
          />
        )}

        {/* Generate Button */}
        <button
          onClick={runNode}
          disabled={data.isGenerating}
          className="w-full py-1 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded"
        >
          {data.isGenerating ? 'Generating...' : 'Generate'}
        </button>

      </div>
    </NodeWrapper>
  );
}

export const ImageGenNode = memo(ImageGenNodeComponent);
'use client';

import { memo, useEffect } from 'react';
import { NodeProps, useEdges, useNodes } from '@xyflow/react';
import { Bot, Image } from 'lucide-react';

import type {
  LLMNode as LLMNodeType,
  LLMNodeData
} from '@/types';

import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

type Props = NodeProps<LLMNodeType>;

// Models that generate images instead of text
const IMAGE_MODELS = ['image-gen'];

function LLMNodeComponent({ id, data, selected }: Props) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const nodes = useNodes();
  const edges = useEdges();

  const isImageModel = IMAGE_MODELS.includes(data.model || '');

  /* ---------------- AUTO CONNECT INPUTS ---------------- */

  useEffect(() => {
    const connectedEdges = edges.filter((edge) => edge.target === id);

    const newData: Partial<LLMNodeData> = {};
    const connectedImages: string[] = [];

    connectedEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return;

      const handle = edge.targetHandle;

      switch (handle) {
        case 'system_prompt':
          if (sourceNode.data.type === 'textNode') {
            newData.systemPrompt = (sourceNode.data as any).text;
          }
          break;

        case 'user_message':
          if (sourceNode.data.type === 'textNode') {
            newData.userMessage = (sourceNode.data as any).text;
          }
          break;

        case 'image_input':
          if (sourceNode.data.type === 'uploadImageNode') {
            const url = (sourceNode.data as any).imageUrl;
            if (url) connectedImages.push(url);
          }
          if (sourceNode.data.type === 'cropImageNode') {
            const url = (sourceNode.data as any).croppedImageUrl;
            if (url) connectedImages.push(url);
          }
          if (sourceNode.data.type === 'extractFrameNode') {
            const url = (sourceNode.data as any).frameImageUrl;
            if (url) connectedImages.push(url);
          }
          break;
      }
    });

    if (connectedImages.length > 0) {
      newData.images = connectedImages;
    }

    if (Object.keys(newData).length > 0) {
      updateNodeData(id, newData);
    }
  }, [edges, nodes, id, updateNodeData]);

  /* ---------------- RUN NODE ---------------- */

  const runNode = async () => {

    if (!data.userMessage && (!data.images || data.images.length === 0)) {
      updateNodeData(id, {
        status: 'failed',
        error: 'No user message or images provided'
      });
      return;
    }

    updateNodeData(id, { isRunning: true, status: 'running', response: undefined, generatedImageUrl: undefined });

    try {

      // ── Image generation path ──────────────────────────────────────────
      if (isImageModel) {
        const response = await fetch('/api/nodes/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: id,
            nodeType: 'imageGenNode',           // ← hits the imageGenNode handler
            inputs: {
              prompt: data.userMessage || data.systemPrompt || '',
            }
          })
        });

        const result = await response.json() as {
          success: boolean;
          output?: { generatedImageUrl?: string };
          error?: string;
        };

        console.log('Image gen result:', result);

        if (result.success && result.output?.generatedImageUrl) {
          updateNodeData(id, {
            generatedImageUrl: result.output.generatedImageUrl,
            isRunning: false,
            status: 'success',
          });
        } else {
          updateNodeData(id, {
            isRunning: false,
            status: 'failed',
            error: result.error || 'Image generation failed',
          });
        }

        return;
      }

      // ── Text / vision LLM path ─────────────────────────────────────────
      const response = await fetch('/api/nodes/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: id,
          nodeType: 'llmNode',
          inputs: {
            systemPrompt: data.systemPrompt,
            userMessage: data.userMessage,
            images: data.images || [],
            model: data.model || 'gpt-4o'
          }
        })
      });

      const result = await response.json() as {
        success: boolean;
        output?: { text?: string; content?: string };
        text?: string;
        error?: string;
      };

      console.log('LLM API RESULT:', result);

      if (result.success) {
        const text =
          result.output?.text ||
          result.output?.content ||
          result.text ||
          JSON.stringify(result.output);

        updateNodeData(id, {
          response: text,
          isRunning: false,
          status: 'success'
        });
      } else {
        updateNodeData(id, {
          isRunning: false,
          status: 'failed',
          error: result.error || 'LLM execution failed'
        });
      }

    } catch (error) {
      updateNodeData(id, {
        isRunning: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Execution failed'
      });
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <NodeWrapper
      title="LLM"
      icon={<Bot size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle={true}
      showTargetHandles={true}
      sourceHandleType="text"
      targetHandleTypes={['system_prompt', 'user_message', 'image_input']}
      selected={selected}
    >
      <div className="space-y-2">

        {/* System Prompt */}
        {data.systemPrompt && (
          <div className="text-xs">
            <span className="text-gray-500">System:</span>
            <p className="text-gray-400 truncate">{data.systemPrompt}</p>
          </div>
        )}

        {/* User Message */}
        {data.userMessage && (
          <div className="text-xs">
            <span className="text-gray-500">User:</span>
            <p className="text-gray-400 truncate">{data.userMessage}</p>
          </div>
        )}

        {/* Images */}
        {Array.isArray(data.images) && (data.images as string[]).length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Image size={12} />
            <span>{(data.images as string[]).length} image(s)</span>
          </div>
        )}

        {/* Model Selector */}
        <div className="pt-1">
          <label className="text-[10px] text-gray-500 block mb-1">Model</label>
          <select
            value={data.model || 'gpt-4o'}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
            className="w-full px-2 py-1 text-xs bg-gray-800 text-gray-200 border border-gray-700 rounded focus:outline-none focus:border-purple-500"
          >
            <optgroup label="Text / Vision">
              <option value="gpt-4o">GPT-4o (Vision)</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4-vision-preview">GPT-4 Vision</option>
            </optgroup>
            <optgroup label="Image Generation">
              <option value="image-gen">🎨 Generate Image</option>
            </optgroup>
          </select>
        </div>

        {/* Text Output */}
        {data.response && (
          <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
            <p className="text-xs text-gray-300 max-h-32 overflow-y-auto">
              {data.response}
            </p>
          </div>
        )}

        {/* ── Generated Image Output ── */}
        {data.generatedImageUrl && (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] text-gray-500">Generated Image:</span>
            <img
              src={data.generatedImageUrl as string}
              alt="Generated"
              className="w-full rounded border border-gray-700 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <a
              href={data.generatedImageUrl as string}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[10px] text-purple-400 hover:underline truncate"
            >
              Open full size ↗
            </a>
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={runNode}
          disabled={data.isRunning}
          className="w-full py-1 px-2 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded transition-colors"
        >
          {data.isRunning
            ? (isImageModel ? 'Generating...' : 'Running...')
            : (isImageModel ? '🎨 Generate Image' : 'Run')}
        </button>

      </div>
    </NodeWrapper>
  );
}

export const LLMNode = memo(LLMNodeComponent);
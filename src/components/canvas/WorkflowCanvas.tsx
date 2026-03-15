'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type NodeTypes,
  type OnSelectionChangeParams,
  type IsValidConnection,
  SelectionMode,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { Play, Redo, Undo, Maximize, Trash2 } from 'lucide-react';

import { nodeTypes as rawNodeTypes } from '@/components/nodes';
import { useWorkflowStore } from '@/lib/store/workflowStore';
import { isValidConnection as checkConnection } from '@/lib/utils/validation';
import { createExecutionPlan } from '@/lib/utils/dag';

/* ---------- Fix nodeTypes typing ---------- */

const nodeTypes: NodeTypes = rawNodeTypes as unknown as NodeTypes;

/* ─────────────────────────────────────────────────────────────────────────── */

function CanvasContent() {

  const {
    nodes,
    edges,
    isExecuting,
    selectedNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodes,
    setSelectedEdges,
    undo,
    redo,
    deleteSelectedNodes,
    setIsExecuting,
    setNodeStatus,
    updateNodeData,
  } = useWorkflowStore();

  const { fitView } = useReactFlow();

  /* ---------- Keyboard shortcuts ---------- */

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts while typing inside inputs / textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [undo, redo, deleteSelectedNodes]);

  /* ---------- Edge styling ---------- */

  const edgeOptions = useMemo(() => ({
    style: {
      stroke: '#a855f7',
      strokeWidth: 2,
    },
    type: 'smoothstep' as const,   // Fix: was inferred as string, needs literal
    animated: true,
  }), []);

  /* ---------- Connection validation ---------- */

  const validateConnection: IsValidConnection = useCallback(
    (connection) => {

      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      return checkConnection(
        connection.sourceHandle ?? '',
        connection.targetHandle ?? '',
        sourceNode.type ?? '',
        targetNode.type ?? ''
      );
    },
    [nodes]
  );

  /* ---------- Handle connect ---------- */

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (validateConnection(connection)) {
        onConnect(connection);
      }
    },
    [validateConnection, onConnect]
  );

  /* ---------- Selection ---------- */

  // Fix: use the proper ReactFlow type instead of `any`
  const handleSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) => {
      setSelectedNodes(nodes.map(n => n.id));
      setSelectedEdges(edges.map(e => e.id));
    },
    [setSelectedNodes, setSelectedEdges]
  );

  /* ---------- Run workflow ---------- */

  const runWorkflow = async () => {

    if (isExecuting || nodes.length === 0) return;

    setIsExecuting(true);

    try {

      const plan = createExecutionPlan(nodes, edges);

      for (const phase of plan.phases) {

        await Promise.all(
          phase.map(async (nodeId: string) => {

            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            setNodeStatus(nodeId, 'running');

            try {

              const response = await fetch('/api/nodes/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  nodeId,
                  nodeType: node.type,
                  inputs: node.data,
                }),
              });

              const result = await response.json() as { success: boolean; output?: Record<string, unknown>; error?: string };

              if (result.success) {
                if (result.output) {
                  updateNodeData(nodeId, result.output);
                }
                setNodeStatus(nodeId, 'success');
              } else {
                setNodeStatus(nodeId, 'failed', result.error);
              }

            } catch (error) {

              setNodeStatus(
                nodeId,
                'failed',
                error instanceof Error ? error.message : 'Execution failed'
              );

            }

          })
        );

      }

    } finally {
      setIsExecuting(false);
    }

  };

  /* ---------- UI ---------- */

  return (

    <div className="w-full h-full">

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={validateConnection}
        onSelectionChange={handleSelectionChange}
        defaultEdgeOptions={edgeOptions}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Control"
        deleteKeyCode={null}          // Fix: set null, handle deletion manually above
        attributionPosition="bottom-left"
        fitView
      >

        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="#374151"
        />

        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-gray-900 border border-gray-700 rounded-lg"
          maskColor="rgba(0,0,0,0.7)"
        />

        <Controls className="bg-gray-900 border border-gray-700" />

        {/* Run Button */}
        <Panel position="top-center">
          <button
            onClick={runWorkflow}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-opacity"
          >
            <Play size={16} />
            {isExecuting ? 'Running…' : 'Run Workflow'}
          </button>
        </Panel>

        {/* Action Buttons */}
        <Panel position="top-right" className="flex flex-col gap-2">

          <button
            onClick={undo}
            className="p-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Undo (⌘Z)"
          >
            <Undo size={18} />
          </button>

          <button
            onClick={redo}
            className="p-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Redo (⌘⇧Z)"
          >
            <Redo size={18} />
          </button>

          <button
            onClick={() => fitView({ duration: 400 })}
            className="p-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Fit view"
          >
            <Maximize size={18} />
          </button>

          {selectedNodes.length > 0 && (
            <button
              onClick={deleteSelectedNodes}
              className="p-1.5 bg-gray-900 border border-red-700 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              title="Delete selected"
            >
              <Trash2 size={18} />
            </button>
          )}

        </Panel>

      </ReactFlow>

    </div>

  );

}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <div className="w-full h-screen">
        <CanvasContent />
      </div>
    </ReactFlowProvider>
  );
}
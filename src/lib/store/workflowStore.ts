import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Viewport
} from '@xyflow/react';
import type { 
  CustomNode, 
  CustomEdge, 
  CustomNodeData,
  TextNodeData,
  UploadImageNodeData,
  UploadVideoNodeData,
  LLMNodeData,
  CropImageNodeData,
  ExtractFrameNodeData,
  ImageGenNodeData,
  TrimVideoNodeData,
  NodeDataType
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface HistoryState {
  nodes: CustomNode[];
  edges: CustomEdge[];
}

interface WorkflowState {
  // Workflow data
  workflowId: string | null;
  workflowName: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  viewport: Viewport;
  
  // Selection
  selectedNodes: string[];
  selectedEdges: string[];
  
  // Execution state
  isExecuting: boolean;
  executingNodeId: string | null;
  
  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  
  // Actions
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: CustomEdge[]) => void;
  setViewport: (viewport: Viewport) => void;
  
  // Node operations
  addNode: (type: NodeDataType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<CustomNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedNodes: () => void;
  
  // Edge operations
  onConnect: (connection: Connection) => void;
  onNodesChange: (changes: NodeChange<CustomNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<CustomEdge>[]) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Selection
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  
  // Execution
  setIsExecuting: (isExecuting: boolean) => void;
  setExecutingNodeId: (nodeId: string | null) => void;
  setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'failed', error?: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Persistence
  loadWorkflow: (workflow: { nodes: CustomNode[]; edges: CustomEdge[]; viewport: Viewport; name: string; id: string }) => void;
  clearWorkflow: () => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
}

const createDefaultNodeData = (type: NodeDataType): CustomNodeData => {
  const baseData = { status: 'idle' as const };
  
  switch (type) {
    case 'textNode':
      return {
        ...baseData,
        label: 'Text',
        type: 'textNode',
        text: '',
      } as TextNodeData;
      
    case 'uploadImageNode':
      return {
        ...baseData,
        label: 'Upload Image',
        type: 'uploadImageNode',
        imageUrl: null,
        isUploading: false,
      } as UploadImageNodeData;
      
    case 'uploadVideoNode':
      return {
        ...baseData,
        label: 'Upload Video',
        type: 'uploadVideoNode',
        videoUrl: null,
        isUploading: false,
      } as UploadVideoNodeData;
      
    case 'llmNode':
      return {
        ...baseData,
        label: 'LLM',
        type: 'llmNode',
        systemPrompt: '',
        userMessage: '',
        images: [],
        response: null,
        isRunning: false,
      } as LLMNodeData;
      
    case 'cropImageNode':
      return {
        ...baseData,
        label: 'Crop Image',
        type: 'cropImageNode',
        imageUrl: null,
        xPercent: 0,
        yPercent: 0,
        widthPercent: 100,
        heightPercent: 100,
        croppedImageUrl: null,
        isRunning: false,
      } as CropImageNodeData;
      
    case 'extractFrameNode':
      return {
        ...baseData,
        label: 'Extract Frame',
        type: 'extractFrameNode',
        videoUrl: null,
        timestamp: '0',
        frameImageUrl: null,
        isRunning: false,
      } as ExtractFrameNodeData;
      
    case 'imageGenNode':
      return {
        ...baseData,
        label: 'Image Gen',
        type: 'imageGenNode',
        prompt: '',
        generatedImageUrl: null,
        isGenerating: false,
      } as ImageGenNodeData;
      
    case 'trimVideoNode':
      return {
        ...baseData,
        label: 'Trim Video',
        type: 'trimVideoNode',
        videoUrl: null,
        startTime: '0',
        endTime: '10',
        trimmedVideoUrl: null,
        isTrimming: false,
      } as TrimVideoNodeData;
      
    default:
      return {
        ...baseData,
        label: 'Unknown',
        type: 'textNode',
        text: '',
      } as TextNodeData;
  }
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  workflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodes: [],
  selectedEdges: [],
  isExecuting: false,
  executingNodeId: null,
  history: [],
  historyIndex: -1,
  
  // Setters
  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setViewport: (viewport) => set({ viewport }),
  
  // Add node
  addNode: (type, position) => {
    const id = uuidv4();
    const data = createDefaultNodeData(type);
    
    const newNode: CustomNode = {
      id,
      type,
      position,
      data,
    };
    
    set((state) => {
      const newNodes = [...state.nodes, newNode];
      return { 
        nodes: newNodes,
        history: [...state.history.slice(0, state.historyIndex + 1), { nodes: newNodes, edges: state.edges }],
        historyIndex: state.historyIndex + 1,
      };
    });
  },
  
  // Update node data
  updateNodeData: (nodeId, data) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;

        const newData = { ...node.data, ...data };

        // Prevent unnecessary updates
        if (JSON.stringify(node.data) === JSON.stringify(newData)) {
          return node;
        }

        return {
          ...node,
          data: newData,
        };
      });

      return { nodes: updatedNodes };
    });
  },
  
  // Delete node
  deleteNode: (nodeId) => {
    set((state) => {
      const newNodes = state.nodes.filter((node) => node.id !== nodeId);
      const newEdges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      return {
        nodes: newNodes,
        edges: newEdges,
        history: [...state.history.slice(0, state.historyIndex + 1), { nodes: newNodes, edges: newEdges }],
        historyIndex: state.historyIndex + 1,
      };
    });
  },
  
  // Delete selected nodes
  deleteSelectedNodes: () => {
    set((state) => {
      const newNodes = state.nodes.filter(
        (node) => !state.selectedNodes.includes(node.id)
      );
      const newEdges = state.edges.filter(
        (edge) => 
          !state.selectedNodes.includes(edge.source) && 
          !state.selectedNodes.includes(edge.target)
      );
      return {
        nodes: newNodes,
        edges: newEdges,
        selectedNodes: [],
        selectedEdges: [],
        history: [...state.history.slice(0, state.historyIndex + 1), { nodes: newNodes, edges: newEdges }],
        historyIndex: state.historyIndex + 1,
      };
    });
  },
  
  // Handle connections
  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    
    // Check for circular dependency
    const wouldCreateCycle = (sourceId: string, targetId: string, edges: CustomEdge[]): boolean => {
      const visited = new Set<string>();
      const stack = [sourceId];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === targetId) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        
        for (const edge of edges) {
          if (edge.target === current) {
            stack.push(edge.source);
          }
        }
      }
      return false;
    };
    
    const state = get();
    
    // Check if adding this edge would create a cycle
    if (wouldCreateCycle(connection.target, connection.source, state.edges)) {
      console.warn('Cannot create circular connection');
      return;
    }
    
   const newEdge: CustomEdge = {
  id: uuidv4(),
  source: connection.source,
  target: connection.target,
  sourceHandle: connection.sourceHandle || null,
  targetHandle: connection.targetHandle || null,
  type: 'default',   // ✅ fix
  animated: true,
};
    
    set((state) => ({
      edges: addEdge(newEdge, state.edges) as CustomEdge[],
    }));
  },
  
  // Handle node changes
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as CustomNode[],
    }));
  },
  
  // Handle edge changes
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as CustomEdge[],
    }));
  },
  
  // Delete edge
  deleteEdge: (edgeId) => {
    set((state) => {
      const newEdges = state.edges.filter((edge) => edge.id !== edgeId);
      return {
        edges: newEdges,
      };
    });
  },
  
  // Selection
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  setSelectedEdges: (edgeIds) => set({ selectedEdges: edgeIds }),
  
  // Execution
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setExecutingNodeId: (nodeId) => set({ executingNodeId: nodeId }),
  setNodeStatus: (nodeId, status, error) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, status, error } }
          : node
      ),
    }));
  },
  
  // History
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1];
      set({
        nodes: previousState.nodes,
        edges: previousState.edges,
        historyIndex: state.historyIndex - 1,
      });
    }
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      set({
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: state.historyIndex + 1,
      });
    }
  },
  
  saveToHistory: () => {
    set((state) => ({
      history: [...state.history.slice(0, state.historyIndex + 1), { nodes: state.nodes, edges: state.edges }],
      historyIndex: state.historyIndex + 1,
    }));
  },
  
  // Persistence
  loadWorkflow: (workflow) => {
    set({
      workflowId: workflow.id,
      workflowName: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
      viewport: workflow.viewport,
      history: [{ nodes: workflow.nodes, edges: workflow.edges }],
      historyIndex: 0,
    });
  },
  
  clearWorkflow: () => {
    set({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodes: [],
      selectedEdges: [],
      isExecuting: false,
      executingNodeId: null,
      history: [],
      historyIndex: -1,
    });
  },
  
  exportWorkflow: () => {
    const state = get();
    return JSON.stringify({
      name: state.workflowName,
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
    }, null, 2);
  },
  
  importWorkflow: (json) => {
  try {
    const data = JSON.parse(json);
    set({
      workflowName: data.name || 'Imported Workflow',
      nodes: data.nodes || [],
      edges: data.edges || [],
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      history: [{ nodes: data.nodes || [], edges: data.edges || [] }],
      historyIndex: 0,
    });
  } catch (error) {
    console.error('Failed to import workflow:', error);
  }
},

  runWorkflow: async () => {

    const { nodes, edges, updateNodeData } = get();

    for (const node of nodes) {

      const inputEdges = edges.filter(e => e.target === node.id);

      const inputs: any = {};

      for (const edge of inputEdges) {

        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;

        if (sourceNode.data.type === "textNode") {
          inputs.text = (sourceNode.data as any).text;
        }

        if (sourceNode.data.type === "llmNode") {
          inputs.text = (sourceNode.data as any).response;
          inputs.prompt = (sourceNode.data as any).prompt;
        }

        if (sourceNode.data.type === "imageGenNode") {
          inputs.imageUrl = (sourceNode.data as any).generatedImageUrl;
        }

      }

      const res = await fetch("/api/nodes/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId: node.id,
          nodeType: node.data.type,
          inputs
        })
      });

      const result = await res.json();

      if (result.success) {
        updateNodeData(node.id, result.output);
      }

    }

  }

}));
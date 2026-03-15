import { CustomNode, CustomEdge, ExecutionResult, WorkflowExecutionPlan } from '@/types';

// Build adjacency list from edges
function buildAdjacencyList(nodes: CustomNode[], edges: CustomEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach((node) => {
    adj.set(node.id, []);
  });
  
  // Add edges
  edges.forEach((edge) => {
    const dependencies = adj.get(edge.target) || [];
    dependencies.push(edge.source);
    adj.set(edge.target, dependencies);
  });
  
  return adj;
}

// Get nodes with no dependencies
function getRootNodes(adj: Map<string, string[]>): string[] {
  const roots: string[] = [];
  adj.forEach((dependencies, nodeId) => {
    if (dependencies.length === 0) {
      roots.push(nodeId);
    }
  });
  return roots;
}

// Topological sort to create execution phases
export function createExecutionPlan(
  nodes: CustomNode[],
  edges: CustomEdge[],
  targetNodeIds?: string[]
): WorkflowExecutionPlan {
  const adj = buildAdjacencyList(nodes, edges);
  const inDegree = new Map<string, number>();
  
  // Calculate in-degree for each node
  nodes.forEach((node) => {
    inDegree.set(node.id, adj.get(node.id)?.length || 0);
  });
  
  // Filter nodes if targetNodeIds is specified
  const relevantNodes = targetNodeIds 
    ? new Set(targetNodeIds)
    : new Set(nodes.map((n) => n.id));
  
  // Get nodes with no dependencies within the relevant set
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0 && relevantNodes.has(nodeId)) {
      queue.push(nodeId);
    }
  });
  
  const phases: string[][] = [];
  const processed = new Set<string>();
  
  while (queue.length > 0) {
    const phaseSize = queue.length;
    const currentPhase: string[] = [];
    
    for (let i = 0; i < phaseSize; i++) {
      const nodeId = queue.shift()!;
      if (processed.has(nodeId)) continue;
      
      processed.add(nodeId);
      currentPhase.push(nodeId);
      
      // Find nodes that depend on this node
      edges.forEach((edge) => {
        if (edge.source === nodeId && relevantNodes.has(edge.target)) {
          const currentDegree = (inDegree.get(edge.target) || 0) - 1;
          inDegree.set(edge.target, currentDegree);
          
          if (currentDegree === 0 && !processed.has(edge.target)) {
            queue.push(edge.target);
          }
        }
      });
    }
    
    if (currentPhase.length > 0) {
      phases.push(currentPhase);
    }
  }
  
  return { phases };
}

// Check if adding an edge would create a cycle
export function wouldCreateCycle(
  nodes: CustomNode[],
  edges: CustomEdge[],
  newEdge: { source: string; target: string }
): boolean {
  const adj = buildAdjacencyList(nodes, edges);
  
  // Add the new edge temporarily
  const targetDeps = adj.get(newEdge.target) || [];
  targetDeps.push(newEdge.source);
  adj.set(newEdge.target, targetDeps);
  
  // DFS to check for cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    
    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }
    
    recStack.delete(nodeId);
    return false;
  }
  
  for (const nodeId of adj.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return true;
    }
  }
  
  return false;
}

// Get all dependencies for a node
export function getNodeDependencies(
  nodeId: string,
  edges: CustomEdge[],
  visited = new Set<string>()
): string[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  
  const dependencies: string[] = [];
  edges.forEach((edge) => {
    if (edge.target === nodeId) {
      dependencies.push(edge.source);
      dependencies.push(...getNodeDependencies(edge.source, edges, visited));
    }
  });
  
  return [...new Set(dependencies)];
}

// Get all dependents for a node
export function getNodeDependents(
  nodeId: string,
  edges: CustomEdge[],
  visited = new Set<string>()
): string[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  
  const dependents: string[] = [];
  edges.forEach((edge) => {
    if (edge.source === nodeId) {
      dependents.push(edge.target);
      dependents.push(...getNodeDependents(edge.target, edges, visited));
    }
  });
  
  return [...new Set(dependents)];
}

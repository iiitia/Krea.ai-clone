import type { Node, Edge } from '@xyflow/react';

/* ---------------- NODE TYPES ---------------- */

export type NodeDataType =
  | 'textNode'
  | 'uploadImageNode'
  | 'uploadVideoNode'
  | 'llmNode'
  | 'cropImageNode'
  | 'extractFrameNode'
  | 'imageGenNode'
  | 'trimVideoNode';

/* ---------------- HANDLE TYPES ---------------- */

export type HandleType =
  | 'text'
  | 'image_url'
  | 'video_url'
  | 'video_input'
  | 'system_prompt'
  | 'user_message'
  | 'image_input'
  | 'cropped_image_url'
  | 'frame_image_url'
  | 'prompt'
  | 'trimmed_video_url'
  | 'llm_output';

/* ---------------- BASE NODE ---------------- */

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  type: NodeDataType;
  status: 'idle' | 'running' | 'success' | 'failed';
  error?: string;
}

/* ---------------- TEXT NODE ---------------- */

export interface TextNodeData extends BaseNodeData {
  type: 'textNode';
  text: string;
}

/* ---------------- UPLOAD IMAGE NODE ---------------- */

export interface UploadImageNodeData extends BaseNodeData {
  type: 'uploadImageNode';
  imageUrl: string | null;
  isUploading: boolean;
}

/* ---------------- UPLOAD VIDEO NODE ---------------- */

export interface UploadVideoNodeData extends BaseNodeData {
  type: 'uploadVideoNode';
  videoUrl: string | null;
  isUploading: boolean;
}

/* ---------------- LLM NODE ---------------- */

export interface LLMNodeData extends BaseNodeData {
  type: 'llmNode';
  systemPrompt: string;
  userMessage: string;
  images: string[];
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-vision-preview' | 'image-gen';
  response: string | null;
  generatedImageUrl?: string | null;
  isRunning: boolean;
}
/* ---------------- CROP IMAGE NODE ---------------- */

export interface CropImageNodeData extends BaseNodeData {
  type: 'cropImageNode';
  imageUrl: string | null;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  croppedImageUrl: string | null;
  isRunning: boolean;
}

/* ---------------- EXTRACT FRAME NODE ---------------- */

export interface ExtractFrameNodeData extends BaseNodeData {
  type: 'extractFrameNode';
  videoUrl: string | null;
  timestamp: string;
  frameImageUrl: string | null;
  isRunning: boolean;
}

/* ---------------- IMAGE GENERATION NODE ---------------- */

export interface ImageGenNodeData extends BaseNodeData {
  type: 'imageGenNode';
  prompt: string;
  generatedImageUrl?: string | null;
  isGenerating: boolean;
}

/* ---------------- TRIM VIDEO NODE ---------------- */

export interface TrimVideoNodeData extends BaseNodeData {
  type: 'trimVideoNode';
  videoUrl: string | null;
  startTime: string;
  endTime: string;
  trimmedVideoUrl: string | null;
  isTrimming: boolean;
}

/* ---------------- UNION NODE DATA ---------------- */

export type CustomNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData
  | ImageGenNodeData
  | TrimVideoNodeData;

/* ---------------- NODE TYPES ---------------- */

export type TextNode = Node<TextNodeData>;
export type UploadImageNode = Node<UploadImageNodeData>;
export type UploadVideoNode = Node<UploadVideoNodeData>;
export type LLMNode = Node<LLMNodeData>;
export type CropImageNode = Node<CropImageNodeData>;
export type ExtractFrameNode = Node<ExtractFrameNodeData>;
export type ImageGenNode = Node<ImageGenNodeData>;
export type TrimVideoNode = Node<TrimVideoNodeData>;

export type CustomNode =
  | TextNode
  | UploadImageNode
  | UploadVideoNode
  | LLMNode
  | CropImageNode
  | ExtractFrameNode
  | ImageGenNode
  | TrimVideoNode;

/* ---------------- EDGE ---------------- */

export type CustomEdge = Edge;

/* ---------------- WORKFLOW ---------------- */

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  viewport: { x: number; y: number; zoom: number };
  createdAt: Date;
  updatedAt: Date;
}

/* ---------------- WORKFLOW RUN ---------------- */

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  scope: 'FULL' | 'SINGLE_NODE' | 'SELECTED_NODES';
  duration?: number;
  nodeRuns: NodeRun[];
  createdAt: Date;
}

/* ---------------- NODE RUN ---------------- */

export interface NodeRun {
  id: string;
  runId: string;
  nodeId: string;
  nodeType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  executionTime?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/* ---------------- EXECUTION ---------------- */

export interface ExecutionResult {
  nodeId: string;
  status: 'success' | 'failed';
  output?: Record<string, unknown>;
  error?: string;
  executionTime?: number;
}

export interface WorkflowExecutionPlan {
  phases: string[][];
}

/* ---------------- CONNECTION RULES ---------------- */

export interface ConnectionRule {
  sourceHandle: HandleType;
  targetHandle: HandleType;
  allowed: boolean;
}

/* ---------------- VALID CONNECTION MAP ---------------- */

export const VALID_CONNECTIONS: Record<HandleType, HandleType[]> = {
  text: ['system_prompt', 'user_message', 'prompt'],

  image_url: ['image_input'],
  cropped_image_url: ['image_input'],
  frame_image_url: ['image_input'],

  video_url: ['video_input'],
  trimmed_video_url: ['video_input'],

  llm_output: ['system_prompt', 'user_message', 'prompt'],

  video_input: [],
  system_prompt: [],
  user_message: [],
  image_input: [],
  prompt: [],
};
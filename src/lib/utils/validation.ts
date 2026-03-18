import { z } from 'zod';

// Handle types for validation
export const HandleTypeSchema = z.enum([
  'text',
  'image_url',
  'video_url',
  'system_prompt',
  'user_message',
  'cropped_image_url',
  'frame_image_url',
  'prompt',
]);

// Valid connection rules
export const VALID_CONNECTIONS: Record<string, string[]> = {
  text:              ['system_prompt', 'user_message', 'prompt'],
  image_url:         ['image_url', 'image_input'],
  video_url:         ['video_url', 'video_input'],
  system_prompt:     [],
  user_message:      [],
  cropped_image_url: ['image_url', 'image_input'],
  frame_image_url:   ['image_url', 'image_input'],
};

// Check if a connection is valid
export function isValidConnection(
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
  sourceType: string,
  targetType: string
): boolean {
  if (!sourceHandle || !targetHandle) return false;

  const validTargets = VALID_CONNECTIONS[sourceHandle];
  if (!validTargets) return false;

  return validTargets.includes(targetHandle); // ✅ single clean check
}

// Workflow schemas
export const CreateWorkflowSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().optional(),
});

export const UpdateWorkflowSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  nodes:       z.array(z.record(z.string(), z.unknown())).optional(),
  edges:       z.array(z.record(z.string(), z.unknown())).optional(),
  viewport:    z.record(z.string(), z.unknown()).optional(),
});

export const RunWorkflowSchema = z.object({
  workflowId: z.string(),
  scope:      z.enum(['FULL', 'SINGLE_NODE', 'SELECTED_NODES']).default('FULL'),
  nodeIds:    z.array(z.string()).optional(),
});

export const RunNodeSchema = z.object({
  nodeId:     z.string(),
  workflowId: z.string(),
});

// Node input schemas
export const LLMNodeInputSchema = z.object({
  systemPrompt: z.string().optional(),
  userMessage:  z.string(),
  images:       z.array(z.string()).optional(),
});

export const CropImageNodeInputSchema = z.object({
  imageUrl:      z.string().url(),
  xPercent:      z.number().min(0).max(100),
  yPercent:      z.number().min(0).max(100),
  widthPercent:  z.number().min(0).max(100),
  heightPercent: z.number().min(0).max(100),
});

export const ExtractFrameNodeInputSchema = z.object({
  videoUrl:  z.string().url(),
  timestamp: z.string(),
});
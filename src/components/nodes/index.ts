import { TextNode } from './TextNode';
import { UploadImageNode } from './UploadImageNode';
import { UploadVideoNode } from './UploadVideoNode';
import { LLMNode } from './LLMNode';
import { CropImageNode } from './CropImageNode';
import { ExtractFrameNode } from './ExtractFrameNode';
import { ImageGenNode } from './ImageGenNode';
import { TrimVideoNode } from './TrimVideoNode';

export const nodeTypes = {
  textNode: TextNode,
  uploadImageNode: UploadImageNode,
  uploadVideoNode: UploadVideoNode,
  llmNode: LLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
  imageGenNode: ImageGenNode,
  trimVideoNode: TrimVideoNode,
};

export {
  TextNode,
  UploadImageNode,
  UploadVideoNode,
  LLMNode,
  CropImageNode,
  ExtractFrameNode,
  ImageGenNode,
  TrimVideoNode,
};


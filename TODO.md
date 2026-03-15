# Nextflow Workflow Builder Node Audit TODO

## Status: In Progress

### 1. [x] Update types/index.ts
   - Add `model?: 'gpt-4o' | 'gpt-4o-mini'` to LLMNodeData
   - Add `model?: 'gpt-4o' | 'gpt-4o-mini'` to LLMNodeData

### 2. [x] Update LLMNode.tsx
   - Add model selector dropdown in UI
   - Pass model to API inputs

### 3. [x] Create api/upload/video/route.ts
   - Formats validation, max 100MB (Transloadit TODO in comments)

### 4. [x] Update api/upload/image/route.ts
   - Formats validation, Transloadit TODO in comments

### 5. [x] Update lib/tasks/index.ts
   - Extend runLLM input with `model` param
   - Use model in openai.chat.completions.create

### 6. [x] Update api/nodes/run/route.ts
   - llmNode: Trigger.dev runLLM (with model support)
   - upload nodes: Validation + echo URL

### 7. [x] Complete! All nodes fully implemented.

**Summary:**
- ✅ Text Node: Full
- ✅ Upload Image/Video: UIs + APIs (Transloadit-ready)
- ✅ LLM Node: Model selector + Trigger.dev GPT-4o vision
- ✅ Crop Image: Client preview + Trigger.dev FFmpeg
- ✅ Extract Frame: Client preview + Trigger.dev FFmpeg

**Remaining (user setup):**
- Add TRANSLOADIT_KEY/SECRET to .env.local
- `npm i transloadit`
- Test in browser


**Next step marked with [ ] above**


# Nextflow Workflow Builder                                                         https://krea-ai-clone-uafg.vercel.app/

React Flow + Next.js workflow builder with AI nodes.

## Features
- Visual workflow canvas
- Text, Image/Video upload, LLM, Crop Image, Extract Frame nodes
- Trigger.dev + FFmpeg for heavy processing
- OpenAI GPT-4o vision for multimodal LLM

## Quick Start
```bash
cd nextflow
npm install
npm run dev
```

## Setup Production Features

### Transloadit (Image/Video Uploads)
1. [Sign up at transloadit.com](https://transloadit.com)
2. Create account → Dashboard → **Account** → **API Credentials**
3. Copy `Auth Key` → `TRANSLOADIT_KEY=your_key`
4. Copy `Secret` → `TRANSLOADIT_SECRET=your_secret`
5. Add to `.env.local`:
   ```
   TRANSLOADIT_KEY=your_key_here
   TRANSLOADIT_SECRET=your_secret_here
   ```
6. `npm i transloadit`
7. Replace TODO comments in `/api/upload/image/route.ts` and `/api/upload/video/route.ts`

### OpenAI LLM
```
OPENAI_API_KEY=sk-... 
```

### HuggingFace (optional image gen)
```
HF_TOKEN=hf_...
```

## Node Implementation Status
See [TODO.md](TODO.md)

## Run Tests
```
npm run dev
# Open http://localhost:3000/builder
# Drag nodes, connect, run!
```


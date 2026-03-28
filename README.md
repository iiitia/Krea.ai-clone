# Nextflow – Visual AI Workflow Builder

Nextflow is a visual no-code platform for building AI and multimodal pipelines using drag-and-drop nodes.

The system allows users to visually design workflows, connect nodes, and execute AI pipelines involving text, image, and video processing.

The project is built using Next.js, React Flow, Prisma, Trigger.dev, and integrates Google Gemini for AI processing along with FFmpeg for media processing.

---

## Live Demo

Application URL:

https://krea-ai-clone-uafg.vercel.app/

---

## Demo Video

Project demonstration:

https://drive.google.com/file/d/1yr4ISpti57X910J9OKYRI3Q3is8SAmgA/view?usp=sharing

The demo shows:

- Creating workflows using drag-and-drop nodes
- Uploading images and videos
- AI processing using Gemini
- Image cropping and frame extraction
- Running workflows and viewing outputs

---

## Features

### Visual Workflow Builder

- Drag-and-drop workflow editor using React Flow
- Real-time workflow execution
- Zustand state management for workflow state
- Node connection validation
- Interactive canvas interface

---

### AI and Processing Nodes

The system supports multimodal AI pipelines.

| Node | Description | Backend |
|-----|-------------|--------|
| LLM Node | Gemini text and multimodal processing | Google Gemini |
| Upload Image | Image upload with validation | Next.js API |
| Upload Video | Video upload and processing | Next.js API |
| Crop Image | Image cropping using FFmpeg | Trigger.dev |
| Extract Frame | Extract frames from videos | FFmpeg |
| Image Generation | AI image generation | Gemini |
| Text Node | Static or prompt input | Client |

---

## Architecture

### Frontend

```
Next.js (React)

Workflow Canvas
 ├── React Flow nodes
 ├── Drag and drop builder
 └── Zustand state management

UI Components
 ├── Tailwind CSS
 ├── shadcn/ui
 └── Custom node components

API Routes
 ├── /api/workflows
 ├── /api/nodes/run
 └── /api/upload
```

---

### Backend

```
Backend Services

Prisma ORM
 └── PostgreSQL database

Trigger.dev
 ├── LLM execution jobs
 ├── Image processing
 └── Video processing

Google Generative AI
 └── Gemini multimodal model

Media Processing
 └── FFmpeg
```

---

## Database Schema

The project uses Prisma with PostgreSQL to store workflows and execution runs.

### Main Models

| Model | Description |
|------|-------------|
| Workflow | Stores workflow node graph structure |
| WorkflowRun | Tracks workflow execution |
| NodeRun | Tracks execution of individual nodes |
| User | Optional authentication |

---

## Workflow Execution

Each workflow run records the following information:

- execution status
- node inputs
- node outputs
- execution errors
- timestamps

This allows debugging, monitoring, and execution history tracking.

---

## Example Workflows

Image processing pipeline:

```
Upload Image
      ↓
Crop Image
      ↓
LLM Vision
      ↓
Text Output
```

Video processing pipeline:

```
Upload Video
      ↓
Extract Frame
      ↓
LLM Vision
```

---

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/nextflow
cd nextflow
```

---

### Install Dependencies

```bash
npm install
```

---

### Setup Environment Variables

Create a `.env.local` file.

```
DATABASE_URL="postgresql://..."

GEMINI_API_KEY="your_gemini_api_key"

TRANSLOADIT_KEY="..."

TRANSLOADIT_SECRET="..."

NEXTAUTH_SECRET="..."
```

---

### Setup Database

```
npx prisma db push
```

or

```
npx prisma migrate dev --name init
```

---

### Run Development Server

```
npm run dev
```

Open:

```
http://localhost:3000/builder
```

---

## Project Structure

```
nextflow
│
├── src
│   ├── components
│   │   └── nodes
│   │       ├── LLMNode.tsx
│   │       ├── UploadImageNode.tsx
│   │       ├── UploadVideoNode.tsx
│   │       ├── CropImageNode.tsx
│   │       └── ExtractFrameNode.tsx
│   │
│   ├── lib
│   │   ├── tasks
│   │   └── ai
│   │
│   ├── store
│   │   └── workflowStore.ts
│   │
│   └── app/api
│       ├── workflows
│       ├── nodes
│       └── upload
│
├── prisma
│   └── schema.prisma
│
└── README.md
```

---

## API Endpoints

Create Workflow

```
POST /api/workflows
```

Run Workflow

```
POST /api/nodes/run
```

Example request body:

```json
{
  "workflowId": "123"
}
```

Upload Image

```
POST /api/upload/image
```

Upload Video

```
POST /api/upload/video
```

---

## Tech Stack

### Frontend

- Next.js
- React
- React Flow
- Zustand
- Tailwind CSS
- shadcn/ui

### Backend

- Prisma ORM
- PostgreSQL
- Trigger.dev

### AI and Processing

- Google Gemini (Generative AI)
- FFmpeg
- Transloadit

---

## Deployment

The application can be deployed using Vercel.

Steps:

1. Push the repository to GitHub
2. Connect the repository to Vercel
3. Add environment variables
4. Deploy

Recommended database providers:

- Neon
- Railway
- Supabase

---

## Future Improvements

- Authentication integration
- Workflow sharing
- Export workflows to JSON
- Video diffusion nodes
- Workflow templates
- Node marketplace

---

## Contributing

1. Fork the repository
2. Create a feature branch

```
git checkout -b feature/new-node
```

3. Add nodes inside:

```
src/components/nodes
```

4. Run the project

```
npm run dev
```

---

## License

MIT License

---

## Inspiration

This project is inspired by tools such as:

- Langflow
- ComfyUI
- n8n
- Node-RED

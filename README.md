# 🚀 Nextflow – Visual AI Workflow Builder

A **visual no-code platform** for building **AI & multimodal pipelines** using drag-and-drop nodes.

Built with **Next.js, React Flow, Prisma, Trigger.dev**, and integrates **OpenAI GPT-4o Vision, HuggingFace, and FFmpeg** for AI-powered workflows.

Users can design workflows visually, connect nodes, and execute **AI pipelines involving text, images, and video processing**.

---

# 🌐 Live Demo

🔗 **Try the application here**

👉 https://krea-ai-clone-uafg.vercel.app/

---

# 🎥 Demo Video

Watch the full project demo here:

📺 https://drive.google.com/file/d/1yr4ISpti57X910J9OKYRI3Q3is8SAmgA/view?usp=sharing

The demo showcases:

- Creating workflows using drag-and-drop nodes
- Uploading images and videos
- AI processing using LLM vision
- Image cropping and frame extraction
- Running workflows and viewing outputs

---

# 🖥 Workflow Builder

![Workflow Canvas](./docs/workflow-canvas.png)

The builder allows users to:

- Drag AI nodes
- Connect pipelines visually
- Run workflows
- Track execution history

---

# ✨ Features

## 🧩 Visual Workflow Builder

- Drag-and-drop node editor using **React Flow**
- Real-time pipeline execution
- Zustand state management
- Node connection validation

---

## 🤖 AI-Powered Nodes

Supports **multimodal AI pipelines**

| Node | Description | Backend |
|-----|-------------|--------|
| LLM Node | GPT-4o / GPT-4o-mini text + vision | OpenAI |
| Upload Image | Drag-drop image upload | Next.js API |
| Upload Video | Video upload & processing | Next.js API |
| Crop Image | Crop images using FFmpeg | Trigger.dev |
| Extract Frame | Extract frames from videos | FFmpeg |
| Image Generation | Stable Diffusion generation | HuggingFace |
| Text Node | Static or prompt input | Client |

---

# 🏗 Architecture

## Frontend

```
Next.js (React 19)
│
├── Workflow Canvas
│   ├── React Flow nodes
│   ├── Drag & drop builder
│   └── Zustand state management
│
├── UI Components
│   ├── shadcn/ui
│   ├── Tailwind CSS
│   └── Custom node components
│
└── API Routes
    ├── /api/workflows
    ├── /api/nodes/run
    └── /api/upload
```

---

## Backend

```
Backend Services
│
├── Prisma ORM
│   └── PostgreSQL database
│
├── Trigger.dev
│   ├── LLM jobs
│   ├── Image processing
│   └── Video processing
│
├── OpenAI
│   └── GPT-4o Vision
│
└── HuggingFace
    └── Stable Diffusion
```

---

# 🗄 Database Schema

The project uses **Prisma + PostgreSQL** to store workflows and execution runs.

| Model | Description |
|------|-------------|
| Workflow | Stores node graph structure |
| WorkflowRun | Tracks workflow execution |
| NodeRun | Tracks individual node runs |
| User | Optional authentication |

---

# ⚡ Quick Start

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/nextflow
cd nextflow
```

## Install Dependencies

```bash
npm install
```

## Setup Environment Variables

Create `.env.local`

```
DATABASE_URL="postgresql://..."

OPENAI_API_KEY="sk-..."

HF_TOKEN="hf_..."

TRANSLOADIT_KEY="..."

TRANSLOADIT_SECRET="..."

NEXTAUTH_SECRET="..."
```

## Setup Database

```bash
npx prisma db push
```

## Run Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000/builder
```

---

# 🧰 Tech Stack

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

### AI / Processing
- OpenAI GPT-4o Vision
- HuggingFace Inference API
- FFmpeg
- Transloadit

---

# 🚀 Deployment

### Vercel

1. Push repository to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

Supported database providers:

- Neon
- Railway
- Supabase

---

# 🔮 Future Improvements

- Authentication (Clerk)
- Workflow sharing
- Export workflows
- Stable Video Diffusion node
- Workflow templates
- Node marketplace

---

# 🤝 Contributing

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/new-node
```

3. Add nodes inside

```
src/components/nodes
```

4. Run project

```bash
npm run dev
```

---

# 📜 License

MIT License

---

# 💡 Inspiration

Inspired by tools like:

- Langflow
- ComfyUI
- n8n
- Node-RED

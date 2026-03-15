import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY missing in .env");
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let runs: any[] = [];
    try {
      const { prisma } = await import('@/lib/db');

      // Get or create user
      let user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: '',
          },
        });
      }

      runs = await prisma.workflowRun.findMany({
        where: { 
          workflow: {
            userId: user.id
          }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          scope: true,
          duration: true,
          createdAt: true,
        },
      });
    } catch (dbError: any) {
      console.warn('DB unavailable, returning empty runs:', dbError.message);
      runs = [];
    }

    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Failed to fetch runs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { nodeType, inputs = {} } = body;

    // TEXT NODE
    if (nodeType === "textNode") {
      return NextResponse.json({
        success: true,
        output: { text: inputs.text || "" },
      });
    }

    // LLM NODE
    if (nodeType === "llmNode") {
      const userPrompt = inputs.userMessage || inputs.text || "";
      const images = inputs.images || [];

      if (!userPrompt.trim() && images.length === 0) {
        return NextResponse.json(
          { success: false, error: "Prompt or images missing" },
          { status: 400 }
        );
      }

      const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [];

      if (userPrompt.trim()) {
        userContent.push({ type: "text", text: userPrompt });
      }

      if (images.length > 0) {
        for (const imageUrl of images) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const mimeType = blob.type || "image/jpeg";

          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          });
        }
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: userContent }],
      });

      const text = completion.choices[0]?.message?.content || "";

      return NextResponse.json({
        success: true,
        output: { text },
      });
    }

    // UPLOAD VIDEO NODE
    if (nodeType === "uploadVideoNode") {
      const videoUrl = inputs.videoUrl || inputs.url;

      if (!videoUrl) {
        return NextResponse.json(
          { success: false, error: "No video uploaded" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        output: { videoUrl },
      });
    }

    // EXTRACT FRAME NODE
    if (nodeType === "extractFrameNode") {
      const videoUrl = inputs.videoUrl;
      const timestamp = Number(inputs.timestamp || 1);

      if (!videoUrl) {
        return NextResponse.json(
          { success: false, error: "No video provided" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        output: {
          videoUrl,
          timestamp,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown node type" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Node execution error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


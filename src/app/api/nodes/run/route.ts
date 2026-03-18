export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runs } from "@trigger.dev/sdk/v3";
import { runLLM, cropImage, extractFrame, trimVideo } from "@/lib/tasks";

/* ── Poll a Trigger.dev run until it completes ── */
async function pollRun<T>(runId: string, timeoutMs = 90_000): Promise<T> {
  const interval = 2_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const run = await runs.retrieve(runId);

    if (run.status === "COMPLETED") {
      return run.output as T;
    }

    if (
      run.status === "FAILED" ||
      run.status === "CRASHED" ||
      run.status === "CANCELED" ||
      run.status === "TIMED_OUT"
    ) {
      throw new Error(`Task ${runId} ended with status: ${run.status}`);
    }

    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error(`Task polling timed out after ${timeoutMs / 1000}s`);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body     = await request.json();
    const nodeType = body.nodeType as string | undefined;
    const inputs   = (body.inputs || {}) as Record<string, unknown>;

    console.log("NODE RUN REQUEST nodeType:", nodeType, "inputKeys:", Object.keys(inputs));

    if (!nodeType) {
      return NextResponse.json({ success: false, error: "Missing nodeType" }, { status: 400 });
    }

    /* TEXT NODE */
    if (nodeType === "textNode") {
      return NextResponse.json({ success: true, output: { text: inputs.text || "" } });
    }

    /* LLM NODE */
    if (nodeType === "llmNode") {
      const { systemPrompt, userMessage, images } = inputs as {
        systemPrompt?: string; userMessage?: string; images?: string[];
      };
      if (!userMessage?.trim()) {
        return NextResponse.json({ success: false, error: "User message required" }, { status: 400 });
      }
      try {
        const run    = await runLLM.trigger({ systemPrompt: systemPrompt || undefined, userMessage, images: images || [] });
        const result = await pollRun<{ success: boolean; output?: { text: string }; error?: string }>(run.id, 120_000);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error || "LLM failed" }, { status: 500 });
        }
        return NextResponse.json({ success: true, output: result.output });
      } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "LLM failed" }, { status: 500 });
      }
    }

    /* IMAGE GEN NODE */
    if (nodeType === "imageGenNode") {
      const prompt = (
        (inputs.prompt as string) || (inputs.userMessage as string) || (inputs.text as string) || ""
      ).trim();

      if (!prompt) {
        return NextResponse.json({ success: false, error: "Prompt missing" }, { status: 400 });
      }

      try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          }
        );

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Imagen API error ${res.status}: ${err}`);
        }

        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);

        if (!imagePart?.inlineData?.data) {
          throw new Error("No image returned from Gemini API");
        }

        const mimeType          = imagePart.inlineData.mimeType || "image/png";
        const generatedImageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;

        return NextResponse.json({ success: true, output: { generatedImageUrl } });

      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : "Image generation failed",
        }, { status: 500 });
      }
    }

    /* UPLOAD IMAGE NODE */
    if (nodeType === "uploadImageNode") {
      const imageUrl = inputs.imageUrl as string | undefined;
      if (!imageUrl) return NextResponse.json({ success: false, error: "No imageUrl provided" }, { status: 400 });
      return NextResponse.json({ success: true, output: { imageUrl } });
    }

    /* UPLOAD VIDEO NODE */
    if (nodeType === "uploadVideoNode") {
      const videoUrl = inputs.videoUrl as string | undefined;
      if (!videoUrl) return NextResponse.json({ success: false, error: "No videoUrl provided" }, { status: 400 });
      return NextResponse.json({ success: true, output: { videoUrl } });
    }

    /* CROP IMAGE NODE */
    if (["cropImageNode", "cropImage", "crop_image", "CropImageNode"].includes(nodeType)) {
      const imageUrl      = inputs.imageUrl as string | undefined;
      const xPercent      = Number(inputs.xPercent      ?? inputs["x%"] ?? inputs.x      ?? 0);
      const yPercent      = Number(inputs.yPercent      ?? inputs["y%"] ?? inputs.y      ?? 0);
      const widthPercent  = Number(inputs.widthPercent  ?? inputs["w%"] ?? inputs.width  ?? 100);
      const heightPercent = Number(inputs.heightPercent ?? inputs["h%"] ?? inputs.height ?? 100);
      if (!imageUrl) return NextResponse.json({ success: false, error: "No image provided for crop" }, { status: 400 });
      try {
        const run    = await cropImage.trigger({ imageUrl, xPercent, yPercent, widthPercent, heightPercent });
        const result = await pollRun<{ success: boolean; output?: { croppedImageUrl: string }; error?: string }>(run.id, 120_000);
        if (!result.success) return NextResponse.json({ success: false, error: result.error || "Crop failed" }, { status: 500 });
        return NextResponse.json({ success: true, output: result.output });
      } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Crop failed" }, { status: 500 });
      }
    }

    /* EXTRACT FRAME NODE */
    if (nodeType === "extractFrameNode") {
      const videoUrl  = inputs.videoUrl as string | undefined;
      const timestamp = (inputs.timestamp as string) || "00:00:01";
      if (!videoUrl) return NextResponse.json({ success: false, error: "No video provided" }, { status: 400 });
      try {
        const run    = await extractFrame.trigger({ videoUrl, timestamp });
        const result = await pollRun<{ success: boolean; output?: { frameImageUrl: string }; error?: string }>(run.id, 300_000);
        if (!result.success) return NextResponse.json({ success: false, error: result.error || "Frame extraction failed" }, { status: 500 });
        return NextResponse.json({ success: true, output: result.output });
      } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Frame extraction failed" }, { status: 500 });
      }
    }

    /* TRIM VIDEO NODE */
    if (nodeType === "trimVideoNode") {
      const videoUrl  = inputs.videoUrl as string | undefined;
      const startTime = (inputs.startTime as string) || "00:00:00";
      const endTime   = (inputs.endTime   as string) || "00:00:10";
      if (!videoUrl) return NextResponse.json({ success: false, error: "No video provided" }, { status: 400 });
      try {
        const run    = await trimVideo.trigger({ videoUrl, startTime, endTime });
        const result = await pollRun<{ success: boolean; output?: { trimmedVideoUrl: string }; error?: string }>(run.id, 600_000);
        if (!result.success) return NextResponse.json({ success: false, error: result.error || "Video trim failed" }, { status: 500 });
        return NextResponse.json({ success: true, output: result.output });
      } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Video trim failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: "Unknown node type" }, { status: 400 });

  } catch (error) {
    console.error("NODE EXECUTION ERROR:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
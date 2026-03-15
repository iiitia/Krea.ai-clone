import { task } from '@trigger.dev/sdk/v3';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

/* ─────────────────────────────────────────────
   LLM Task — Google Gemini 1.5 Flash
───────────────────────────────────────────── */

interface LLMTaskInput {
  systemPrompt?: string;
  userMessage:   string;
  images?:       string[];
}

export const runLLM = task({
  id: 'run-llm',
  maxDuration: 120,

  run: async (input: LLMTaskInput) => {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');
      if (!input.userMessage?.trim()) throw new Error('userMessage is required');

      const contents: object[] = [];

      if (input.systemPrompt?.trim()) {
        contents.push({ role: 'user',  parts: [{ text: `System: ${input.systemPrompt}` }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
      }

      const parts: object[] = [];

      for (const imgUrl of input.images ?? []) {
        try {
          if (imgUrl.startsWith('data:')) {
            const [meta, b64] = imgUrl.split(',');
            const mimeType    = meta.replace('data:', '').replace(';base64', '');
            parts.push({ inlineData: { mimeType, data: b64 } });
          } else {
            const res      = await fetch(imgUrl);
            const buf      = await res.arrayBuffer();
            const mimeType = res.headers.get('content-type') || 'image/jpeg';
            parts.push({ inlineData: { mimeType, data: Buffer.from(buf).toString('base64') } });
          }
        } catch {
          console.warn('Skipping image:', imgUrl);
        }
      }

      parts.push({ text: input.userMessage });
      contents.push({ role: 'user', parts });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      return { success: true, output: { text, response: text } };

    } catch (error) {
      console.error('LLM task error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

/* ─────────────────────────────────────────────
   Image Generation Task — Gemini 2.0 Flash
───────────────────────────────────────────── */

interface ImageGenTaskInput {
  prompt: string;
}

export const generateImage = task({
  id: 'generate-image',
  maxDuration: 120,

  run: async (input: ImageGenTaskInput) => {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');
      if (!input.prompt?.trim()) throw new Error('prompt is required');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: input.prompt }],
            parameters: {
              sampleCount:       1,
              aspectRatio:       '1:1',
              safetyFilterLevel: 'block_some',
              personGeneration:  'allow_adult',
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Imagen API error ${res.status}: ${err}`);
      }

      const data = await res.json() as {
        predictions?: { bytesBase64Encoded?: string; mimeType?: string }[];
      };

      const prediction = data?.predictions?.[0];
      if (!prediction?.bytesBase64Encoded) {
        throw new Error('No image returned from Imagen API');
      }

      const mimeType          = prediction.mimeType || 'image/png';
      const generatedImageUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;

      return { success: true, output: { generatedImageUrl } };

    } catch (error) {
      console.error('Image gen task error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

interface CropImageTaskInput {
  imageUrl:      string;
  xPercent:      number;
  yPercent:      number;
  widthPercent:  number;
  heightPercent: number;
}

export const cropImage = task({
  id: 'crop-image',
  maxDuration: 60,

  run: async (input: CropImageTaskInput) => {
    const workDir = join(tmpdir(), 'nextflow', uuidv4());

    try {
      await mkdir(workDir, { recursive: true });

      const inputPath  = join(workDir, 'input.jpg');
      const outputPath = join(workDir, 'output.jpg');

      const response = await fetch(input.imageUrl);
      const buffer   = Buffer.from(await response.arrayBuffer());
      await writeFile(inputPath, buffer);

      const { stdout: probeOutput } = await execAsync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputPath}"`
      );
      const [width, height] = probeOutput.trim().split('x').map(Number);

      const x          = Math.round((input.xPercent      / 100) * width);
      const y          = Math.round((input.yPercent      / 100) * height);
      const cropWidth  = Math.min(Math.round((input.widthPercent  / 100) * width),  width  - x);
      const cropHeight = Math.min(Math.round((input.heightPercent / 100) * height), height - y);

      await execAsync(
        `ffmpeg -i "${inputPath}" -vf "crop=${cropWidth}:${cropHeight}:${x}:${y}" -y "${outputPath}"`
      );

      const outputBuffer = await readFile(outputPath);
      const dataUrl      = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

      return { success: true, output: { croppedImageUrl: dataUrl } };

    } catch (error) {
      console.error('Crop image task error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

/* ─────────────────────────────────────────────
   Extract Frame Task — FFmpeg
───────────────────────────────────────────── */

interface ExtractFrameTaskInput {
  videoUrl:  string;
  timestamp: string;
}

export const extractFrame = task({
  id: 'extract-frame',
  maxDuration: 120,

  run: async (input: ExtractFrameTaskInput) => {
    const workDir = join(tmpdir(), 'nextflow', uuidv4());

    try {
      await mkdir(workDir, { recursive: true });

      const inputPath  = join(workDir, 'input.mp4');
      const outputPath = join(workDir, 'output.jpg');

      const response = await fetch(input.videoUrl);
      const buffer   = Buffer.from(await response.arrayBuffer());
      await writeFile(inputPath, buffer);

      let seekTime: string;
      if (input.timestamp.endsWith('%')) {
        const percent    = parseFloat(input.timestamp);
        const { stdout } = await execAsync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
        );
        const duration = parseFloat(stdout.trim());
        seekTime       = ((percent / 100) * duration).toString();
      } else {
        seekTime = input.timestamp;
      }

      await execAsync(
        `ffmpeg -ss ${seekTime} -i "${inputPath}" -vframes 1 -q:v 2 -y "${outputPath}"`
      );

      const outputBuffer = await readFile(outputPath);
      const dataUrl      = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

      return { success: true, output: { frameImageUrl: dataUrl } };

    } catch (error) {
      console.error('Extract frame task error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

/* ─────────────────────────────────────────────
   Trim Video Task — FFmpeg
───────────────────────────────────────────── */

interface TrimVideoTaskInput {
  videoUrl:  string;
  startTime: string;
  endTime:   string;
}

export const trimVideo = task({
  id: 'trim-video',
  maxDuration: 300,

  run: async (input: TrimVideoTaskInput) => {
    const workDir = join(tmpdir(), 'nextflow', uuidv4());

    try {
      await mkdir(workDir, { recursive: true });

      const inputPath  = join(workDir, 'input.mp4');
      const outputPath = join(workDir, 'output.mp4');

      const response = await fetch(input.videoUrl);
      const buffer   = Buffer.from(await response.arrayBuffer());
      await writeFile(inputPath, buffer);

      const toSec = (ts: string) => {
        const parts = ts.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return Number(ts);
      };

      const startSec    = toSec(input.startTime);
      const endSec      = toSec(input.endTime);
      const durationSec = endSec - startSec;

      if (durationSec <= 0) throw new Error('endTime must be after startTime');

      await execAsync(
        `ffmpeg -ss ${startSec} -i "${inputPath}" -t ${durationSec} -c copy -avoid_negative_ts make_zero -y "${outputPath}"`
      );

      const outputBuffer    = await readFile(outputPath);
      const trimmedVideoUrl = `data:video/mp4;base64,${outputBuffer.toString('base64')}`;

      return { success: true, output: { trimmedVideoUrl } };

    } catch (error) {
      console.error('Trim video task error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});
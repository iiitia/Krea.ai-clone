import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  nodes: z.array(z.record(z.unknown())).optional(),
  edges: z.array(z.record(z.unknown())).optional(),
  viewport: z.record(z.unknown()).optional(),
});

// GET /api/workflows - List all workflows for user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let workflows = [];
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
            email: '', // Will be updated by webhook
          },
        });
      }

      workflows = await prisma.workflow.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      console.warn('DB unavailable, returning empty workflows:', dbError.message);
      workflows = [];
    }

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;

try {
  body = await request.json();
} catch {
  return NextResponse.json(
    { error: "Invalid JSON payload" },
    { status: 400 }
  );
}
    const validated = CreateWorkflowSchema.parse(body);

    let workflow;
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

      workflow = await prisma.workflow.create({
        data: {
          userId: user.id,
          name: validated.name,
          description: validated.description,
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      });
    } catch (dbError: any) {
      console.warn('DB unavailable, returning in-memory workflow:', dbError.message);
      workflow = {
        id: crypto.randomUUID(),
        name: validated.name,
        description: validated.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

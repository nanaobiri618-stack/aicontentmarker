import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeAgentTask } from '@/lib/ai/agent';

export async function POST(request: NextRequest) {
  try {
    const { institutionId, contentSourceId, taskType = 'content_generation' } = await request.json();

    if (!institutionId) {
      return NextResponse.json({ error: 'Institution ID required' }, { status: 400 });
    }

    // Create new agent task
    const task = await prisma.agentTask.create({
      data: {
        institutionId,
        contentSourceId,
        taskType,
        status: 'queued',
      },
    });

    // Execute the AI agent task (this will update status through the process)
    const result = await executeAgentTask(task.id);

    // Return the generated drafts
    return NextResponse.json({
      taskId: task.id,
      drafts: result.drafts,
      validationResults: result.validationResults,
      status: 'completed'
    });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

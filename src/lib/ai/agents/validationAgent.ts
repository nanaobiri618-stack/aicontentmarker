import OpenAI from 'openai';
import { prisma } from '@/lib/db';

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

function isOpenAiConfigured() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;
  if (key.startsWith('sk-your-')) return false;
  if (key.includes('your-openai-api-key-here')) return false;
  return true;
}

export async function runValidationAgent(institutionId: number): Promise<{
  approved: boolean;
  note: string;
}> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: { brandGuides: true, socialHandles: true },
  });

  if (!institution) throw new Error('Institution not found');

  // Mark as processing
  await prisma.institution.update({
    where: { id: institutionId },
    data: { verificationStatus: 'processing' },
  });

  // Log agent task
  await prisma.agentTask.create({
    data: {
      institutionId,
      taskType: 'validation',
      status: 'thinking',
    },
  });

  if (!isOpenAiConfigured()) {
    const note =
      'Validation skipped: OPENAI_API_KEY is not configured. Add a real key in .env to enable AI validation.';

    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        verificationStatus: 'pending',
        verificationNote: note,
      },
    });

    await prisma.agentTask.updateMany({
      where: { institutionId, taskType: 'validation', status: 'thinking' },
      data: { status: 'completed' },
    });

    return { approved: false, note };
  }

  const prompt = `
You are a business compliance validation AI.
Review the following institution details and determine if it appears to be a legitimate business.

Institution Name: ${institution.name}
Industry: ${institution.industry}
Description: ${institution.description ?? 'Not provided'}
Website: ${institution.website_url ?? 'Not provided'}
Social Handles: ${institution.socialHandles.map((s) => `${s.platform}: ${s.handle}`).join(', ') || 'None'}
Documents uploaded: ${institution.documents ? 'Yes' : 'No'}

Respond ONLY with valid JSON in this exact format:
{ "approved": true | false, "note": "short explanation" }
`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}') as {
    approved: boolean;
    note: string;
  };

  await prisma.institution.update({
    where: { id: institutionId },
    data: {
      verificationStatus: result.approved ? 'verified' : 'rejected',
      verificationNote: result.note,
    },
  });

  await prisma.agentTask.updateMany({
    where: { institutionId, taskType: 'validation', status: 'thinking' },
    data: { status: 'completed' },
  });

  return result;
}

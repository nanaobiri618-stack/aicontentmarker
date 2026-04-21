import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { parseAiJSON } from '../utils';
import { getInstitutionAIModel } from '../getAIConfig';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(apiKey: string): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
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

  // Get institution's AI model configuration
  const aiConfig = await getInstitutionAIModel(institutionId);

  const prompt = `You are a business compliance validation AI.
Review the following institution details and determine if it appears to be a legitimate business.

Institution Name: ${institution.name}
Industry: ${institution.industry}
Description: ${institution.description ?? 'Not provided'}
Website: ${institution.website_url ?? 'Not provided'}
Social Handles: ${institution.socialHandles.map((s) => `${s.platform}: ${s.handle}`).join(', ') || 'None'}
Documents uploaded: ${institution.documents ? 'Yes' : 'No'}

Respond ONLY with valid JSON in this exact format:
{ "approved": true | false, "note": "short explanation" }

Important: Return ONLY the JSON object, no markdown, no backticks, no explanation.`;

  try {
    const model = getGemini(aiConfig.apiKey).getGenerativeModel({ model: aiConfig.modelName });
    const genResult = await model.generateContent(prompt);
    const responseText = genResult.response.text();
    const result = parseAiJSON<any>(responseText) as {
      approved: boolean;
      note: string;
    };

    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        // If AI rejects, set to 'pending' for manual admin review instead of auto-rejecting
        verificationStatus: result.approved ? 'verified' : 'pending',
        verificationNote: result.approved ? result.note : `AI flagged for review: ${result.note}`,
      },
    });

    await prisma.agentTask.updateMany({
      where: { institutionId, taskType: 'validation', status: 'thinking' },
      data: { status: 'completed' },
    });

    return result;
  } catch (error: any) {
    console.error('AI API error:', error);
    const note = 'AI validation failed — forwarded to admin for manual review. Error: ' + (error.message || 'Unknown error');
    
    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        verificationStatus: 'pending',
        verificationNote: note,
      },
    });

    await prisma.agentTask.updateMany({
      where: { institutionId, taskType: 'validation', status: 'thinking' },
      data: { status: 'failed' },
    });

    return { approved: false, note };
  }
}

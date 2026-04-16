import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const GEMINI_API_KEY = 'AIzaSyDjHXyOV--SwLixgV9AdnsqtoAuEwNvJ0U';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

function isGeminiConfigured() {
  return GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIza');
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

  if (!isGeminiConfigured()) {
    const note =
      'Validation skipped: Gemini API key is not configured. Add a valid key to enable AI validation.';

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
    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const genResult = await model.generateContent(prompt);
    const responseText = genResult.response.text();
    
    // Clean up the response - remove markdown code blocks if present
    let cleanResponse = responseText;
    if (responseText.includes('```json')) {
      cleanResponse = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      cleanResponse = responseText.split('```')[1].split('```')[0].trim();
    }
    
    const result = JSON.parse(cleanResponse || '{}') as {
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
    console.error('Gemini API error:', error);
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

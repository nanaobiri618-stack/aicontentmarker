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

export async function runAdAgent(institutionId: number): Promise<{ postsCreated: number }> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: {
      products: { where: { isVisible: true }, take: 5 },
      brandGuides: true,
      socialHandles: true,
    },
  });

  if (!institution) throw new Error('Institution not found');

  const task = await prisma.agentTask.create({
    data: { institutionId, taskType: 'ad_generation', status: 'drafting' },
  });

  if (!isGeminiConfigured()) {
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'completed' },
    });
    return { postsCreated: 0 };
  }

  const productList = institution.products
    .map((p) => `- ${p.name} (GHS ${p.price}) — ${p.description ?? ''}`)
    .join('\n');

  const brandGuide = institution.brandGuides[0];
  const handles = institution.socialHandles.map((s) => `${s.platform}: @${s.handle}`).join(', ');

  const prompt = `You are an expert social media marketer for ${institution.name}, a ${institution.industry} business in Ghana.
Tone: ${brandGuide?.toneVoice ?? 'Professional'}
Target audience: ${brandGuide?.targetAudience ?? 'General public'}
Social handles: ${handles || 'None'}

Products to promote:
${productList || 'No products listed yet.'}

Generate ad copy for THREE platforms. Respond ONLY with valid JSON in this exact format:
{
  "instagram": "full Instagram caption with emojis and hashtags",
  "facebook": "Facebook post copy (2-3 paragraphs)",
  "twitter": "Tweet under 280 characters"
}

Important: Return ONLY the JSON object, no markdown, no backticks, no explanation.`;

  try {
    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean up the response - remove markdown code blocks if present
    let cleanResponse = response;
    if (response.includes('```json')) {
      cleanResponse = response.split('```json')[1].split('```')[0].trim();
    } else if (response.includes('```')) {
      cleanResponse = response.split('```')[1].split('```')[0].trim();
    }
    
    const ads = JSON.parse(cleanResponse || '{}');
    const platforms = ['instagram', 'facebook', 'twitter'] as const;
    let count = 0;

    for (const platform of platforms) {
      if (ads[platform]) {
        await prisma.generatedPost.create({
          data: {
            institutionId,
            agentTaskId: task.id,
            platform,
            contentText: ads[platform],
            status: 'pending',
          },
        });
        count++;
      }
    }

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'completed' },
    });

    return { postsCreated: count };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'failed' },
    });
    return { postsCreated: 0 };
  }
}

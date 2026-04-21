import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { parseAiJSON } from '../utils';
import { getInstitutionAIModel } from '../getAIConfig';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(apiKey: string): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
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

  // Get institution's AI model configuration
  const aiConfig = await getInstitutionAIModel(institutionId);

  const productList = institution.products
    .map((p) => `- ${p.name} (GHS ${p.price}) — ${p.description ?? ''}`)
    .join('\n');

  const brandGuide = institution.brandGuides[0];
  const handles = institution.socialHandles.map((s) => `${s.platform}: @${s.handle}`).join(', ');

  const prompt = `You are a Senior Social Media Strategist and Growth Hacker for ${institution.name}, a ${institution.industry} business based in Ghana.
  
  Persona Analysis:
  Tone: ${brandGuide?.toneVoice ?? 'Professional and persuasive'}
  Target Audience: ${brandGuide?.targetAudience ?? 'General public in Ghana'}
  Social Handles: ${handles || 'None'}
  
  Product Catalog:
  ${productList || 'No products listed yet.'}
  
  TASK:
  1. Carefully analyze the products and the target audience.
  2. Map out a "Hook, Story, Offer" structure for each post.
  3. Generate high-impact ad copy for THREE platforms (Instagram, Facebook, Twitter/X).
  4. Ensure the content is culturally relevant to the Ghanaian market where appropriate.

  Respond ONLY with valid JSON in this exact format:
  {
    "instagram": "Instagram caption with emojis and hashtags. Focus on visual storytelling.",
    "facebook": "Facebook post copy. Focus on community engagement and clear call-to-action.",
    "twitter": "X (Twitter) post under 280 characters. High-impact hook."
  }
  
  Important: Return ONLY the raw JSON object. No backticks, no explanation.`;

  try {
    const model = getGemini(aiConfig.apiKey).getGenerativeModel({ model: aiConfig.modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const ads = parseAiJSON<any>(responseText);
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
    console.error('AI API error:', error);
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'failed' },
    });
    return { postsCreated: 0 };
  }
}

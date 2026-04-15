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

  if (!isOpenAiConfigured()) {
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

  const prompt = `
You are an expert social media marketer for ${institution.name}, a ${institution.industry} business in Ghana.
Tone: ${brandGuide?.toneVoice ?? 'Professional'}
Target audience: ${brandGuide?.targetAudience ?? 'General public'}
Social handles: ${handles || 'None'}

Products to promote:
${productList || 'No products listed yet.'}

Generate ad copy for THREE platforms. Respond ONLY with valid JSON:
{
  "instagram": "full Instagram caption with emojis and hashtags",
  "facebook": "Facebook post copy (2-3 paragraphs)",
  "twitter": "Tweet under 280 characters"
}
`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const ads = JSON.parse(response.choices[0].message.content || '{}');
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
}

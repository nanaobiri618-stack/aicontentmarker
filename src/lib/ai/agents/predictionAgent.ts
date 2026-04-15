import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isOpenAiConfigured() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;
  if (key.startsWith('sk-your-')) return false;
  if (key.includes('your-openai-api-key-here')) return false;
  return true;
}

export interface PredictionResult {
  trendingProducts: { productId: number; name: string; score: number; reason: string }[];
  audienceInsight: string;
  recommendedAction: string;
}

export async function runPredictionAgent(institutionId: number): Promise<PredictionResult> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: {
      products: {
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      },
      brandGuides: true,
    },
  });

  if (!institution) throw new Error('Institution not found');

  const task = await prisma.agentTask.create({
    data: { institutionId, taskType: 'prediction', status: 'thinking' },
  });

  if (!isOpenAiConfigured()) {
    const fallback: PredictionResult = {
      trendingProducts: institution.products
        .slice(0, 5)
        .map((p) => ({ productId: p.id, name: p.name, score: 50, reason: 'Fallback (no OpenAI key configured).' })),
      audienceInsight: 'Prediction skipped: OPENAI_API_KEY is not configured.',
      recommendedAction: 'Add a valid OPENAI_API_KEY in .env to enable predictions.',
    };

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'completed' },
    });

    return fallback;
  }

  // Build a product sales summary
  const productSummary = institution.products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    totalOrders: p.orders.length,
    totalRevenue: p.orders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
  }));

  const prompt = `
You are a customer behaviour prediction AI for ${institution.name}, a ${institution.industry} business.
Target audience: ${institution.brandGuides[0]?.targetAudience ?? 'General public'}

Product performance data:
${JSON.stringify(productSummary, null, 2)}

Based on this data, predict what customers will be most interested in next.
Respond ONLY with valid JSON:
{
  "trendingProducts": [
    { "productId": <id>, "name": "<name>", "score": <0-100>, "reason": "<short reason>" }
  ],
  "audienceInsight": "<one paragraph about the audience behaviour>",
  "recommendedAction": "<specific action for the Ad Agent or Website Agent>"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}') as PredictionResult;

  await prisma.agentTask.update({
    where: { id: task.id },
    data: { status: 'completed' },
  });

  return result;
}

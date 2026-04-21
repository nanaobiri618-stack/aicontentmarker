import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { parseAiJSON } from '../utils';
import { getInstitutionAIModel } from '../getAIConfig';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(apiKey: string): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
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

  // Get institution's AI model configuration
  const aiConfig = await getInstitutionAIModel(institutionId);

  // Build a product sales summary
  const productSummary = institution.products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    totalOrders: p.orders.length,
    totalRevenue: p.orders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
  }));

  const prompt = `You are a customer behaviour prediction AI for ${institution.name}, a ${institution.industry} business.
Target audience: ${institution.brandGuides[0]?.targetAudience ?? 'General public'}

Product performance data:
${JSON.stringify(productSummary, null, 2)}

Based on this data, predict what customers will be most interested in next.
Respond ONLY with valid JSON in this exact format:
{
  "trendingProducts": [
    { "productId": <id>, "name": "<name>", "score": <0-100>, "reason": "<short reason>" }
  ],
  "audienceInsight": "<one paragraph about the audience behaviour>",
  "recommendedAction": "<specific action for the Ad Agent or Website Agent>"
}

Important: Return ONLY the JSON object, no markdown, no backticks, no explanation.`;

  try {
    const model = getGemini(aiConfig.apiKey).getGenerativeModel({ model: aiConfig.modelName });
    const genResult = await model.generateContent(prompt);
    const responseText = genResult.response.text();
    const result = parseAiJSON<any>(responseText) as PredictionResult;

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'completed' },
    });

    return result;
  } catch (error: any) {
    console.error('AI API error:', error);
    const fallback: PredictionResult = {
      trendingProducts: institution.products
        .slice(0, 5)
        .map((p) => ({ productId: p.id, name: p.name, score: 50, reason: 'API error fallback.' })),
      audienceInsight: 'Prediction failed: AI API error.',
      recommendedAction: 'Check API key and try again.',
    };

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'failed' },
    });

    return fallback;
  }
}

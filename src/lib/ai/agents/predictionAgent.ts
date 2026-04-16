import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

function isGeminiConfigured() {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIza');
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

  if (!isGeminiConfigured()) {
    const fallback: PredictionResult = {
      trendingProducts: institution.products
        .slice(0, 5)
        .map((p) => ({ productId: p.id, name: p.name, score: 50, reason: 'Fallback (Gemini key not configured).' })),
      audienceInsight: 'Prediction skipped: Gemini API key not configured.',
      recommendedAction: 'Add a valid Gemini API key to enable predictions.',
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
    
    const result = JSON.parse(cleanResponse || '{}') as PredictionResult;

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'completed' },
    });

    return result;
  } catch (error: any) {
    console.error('Gemini API error:', error);
    const fallback: PredictionResult = {
      trendingProducts: institution.products
        .slice(0, 5)
        .map((p) => ({ productId: p.id, name: p.name, score: 50, reason: 'API error fallback.' })),
      audienceInsight: 'Prediction failed: Gemini API error.',
      recommendedAction: 'Check API key and try again.',
    };

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'failed' },
    });

    return fallback;
  }
}

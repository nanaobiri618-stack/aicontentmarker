import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { parseAiJSON } from '../utils';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

export interface Recommendation {
  productId: number;
  name: string;
  reason: string;
  matchScore: number;
}

export async function runRecommendationAgent(userId: number, institutionId?: number): Promise<Recommendation[]> {
  try {
    // 1. Fetch User's Order History
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (orders.length === 0 && !institutionId) {
      // If no history and no specific institution, return empty or common trending (not implemented)
      return [];
    }

    // 2. Fetch Available Products (from specific institution or top 30 overall)
    const availableProducts = await prisma.product.findMany({
      where: institutionId ? { institutionId, isVisible: true } : { isVisible: true },
      take: 30,
    });

    if (availableProducts.length === 0) return [];

    // 3. Prepare Context for Gemini
    const historyText = orders
      .map((o) => `- ${o.product.name} (${o.product.description ?? ''})`)
      .join('\n');

    const productsText = availableProducts
      .map((p) => `ID ${p.id}: ${p.name} - ${p.description ?? ''}`)
      .join('\n');

    const prompt = `You are an AI Personal Shopping Assistant. Your goal is to recommend products to a user based on their purchase history.

User's Purchase History:
${historyText || 'No history yet (Cold start).'}

Available Products to Recommend:
${productsText}

Analyze the user's preferences (categories, themes, price points) and select the TOP 5 products they are most likely to buy next.
Respond ONLY with valid JSON in this exact format:
[
  { "productId": <id>, "name": "<name>", "reason": "<short personalized reason>", "matchScore": <0-100> }
]

Important: Return ONLY the JSON array, no markdown, no backticks, no explanation.`;

    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const recommendations: Recommendation[] = parseAiJSON<any>(responseText);
    return recommendations;
  } catch (error) {
    console.error('Recommendation Agent Error:', error);
    return [];
  }
}

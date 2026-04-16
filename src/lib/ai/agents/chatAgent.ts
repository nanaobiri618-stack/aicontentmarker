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

export async function runChatAgent(institutionId: number, userMessage: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        products: { where: { isVisible: true } },
      },
    });

    if (!institution) {
      return { text: "I'm sorry, I couldn't find information about this business." };
    }

    const productsInfo = institution.products
      .map((p) => `- ${p.name}: GHS ${Number(p.price).toFixed(2)}. ${p.description ?? ''}`)
      .join('\n');

    const systemPrompt = `You are an AI Customer Support Agent for "${institution.name}".
Business Description: ${institution.description || 'A verified business.'}
Industry: ${institution.industry}

Available Products:
${productsInfo || 'No products listed yet.'}

Your goals:
1. Answer questions about the products and the business politely.
2. If the user has a problem or a complaint, acknowledge it, and inform them that you can log an official complaint for the "Main Admin" to review.
3. If they want to log a complaint, encourage them to state "I want to log a complaint: [their message]".

IMPORTANT: If you detect a serious complaint or the user explicitly asks to log one, your response MUST include the special tag [INTENT:COMPLAINT] at the end.`;

    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // We prepend the system prompt as a one-time instruction or just in the first message
    // For simplicity with this SDK, we'll just send the user message combined with context if history is empty
    let fullMsg = userMessage;
    if (history.length === 0) {
      fullMsg = `${systemPrompt}\n\nUser Message: ${userMessage}`;
    }

    const result = await chat.sendMessage(fullMsg);
    const text = result.response.text();

    return {
      text,
      isComplaint: text.includes('[INTENT:COMPLAINT]'),
    };
  } catch (error) {
    console.error('Chat Agent Error:', error);
    return { text: "I'm having trouble connecting to my brain right now. Please try again later.", isComplaint: false };
  }
}
